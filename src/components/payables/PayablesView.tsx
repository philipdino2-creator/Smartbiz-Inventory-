import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Payable } from '../../types';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import {
  AlertCircle,
  Plus,
  CreditCard,
  Trash2,
  X,
  Search,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface PayablesViewProps {
  onOpenPaySupplier: (payable: Payable) => void;
}

export const PayablesView: React.FC<PayablesViewProps> = ({ onOpenPaySupplier }) => {
  const { business, payables, addPayable, deletePayable, currentUser } = useBusiness();

  const [isAddingPayable, setIsAddingPayable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'settled'>('all');

  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [initialDeposit, setInitialDeposit] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const totalOwedToSuppliers = payables.reduce((sum, p) => sum + p.balanceDue, 0);

  const filteredPayables = useMemo(() => {
    return payables.filter(p => {
      if (statusFilter === 'unpaid' && p.balanceDue <= 0) return false;
      if (statusFilter === 'settled' && p.balanceDue > 0) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.vendorName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.vendorPhone && p.vendorPhone.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [payables, statusFilter, searchTerm]);

  const filteredOwedTotal = filteredPayables.reduce((sum, p) => sum + p.balanceDue, 0);

  const dateStamp = new Date().toISOString().slice(0, 10);
  const exportFilename = `smartcore_payables_${dateStamp}`;

  const payableExportHeaders = [
    'Vendor / Supplier',
    'Phone',
    'Description',
    'Total Amount',
    'Amount Paid',
    'Remaining Balance',
    'Due Date',
    'Status',
    'Notes',
  ];

  const payableExportRows = filteredPayables.map(p => [
    p.vendorName,
    p.vendorPhone || '',
    p.description,
    p.totalAmount,
    p.amountPaid,
    p.balanceDue,
    p.dueDate || '',
    p.balanceDue <= 0 ? 'SETTLED' : 'UNPAID',
    p.notes || '',
  ]);

  const handleExportCSV = () => {
    exportToCSV(exportFilename, payableExportHeaders, payableExportRows);
  };

  const handleExportExcel = async () => {
    await exportToExcelXLSX(
      exportFilename,
      'Payables',
      payableExportHeaders,
      payableExportRows,
      `${business.name} — Supplier Payables Liabilities (${filteredPayables.length} records)`
    );
  };

  const handleExportPDF = () => {
    const subtitle = `Filter: ${statusFilter.toUpperCase()} · ${filteredPayables.length} Records`;
    const totalsSummary = [
      {
        label: 'Total Outstanding Liabilities:',
        value: formatCurrency(filteredOwedTotal, business.currencySymbol),
      },
    ];

    exportToPDF(
      exportFilename,
      'Supplier Liabilities & Payables Report',
      subtitle,
      ['Vendor', 'Description', 'Total Owed', 'Paid', 'Balance', 'Due Date', 'Status'],
      filteredPayables.map(p => [
        p.vendorName,
        p.description,
        formatCurrency(p.totalAmount, business.currencySymbol),
        formatCurrency(p.amountPaid, business.currencySymbol),
        formatCurrency(p.balanceDue, business.currencySymbol),
        p.dueDate ? formatDate(p.dueDate) : '—',
        p.balanceDue <= 0 ? 'Settled' : 'Unpaid',
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

  const handleCreatePayable = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTotal = typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount);
    if (!vendorName.trim() || !numericTotal || numericTotal <= 0) return;

    const numericDeposit = typeof initialDeposit === 'number' ? initialDeposit : parseFloat(initialDeposit) || 0;

    addPayable({
      vendorName: vendorName.trim(),
      vendorPhone: vendorPhone.trim() || undefined,
      description: description.trim() || 'Supplies / Services on Credit',
      totalAmount: numericTotal,
      initialDeposit: numericDeposit,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });

    setVendorName('');
    setVendorPhone('');
    setDescription('');
    setTotalAmount('');
    setInitialDeposit('');
    setDueDate('');
    setNotes('');
    setIsAddingPayable(false);
  };

  const handleDelete = (payable: Payable) => {
    if (currentUser.role === 'staff') {
      alert('Permission Denied: Staff members cannot delete supplier debt records.');
      return;
    }
    if (window.confirm(`Delete payable record for ${payable.vendorName}?`)) {
      deletePayable(payable.id);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Suppliers &amp; Payables (What We Owe)</h1>
          <p className="text-xs text-slate-500">Track liabilities, fuel credit, hardware supply balances, and vendor commitments</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            label="Export"
            disabled={filteredPayables.length === 0}
          />
          <button
            onClick={() => setIsAddingPayable(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#7B001C] hover:bg-[#600016] rounded-lg shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Supplier Payable</span>
          </button>
        </div>
      </div>

      {/* Aggregate Payables Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Total Outstanding Business Liabilities
          </span>
          <div className="text-3xl font-bold font-mono text-[#7B001C] tabular-nums mt-1">
            {formatCurrency(totalOwedToSuppliers, business.currencySymbol)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {payables.filter(p => p.balanceDue > 0).length} active supplier and vendor commitments
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 max-w-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Recording debt payments will automatically generate an outgoing cash expense in your ledger to maintain accurate cash balances.
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payables by supplier name, description, phone, or notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7B001C] focus:border-transparent"
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
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({payables.length})
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              statusFilter === 'unpaid'
                ? 'bg-[#7B001C] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unpaid / Partial ({payables.filter(p => p.balanceDue > 0).length})
          </button>
          <button
            onClick={() => setStatusFilter('settled')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              statusFilter === 'settled'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settled ({payables.filter(p => p.balanceDue <= 0).length})
          </button>
        </div>
      </div>

      {/* Payables List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredPayables.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No supplier payables found</p>
            <p className="text-xs text-slate-400 mt-1">
              {payables.length === 0
                ? 'Add items bought on credit or vendor contracts to track balances.'
                : 'No records matched your search or status filter. Try clearing filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Vendor / Supplier</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total Owed</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayables.map(item => {
                  const isUnpaid = item.balanceDue > 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.vendorName}</div>
                        {item.vendorPhone && (
                          <div className="text-[10px] text-slate-400">{item.vendorPhone}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {item.dueDate ? formatDate(item.dueDate) : <span className="text-slate-400 italic">None</span>}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                        {formatCurrency(item.totalAmount, business.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium tabular-nums">
                        {formatCurrency(item.amountPaid, business.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={isUnpaid ? 'text-[#7B001C]' : 'text-slate-400'}>
                          {formatCurrency(item.balanceDue, business.currencySymbol)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.status === 'paid' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                            Paid
                          </span>
                        )}
                        {item.status === 'partial' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200">
                            Partial
                          </span>
                        )}
                        {item.status === 'unpaid' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold text-[#7B001C] bg-rose-50 border border-rose-200">
                            Unpaid
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isUnpaid && (
                            <button
                              onClick={() => onOpenPaySupplier(item)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#7B001C] hover:bg-[#600016] rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                          )}

                          {currentUser.role !== 'staff' && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="Delete Payable"
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
        )}
      </div>

      {/* Add Payable Modal */}
      {isAddingPayable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/50">
              <h3 className="text-base font-bold text-[#7B001C]">+ Record Supplier Liability</h3>
              <button
                onClick={() => setIsAddingPayable(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayable} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor / Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. TotalEnergies Fuel Depot"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7B001C]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={vendorPhone}
                  onChange={e => setVendorPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Items / Service Description *</label>
                <input
                  type="text"
                  placeholder="e.g. 50 Litres generator diesel on tab"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Bill ({business.currencySymbol}) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={e => setTotalAmount(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Deposit ({business.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={initialDeposit}
                    onChange={e => setInitialDeposit(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Agreed to pay balance by end of month"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingPayable(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7B001C] text-white font-bold rounded-lg hover:bg-[#600016]"
                >
                  Save Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
