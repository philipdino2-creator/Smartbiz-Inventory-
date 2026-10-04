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
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'this_month'

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

  const handleDelete = (sale: Sale) => {
    if (currentUser.role === 'staff') {
      alert('Permission Denied: Staff members cannot delete recorded sales.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete invoice ${sale.invoiceNumber} for ${sale.customerName}? This will adjust customer debt records.`)) {
      deleteSale(sale.id);
    }
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales &amp; Course Invoices</h1>
          <p className="text-xs text-slate-500">Record customer sales, student fees, and issue official receipts</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
          <button
            onClick={onOpenRecordSale}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Record Sale</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Total Filtered Sales</span>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {formatCurrency(totalVolume, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">{filteredSales.length} total transaction(s)</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Cash Collected</span>
          <div className="text-xl font-bold font-mono text-emerald-600 tabular-nums mt-0.5">
            {formatCurrency(totalCollected, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Actual money received in hand/bank</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Uncollected Customer Debt</span>
          <div className="text-xl font-bold font-mono text-[#7B001C] tabular-nums mt-0.5">
            {formatCurrency(totalUncollected, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Remaining balances to collect</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, customer name, invoice #, or course..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'paid', 'partial', 'unpaid'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All Status' : status}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      {/* Sales List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No sales transactions match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or record a new sale.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map(sale => {
                  const customerObj = customers.find(c => c.id === sale.customerId);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice Number */}
                      <td className="py-3 px-4 font-mono font-semibold text-[#4C0196]">
                        {sale.invoiceNumber}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 text-slate-600">
                        <div>{formatDate(sale.date)}</div>
                        <div className="text-[10px] text-slate-400">{sale.time}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{sale.customerName}</div>
                        {sale.customerPhone && (
                          <div className="text-[10px] text-slate-400">{sale.customerPhone}</div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}>
                        {sale.items.map(i => i.productName).join(', ')}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(sale.totalAmount, business.currencySymbol)}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700 tabular-nums">
                        {formatCurrency(sale.amountPaid, business.currencySymbol)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={sale.balanceDue > 0 ? 'text-[#7B001C]' : 'text-slate-400'}>
                          {formatCurrency(sale.balanceDue, business.currencySymbol)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {sale.paymentStatus === 'paid' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        )}
                        {sale.paymentStatus === 'partial' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Partial</span>
                          </span>
                        )}
                        {sale.paymentStatus === 'unpaid' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#7B001C] bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Credit</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewReceipt(sale)}
                            className="p-1.5 text-slate-600 hover:text-[#4C0196] hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                            title="View / Print Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {sale.balanceDue > 0 && customerObj && (
                            <>
                              <button
                                onClick={() => onOpenCollectDebt(customerObj)}
                                className="px-2 py-1 text-[10px] font-semibold text-[#4C0196] bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 cursor-pointer"
                                title="Collect debt"
                              >
                                Collect
                              </button>

                              {onOpenWhatsAppReminder && (
                                <button
                                  type="button"
                                  onClick={() => onOpenWhatsAppReminder(customerObj, sale)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                  title="Send WhatsApp payment reminder for this invoice"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {currentUser.role !== 'staff' && (
                            <button
                              onClick={() => handleDelete(sale)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="Delete Sale"
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
    </div>
  );
};
