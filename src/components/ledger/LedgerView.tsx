import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import {
  Search,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from 'lucide-react';

interface LedgerItem {
  id: string;
  type: 'sale' | 'expense' | 'debt_collection' | 'supplier_payment';
  date: string;
  time: string;
  partyName: string;
  description: string;
  amount: number;
  paymentMethod: string;
  recordedBy: string;
  reference?: string;
  isPositive: boolean;
}

export const LedgerView: React.FC = () => {
  const { business, sales, expenses, debtPayments } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('all');

  // Build unified ledger
  const allTransactions: LedgerItem[] = useMemo(() => {
    const list: LedgerItem[] = [];

    // Sales (Cash received)
    sales.forEach(s => {
      list.push({
        id: `ledger_sale_${s.id}`,
        type: 'sale',
        date: s.date,
        time: s.time,
        partyName: s.customerName,
        description: `Sale ${s.invoiceNumber}: ${s.items.map(i => i.productName).join(', ')}`,
        amount: s.amountPaid, // Cash actually brought in by sale
        paymentMethod: s.paymentMethod,
        recordedBy: s.recordedByUserName,
        reference: s.invoiceNumber,
        isPositive: true,
      });
    });

    // Debt collections from customers
    debtPayments
      .filter(p => p.targetType === 'customer')
      .forEach(p => {
        list.push({
          id: `ledger_debt_${p.id}`,
          type: 'debt_collection',
          date: p.date,
          time: p.time,
          partyName: p.targetName,
          description: `Customer Debt Settlement from ${p.targetName} (${p.notes || 'Balance paid'})`,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          recordedBy: p.recordedByUserName,
          reference: p.reference,
          isPositive: true,
        });
      });

    // Expenses (Cash out)
    expenses.forEach(e => {
      list.push({
        id: `ledger_exp_${e.id}`,
        type: 'expense',
        date: e.date,
        time: e.time,
        partyName: e.vendorName,
        description: `${e.category}: ${e.description}`,
        amount: e.amount,
        paymentMethod: e.paymentMethod,
        recordedBy: e.recordedByUserName,
        reference: e.referenceNumber,
        isPositive: false,
      });
    });

    // Sort chronologically descending
    return list.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  }, [sales, expenses, debtPayments]);

  // Filter
  const filteredLedger = useMemo(() => {
    return allTransactions.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (methodFilter !== 'all' && item.paymentMethod !== methodFilter) return false;

      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7);
      if (datePreset === 'today' && item.date !== today) return false;
      if (datePreset === 'this_month' && !item.date.startsWith(currentMonth)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.partyName.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.reference && item.reference.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allTransactions, typeFilter, methodFilter, datePreset, searchTerm]);

  // Total cash inflow vs outflow
  const totalInflow = filteredLedger.filter(i => i.isPositive).reduce((sum, i) => sum + i.amount, 0);
  const totalOutflow = filteredLedger.filter(i => !i.isPositive).reduce((sum, i) => sum + i.amount, 0);
  const netCashChange = totalInflow - totalOutflow;

  const dateStamp = new Date().toISOString().slice(0, 10);
  const exportFilename = `smartcore_ledger_${dateStamp}`;

  const ledgerExportHeaders = [
    'Date',
    'Time',
    'Transaction Type',
    'Party / Entity',
    'Description',
    'Payment Method',
    'Reference / Invoice #',
    'Cash Inflow (+)',
    'Cash Outflow (-)',
    'Net Impact',
    'Recorded By',
  ];

  const ledgerExportRows = filteredLedger.map(i => [
    i.date,
    i.time,
    i.type.toUpperCase(),
    i.partyName,
    i.description,
    i.paymentMethod,
    i.reference || '',
    i.isPositive ? i.amount : 0,
    !i.isPositive ? i.amount : 0,
    i.isPositive ? `+${i.amount}` : `-${i.amount}`,
    i.recordedBy,
  ]);

  const handleExportCSV = () => {
    exportToCSV(exportFilename, ledgerExportHeaders, ledgerExportRows);
  };

  const handleExportExcel = async () => {
    await exportToExcelXLSX(
      exportFilename,
      'TransactionsLedger',
      ledgerExportHeaders,
      ledgerExportRows,
      `${business.name} — Filtered Cash Ledger Audit (${filteredLedger.length} entries)`
    );
  };

  const handleExportPDF = () => {
    const subtitle = `Filter: ${typeFilter !== 'all' ? typeFilter : 'All Types'} · Method: ${methodFilter !== 'all' ? methodFilter : 'All Channels'} · Period: ${datePreset} · ${filteredLedger.length} Entries`;

    const totalsSummary = [
      {
        label: 'Total Inflow (+):',
        value: `+${formatCurrency(totalInflow, business.currencySymbol)}`,
      },
      {
        label: 'Total Outflow (-):',
        value: `-${formatCurrency(totalOutflow, business.currencySymbol)}`,
      },
      {
        label: 'Net Cash Flow:',
        value: formatCurrency(netCashChange, business.currencySymbol),
      },
    ];

    exportToPDF(
      exportFilename,
      'Cash Flow & Transaction Ledger Report',
      subtitle,
      ['Date/Time', 'Party', 'Description', 'Method', 'Reference', 'Amount'],
      filteredLedger.map(i => [
        `${i.date} ${i.time}`,
        i.partyName,
        i.description,
        i.paymentMethod,
        i.reference || '—',
        i.isPositive ? `+${formatCurrency(i.amount, business.currencySymbol)}` : `-${formatCurrency(i.amount, business.currencySymbol)}`,
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Complete Transaction Ledger</h1>
          <p className="text-xs text-slate-500">Real-time chronologically sorted audit trail of every cash inflow &amp; outflow</p>
        </div>
        <ExportDropdown
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          label="Export Ledger"
          disabled={filteredLedger.length === 0}
        />
      </div>

      {/* Aggregate Cash Flow Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Cash Inflows (+)</span>
          <div className="text-xl font-bold font-mono text-emerald-600 tabular-nums mt-0.5">
            +{formatCurrency(totalInflow, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Total payments collected</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Cash Outflows (-)</span>
          <div className="text-xl font-bold font-mono text-[#7B001C] tabular-nums mt-0.5">
            -{formatCurrency(totalOutflow, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Total operating expenses paid</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Net Period Cash Position</span>
          <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${netCashChange >= 0 ? 'text-slate-900' : 'text-amber-600'}`}>
            {formatCurrency(netCashChange, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Cash remaining after expenses</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search party name, description, or reference..."
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Transaction Types</option>
            <option value="sale">Sales Only</option>
            <option value="debt_collection">Customer Debt Collections</option>
            <option value="expense">Operating Expenses</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Payment Channels</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="POS">POS Terminal</option>
            <option value="Mobile Payment">Mobile Payment (OPay)</option>
          </select>

          {/* Date Filter */}
          <select
            value={datePreset}
            onChange={e => setDatePreset(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All History</option>
            <option value="today">Today Only</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredLedger.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No transactions match your ledger query</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting filters to view all audit entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer / Vendor</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Method &amp; Ref</th>
                  <th className="py-3 px-4 text-right">Inflow (+)</th>
                  <th className="py-3 px-4 text-right">Outflow (-)</th>
                  <th className="py-3 px-4 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      <div>{formatDate(item.date)}</div>
                      <div className="text-[10px] text-slate-400">{item.time}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-[#7B001C]'
                      }`}>
                        {item.isPositive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        <span className="capitalize">{item.type.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">{item.partyName}</td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <div>{item.paymentMethod}</div>
                      {item.reference && <div className="text-[10px] text-slate-400 font-mono">{item.reference}</div>}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {item.isPositive ? `+${formatCurrency(item.amount, business.currencySymbol)}` : '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#7B001C] tabular-nums">
                      {!item.isPositive ? `-${formatCurrency(item.amount, business.currencySymbol)}` : '—'}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">{item.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
