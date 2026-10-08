import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Customer, Sale } from '../../types';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import {
  Search,
  Plus,
  Users,
  AlertCircle,
  Phone,
  MessageSquare,
  History,
  X,
  CreditCard,
  Trash2,
} from 'lucide-react';

interface CustomersViewProps {
  onOpenCollectDebt: (customer: Customer) => void;
  onViewSaleReceipt: (sale: Sale) => void;
  onOpenWhatsAppReminder?: (customer: Customer, sale?: Sale) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenCollectDebt,
  onViewSaleReceipt,
  onOpenWhatsAppReminder,
}) => {
  const { business, customers, sales, addCustomer, updateCustomer, deleteCustomer, currentUser } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'debtors'>('debtors');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [custToDelete, setCustToDelete] = useState<Customer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (filterMode === 'debtors' && c.outstandingDebt <= 0) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customers, filterMode, searchTerm]);

  // Aggregate debt
  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingDebt, 0);
  const totalDebtorsCount = customers.filter(c => c.outstandingDebt > 0).length;

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined,
      notes: newNotes.trim() || undefined,
    });

    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewNotes('');
    setIsAddingCustomer(false);
    showToast(`Added customer profile for "${newName.trim()}".`);
  };

  const confirmDeleteCustomer = () => {
    if (!custToDelete) return;
    if (currentUser.role === 'staff') {
      showToast('Permission Denied: Staff members cannot delete customer profiles.');
      setCustToDelete(null);
      return;
    }
    deleteCustomer(custToDelete.id);
    if (selectedCustomer?.id === custToDelete.id) setSelectedCustomer(null);
    showToast(`Deleted customer profile for "${custToDelete.name}".`);
    setCustToDelete(null);
  };

  // WhatsApp reminder message generator
  const getWhatsAppReminderUrl = (customer: Customer) => {
    if (!customer.phone) return null;
    let cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '234' + cleanPhone.slice(1);
    }
    const message = `Hello ${customer.name}, this is a gentle reminder from ${business.name} regarding your outstanding balance of ${business.currencySymbol}${customer.outstandingDebt.toLocaleString()}. Please let us know when convenient to settle via transfer or cash. Thank you!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Customer sales history
  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales.filter(s => s.customerId === selectedCustomer.id);
  }, [selectedCustomer, sales]);

  const dateStamp = new Date().toISOString().slice(0, 10);
  const exportFilename = `smartcore_customers_${filterMode}_${dateStamp}`;

  const customerExportHeaders = [
    'Customer Name',
    'Phone Number',
    'Email',
    'Address',
    'Total Purchases',
    'Total Paid',
    'Outstanding Debt',
    'Debt Status',
    'Notes',
  ];

  const customerExportRows = filteredCustomers.map(c => [
    c.name,
    c.phone,
    c.email || '',
    c.address || '',
    c.totalPurchases,
    c.totalPaid,
    c.outstandingDebt,
    c.outstandingDebt > 0 ? 'OWES_MONEY' : 'SETTLED',
    c.notes || '',
  ]);

  const handleExportCSV = () => {
    exportToCSV(exportFilename, customerExportHeaders, customerExportRows);
  };

  const handleExportExcel = async () => {
    await exportToExcelXLSX(
      exportFilename,
      'Customers',
      customerExportHeaders,
      customerExportRows,
      `${business.name} — ${filterMode === 'debtors' ? 'Debtor Balances' : 'Customers'} List (${filteredCustomers.length} records)`
    );
  };

  const handleExportPDF = () => {
    const subtitle = `Filter: ${filterMode === 'debtors' ? 'Customers with Outstanding Debt' : 'All Customers'} · ${filteredCustomers.length} Records`;
    const totalsSummary = [
      {
        label: 'Total Outstanding Debt:',
        value: formatCurrency(
          filteredCustomers.reduce((sum, c) => sum + c.outstandingDebt, 0),
          business.currencySymbol
        ),
      },
    ];

    exportToPDF(
      exportFilename,
      filterMode === 'debtors' ? 'Debtor Balances & Receivables Report' : 'Customer Directory Report',
      subtitle,
      ['Name', 'Phone', 'Purchases', 'Total Paid', 'Outstanding Debt', 'Status'],
      filteredCustomers.map(c => [
        c.name,
        c.phone,
        formatCurrency(c.totalPurchases, business.currencySymbol),
        formatCurrency(c.totalPaid, business.currencySymbol),
        formatCurrency(c.outstandingDebt, business.currencySymbol),
        c.outstandingDebt > 0 ? 'Owing' : 'Settled',
      ]),
      totalsSummary,
      {
        name: business.name,
        address: business.address,
        phone: business.phone,
        email: business.email,
      }
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customers &amp; Debt Tracking</h1>
          <p className="text-xs text-slate-500">Track client balances, fees owed, and collect pending debt payments</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            label="Export"
            disabled={filteredCustomers.length === 0}
          />
          <button
            onClick={() => setIsAddingCustomer(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-lg shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Aggregate Receivables Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Total Money Owed to Us (Receivables)</span>
            <AlertCircle className="w-4 h-4 text-[#7B001C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#7B001C] tabular-nums">
            {formatCurrency(totalReceivables, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {totalDebtorsCount} customer(s) owing money
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Total Registered Customers</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {customers.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {customers.length - totalDebtorsCount} customer(s) fully settled
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, phone number, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setFilterMode('debtors')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filterMode === 'debtors'
                ? 'bg-[#7B001C] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Debtors Only ({totalDebtorsCount})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Customers ({customers.length})
          </button>
        </div>
      </div>

      {/* Customers List Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-purple-50 text-[#4C0196] rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {filterMode === 'debtors' ? 'No outstanding customer debts!' : 'No customer records found'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {filterMode === 'debtors'
                  ? 'All students and clients have settled their invoices.'
                  : 'Add a customer or record a sale to start tracking client debt & history.'}
              </p>
            </div>
            <button
              onClick={() => setIsAddingCustomer(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Customer</span>
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (block sm:hidden) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {filteredCustomers.map(cust => {
                const hasDebt = cust.outstandingDebt > 0;
                return (
                  <div key={cust.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {cust.phone || 'No phone'} {cust.email ? `· ${cust.email}` : ''}
                        </div>
                      </div>

                      {hasDebt ? (
                        <span className="font-mono font-bold text-[#7B001C] text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Owes: {formatCurrency(cust.outstandingDebt, business.currencySymbol)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          CLEAR
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg text-slate-600">
                      <span>Purchases: {formatCurrency(cust.totalPurchases, business.currencySymbol)}</span>
                      <span>Paid: {formatCurrency(cust.totalPaid, business.currencySymbol)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {hasDebt && (
                        <>
                          <button
                            onClick={() => onOpenCollectDebt(cust)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-lg transition-colors cursor-pointer"
                          >
                            Collect Debt
                          </button>
                          {onOpenWhatsAppReminder && (
                            <button
                              onClick={() => onOpenWhatsAppReminder(cust)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        History
                      </button>

                      {currentUser.role !== 'staff' && (
                        <button
                          onClick={() => setCustToDelete(cust)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4 text-right">Total Purchases</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Debt Balance</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map(cust => {
                    const hasDebt = cust.outstandingDebt > 0;
                    return (
                      <tr
                        key={cust.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedCustomer(cust)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{cust.name}</div>
                          {cust.notes && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">{cust.notes}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {cust.phone || <span className="text-slate-400 italic">None</span>}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                          {formatCurrency(cust.totalPurchases, business.currencySymbol)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium tabular-nums">
                          {formatCurrency(cust.totalPaid, business.currencySymbol)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          <span className={hasDebt ? 'text-[#7B001C]' : 'text-slate-400'}>
                            {formatCurrency(cust.outstandingDebt, business.currencySymbol)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {hasDebt && (
                              <>
                                <button
                                  onClick={() => onOpenCollectDebt(cust)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-md transition-colors cursor-pointer shadow-2xs"
                                  title="Collect Debt Payment"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Collect</span>
                                </button>

                                {onOpenWhatsAppReminder && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenWhatsAppReminder(cust)}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                    title="Send Polite WhatsApp Debt Reminder"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}

                            <button
                              onClick={() => setSelectedCustomer(cust)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                              title="View Profile & Sales History"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {currentUser.role !== 'staff' && (
                              <button
                                onClick={() => setCustToDelete(cust)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Delete Customer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">Customer Profile &amp; Transaction Ledger</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Phone:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Email:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Address:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.address || 'N/A'}</span>
                </div>
              </div>

              {/* Balance Bar */}
              <div className="flex items-center justify-between p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl">
                <div>
                  <span className="text-[11px] text-purple-900 font-medium">Outstanding Debt Balance</span>
                  <div className="text-xl font-bold font-mono text-[#7B001C] tabular-nums">
                    {formatCurrency(selectedCustomer.outstandingDebt, business.currencySymbol)}
                  </div>
                </div>
                {selectedCustomer.outstandingDebt > 0 && (
                  <div className="flex items-center gap-2">
                    {onOpenWhatsAppReminder && (
                      <button
                        type="button"
                        onClick={() => onOpenWhatsAppReminder(selectedCustomer)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        title="Send polite WhatsApp payment reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Reminder</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onOpenCollectDebt(selectedCustomer);
                        setSelectedCustomer(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Record Debt Payment
                    </button>
                  </div>
                )}
              </div>

              {/* Sales History */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Sales &amp; Course Invoices ({customerSales.length})
                </h4>
                {customerSales.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No previous sales records for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {customerSales.map(sale => (
                      <div
                        key={sale.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#4C0196]">{sale.invoiceNumber}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600">{formatDate(sale.date)}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900 tabular-nums">
                            {formatCurrency(sale.totalAmount, business.currencySymbol)}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {sale.balanceDue > 0 ? (
                              <span className="text-[#7B001C] font-semibold">
                                Owes: {formatCurrency(sale.balanceDue, business.currencySymbol)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">Fully Paid</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">+ Add New Customer</h3>
              <button
                onClick={() => setIsAddingCustomer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer / Student Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Favour Ebere"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (with WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential / Business Address</label>
                <input
                  type="text"
                  placeholder="e.g. Okpanam Road, Asaba"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  placeholder="e.g. Enrolled in morning weekday UI/UX cohort"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomer(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4C0196] text-white font-bold rounded-lg hover:bg-[#3b0075]"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Replaces window.confirm) */}
      {custToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Delete Customer?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete profile for <strong>"{custToDelete.name}"</strong>?
                {custToDelete.outstandingDebt > 0 && (
                  <span className="block text-rose-600 font-semibold mt-1">
                    Warning: This customer currently owes {formatCurrency(custToDelete.outstandingDebt, business.currencySymbol)}.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCustToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCustomer}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
