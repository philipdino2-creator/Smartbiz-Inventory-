import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Sale, Customer } from '../../types';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import {
  Search,
  PlusCircle,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  X,
  MessageSquare,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface SalesViewProps {
  onOpenRecordSale: () => void;
  onViewReceipt: (sale: Sale) => void;
  onOpenCollectDebt: (customer: Customer) => void;
  onOpenWhatsAppReminder?: (customer: Customer | null, sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenRecordSale,
  onViewReceipt,
  onOpenCollectDebt,
  onOpenWhatsAppReminder,
}) => {
  const { business, sales, customers, deleteSale, currentUser } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Status filter
      if (statusFilter !== 'all' && sale.paymentStatus !== statusFilter) {
        return false;
      }

      // Date filter
      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7);
      if (dateFilter === 'today' && sale.date !== today) return false;
      if (dateFilter === 'this_month' && !sale.date.startsWith(currentMonth)) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCustomer = sale.customerName.toLowerCase().includes(query);
        const matchesInvoice = sale.invoiceNumber.toLowerCase().includes(query);
        const matchesItems = sale.items.some(i => i.productName.toLowerCase().includes(query));
        return matchesCustomer || matchesInvoice || matchesItems;
      }

      return true;
    });
  }, [sales, statusFilter, dateFilter, searchTerm]);

  // Aggregate stats
  const totalVolume = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCollected = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalUncollected = filteredSales.reduce((sum, s) => sum + s.balanceDue, 0);

  const confirmDeleteSale = () => {
    if (!saleToDelete) return;
    if (currentUser.role === 'staff') {
      showToast('Permission Denied: Staff members cannot delete recorded sales.');
      setSaleToDelete(null);
      return;
    }
    deleteSale(saleToDelete.id);
    showToast(`Invoice #${saleToDelete.invoiceNumber} deleted and balances adjusted.`);
    setSaleToDelete(null);
  };

  const dateStamp = new Date().toISOString().slice(0, 10);
  const exportFilename = `smartcore_sales_report_${dateStamp}`;

  const salesExportHeaders = [
    'Invoice Number',
    'Date',
    'Time',
    'Customer',
    'Phone',
    'Items',
    'Subtotal',
    'Discount',
    'Tax Amount',
    'Total Amount',
    'Amount Paid',
    'Balance Due',
    'Status',
    'Payment Method',
    'Recorded By',
  ];

  const salesExportRows = filteredSales.map(s => [
    s.invoiceNumber,
    s.date,
    s.time,
    s.customerName,
    s.customerPhone || '',
    s.items.map(i => `${i.productName} (x${i.quantity})`).join(', '),
    s.subtotal,
    s.discount,
    s.taxAmount,
    s.totalAmount,
    s.amountPaid,
    s.balanceDue,
    s.paymentStatus.toUpperCase(),
    s.paymentMethod,
    s.recordedByUserName,
  ]);

  const handleExportCSV = () => {
    exportToCSV(exportFilename, salesExportHeaders, salesExportRows);
  };

  const handleExportExcel = async () => {
    await exportToExcelXLSX(
      exportFilename,
      'SalesInvoices',
      salesExportHeaders,
      salesExportRows,
      `${business.name} — Filtered Sales Invoices Report (${filteredSales.length} records)`
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      exportFilename,
      'SALES & INVOICES REPORT',
      `Filtered Records (${filteredSales.length} transactions) · Total Sales: ${formatCurrency(totalVolume, business.currencySymbol)} · Total Collected: ${formatCurrency(totalCollected, business.currencySymbol)}`,
      ['Invoice #', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Balance', 'Status'],
      filteredSales.map(s => [
        s.invoiceNumber,
        formatDate(s.date),
        s.customerName,
        s.items.map(i => i.productName).join(', '),
        formatCurrency(s.totalAmount, business.currencySymbol),
        formatCurrency(s.amountPaid, business.currencySymbol),
        formatCurrency(s.balanceDue, business.currencySymbol),
        s.paymentStatus.toUpperCase(),
      ]),
      [
        { label: 'Total Invoiced Amount:', value: formatCurrency(totalVolume, business.currencySymbol) },
        { label: 'Total Cash Collected:', value: formatCurrency(totalCollected, business.currencySymbol) },
        { label: 'Total Balance Uncollected:', value: formatCurrency(totalUncollected, business.currencySymbol) },
      ],
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
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sales &amp; Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record customer sales, student fee payments, and issue official receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={filteredSales.length === 0}
          />
          <button
            onClick={onOpenRecordSale}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Sale</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Filtered Sales</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalVolume, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">{filteredSales.length} invoice(s)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cash Received</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalCollected, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Actual money in hand / bank</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Uncollected Customer Debt</span>
          <div className="text-xl font-bold font-mono text-[#7B001C] dark:text-rose-400 tabular-nums">
            {formatCurrency(totalUncollected, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Balances waiting for collection</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student/customer name, invoice #, or course..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#4C0196] dark:bg-slate-800 dark:text-white outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['all', 'paid', 'partial', 'unpaid'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer capitalize ${
                  statusFilter === status
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-hidden"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      {/* Main List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
        {filteredSales.length === 0 ? (
          /* Empty state compliant with MVP instruction #7 */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 rounded-2xl flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'No matching sales transactions'
                  : 'No sales yet'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your search query or status filter.'
                  : 'Record your first sale to start tracking revenue and profit.'}
              </p>
            </div>
            <button
              onClick={onOpenRecordSale}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Sale</span>
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (block sm:hidden) */}
            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map(sale => {
                const customerObj = customers.find(c => c.id === sale.customerId);
                return (
                  <div key={sale.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {sale.customerName}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-[#4C0196] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded">
                            #{sale.invoiceNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatDate(sale.date)} · {sale.time} · {sale.paymentMethod}
                        </div>
                      </div>

                      {/* Status Badge */}
                      {sale.paymentStatus === 'paid' && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md text-[10px] border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          <span>PAID</span>
                        </span>
                      )}
                      {sale.paymentStatus === 'partial' && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md text-[10px] border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>PARTIAL</span>
                        </span>
                      )}
                      {sale.paymentStatus === 'unpaid' && (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md text-[10px] border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>UNPAID</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="font-medium truncate">
                        {sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                      </div>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(sale.totalAmount, business.currencySymbol)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Paid</span>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(sale.amountPaid, business.currencySymbol)}
                          </span>
                        </div>
                        {sale.balanceDue > 0 && (
                          <div>
                            <span className="text-[10px] text-slate-400 block">Balance Due</span>
                            <span className="font-mono font-bold text-[#7B001C] dark:text-rose-400">
                              {formatCurrency(sale.balanceDue, business.currencySymbol)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {sale.balanceDue > 0 && customerObj && (
                        <button
                          onClick={() => onOpenCollectDebt(customerObj)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#4C0196] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Collect Debt
                        </button>
                      )}

                      {sale.balanceDue > 0 && onOpenWhatsAppReminder && (
                        <button
                          onClick={() => onOpenWhatsAppReminder(customerObj || null, sale)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Send WhatsApp Payment Reminder"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      <button
                        onClick={() => onViewReceipt(sale)}
                        className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>

                      {currentUser.role !== 'staff' && (
                        <button
                          onClick={() => setSaleToDelete(sale)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
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
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSales.map(sale => {
                    const customerObj = customers.find(c => c.id === sale.customerId);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[#4C0196] dark:text-purple-300">
                          {sale.invoiceNumber}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div>{formatDate(sale.date)}</div>
                          <div className="text-[10px] text-slate-400">{sale.time}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{sale.customerName}</div>
                          {sale.customerPhone && (
                            <div className="text-[10px] text-slate-400">{sale.customerPhone}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}>
                          {sale.items.map(i => i.productName).join(', ')}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(sale.totalAmount, business.currencySymbol)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(sale.amountPaid, business.currencySymbol)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          <span className={sale.balanceDue > 0 ? 'text-[#7B001C] dark:text-rose-400' : 'text-slate-400'}>
                            {formatCurrency(sale.balanceDue, business.currencySymbol)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {sale.paymentStatus === 'paid' && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle className="w-3 h-3" />
                              <span>Paid</span>
                            </span>
                          )}
                          {sale.paymentStatus === 'partial' && (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded text-[11px] border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>Partial</span>
                            </span>
                          )}
                          {sale.paymentStatus === 'unpaid' && (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded text-[11px] border border-rose-200 dark:border-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Credit</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {sale.balanceDue > 0 && customerObj && (
                              <button
                                onClick={() => onOpenCollectDebt(customerObj)}
                                className="px-2 py-1 text-[11px] font-semibold text-[#4C0196] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                                title="Record Debt Collection"
                              >
                                Collect
                              </button>
                            )}

                            {sale.balanceDue > 0 && onOpenWhatsAppReminder && (
                              <button
                                onClick={() => onOpenWhatsAppReminder(customerObj || null, sale)}
                                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                                title="Send WhatsApp Debt Reminder"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => onViewReceipt(sale)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="View and Print Invoice Receipt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {currentUser.role !== 'staff' && (
                              <button
                                onClick={() => setSaleToDelete(sale)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                                title="Delete Sale Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Confirmation Modal (Replaces window.confirm) */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Invoice?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete invoice <strong className="text-slate-800 dark:text-slate-200">#{saleToDelete.invoiceNumber}</strong> for <strong className="text-slate-800 dark:text-slate-200">{saleToDelete.customerName}</strong>? Customer debts and inventory will adjust accordingly.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSaleToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSale}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
