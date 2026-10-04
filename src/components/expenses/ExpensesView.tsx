import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import {
  Search,
  PlusCircle,
  Trash2,
  CalendarClock,
  ArrowDownCircle,
  X,
} from 'lucide-react';

interface ExpensesViewProps {
  onOpenRecordExpense: () => void;
  onNavigateToRecurring?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenRecordExpense, onNavigateToRecurring }) => {
  const { business, expenses, recurringExpenses, expenseCategories, deleteExpense, currentUser } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const todayStr = new Date().toISOString().slice(0, 10);
  const dueRecurringCount = useMemo(() => {
    return recurringExpenses.filter(r => r.status === 'active' && r.nextDueDate <= todayStr).length;
  }, [recurringExpenses, todayStr]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Category
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      // Date
      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7);
      if (dateFilter === 'today' && exp.date !== today) return false;
      if (dateFilter === 'this_month' && !exp.date.startsWith(currentMonth)) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          exp.description.toLowerCase().includes(q) ||
          exp.vendorName.toLowerCase().includes(q) ||
          exp.category.toLowerCase().includes(q) ||
          (exp.referenceNumber && exp.referenceNumber.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [expenses, selectedCategory, dateFilter, searchTerm]);

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (exp: Expense) => {
    if (currentUser.role === 'staff') {
      alert('Permission Denied: Staff members cannot delete recorded expenses.');
      return;
    }
    if (window.confirm(`Delete expense "${exp.description}" (${formatCurrency(exp.amount, business.currencySymbol)})?`)) {
      deleteExpense(exp.id);
    }
  };

  const dateStamp = new Date().toISOString().slice(0, 10);
  const exportFilename = `smartcore_expenses_report_${dateStamp}`;

  const expenseExportHeaders = [
    'Date',
    'Time',
    'Category',
    'Description',
    'Amount',
    'Vendor / Payee',
    'Payment Method',
    'Reference / Receipt #',
    'Recorded By',
    'Notes',
  ];

  const expenseExportRows = filteredExpenses.map(e => [
    e.date,
    e.time,
    e.category,
    e.description,
    e.amount,
    e.vendorName,
    e.paymentMethod,
    e.referenceNumber || '',
    e.recordedByUserName,
    e.notes || '',
  ]);

  const handleExportCSV = () => {
    exportToCSV(exportFilename, expenseExportHeaders, expenseExportRows);
  };

  const handleExportExcel = async () => {
    await exportToExcelXLSX(
      exportFilename,
      'Expenses',
      expenseExportHeaders,
      expenseExportRows,
      `${business.name} — Filtered Operating Expenses Report (${filteredExpenses.length} records)`
    );
  };

  const handleExportPDF = () => {
    const subtitle = `Filter: ${selectedCategory !== 'all' ? selectedCategory : 'All Categories'} · Period: ${dateFilter === 'all' ? 'All Dates' : dateFilter === 'today' ? 'Today' : 'This Month'} · ${filteredExpenses.length} Records`;

    const totalsSummary = [
      {
        label: 'Total Filtered Expenses:',
        value: formatCurrency(totalFilteredAmount, business.currencySymbol),
      },
    ];

    exportToPDF(
      exportFilename,
      'Operating Expenses Report',
      subtitle,
      ['Date', 'Category', 'Description', 'Amount', 'Vendor/Payee', 'Method'],
      filteredExpenses.map(e => [
        e.date,
        e.category,
        e.description,
        formatCurrency(e.amount, business.currencySymbol),
        e.vendorName,
        e.paymentMethod,
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operating Expenses</h1>
          <p className="text-xs text-slate-500">Track fuel, generator, electricity, maintenance, and facility costs</p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToRecurring && (
            <button
              onClick={onNavigateToRecurring}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer"
              title="View and schedule recurring bills & subscriptions"
            >
              <CalendarClock className="w-3.5 h-3.5 text-[#4C0196]" />
              <span className="hidden sm:inline">Recurring Schedules</span>
              <span className="sm:hidden">Recurring</span>
              {dueRecurringCount > 0 && (
                <span className="bg-[#7B001C] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                  {dueRecurringCount} due
                </span>
              )}
            </button>
          )}
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            label="Export"
            disabled={filteredExpenses.length === 0}
          />
          <button
            onClick={onOpenRecordExpense}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#7B001C] hover:bg-[#600016] rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Total Filtered Expenses</span>
          <div className="text-xl font-bold font-mono text-[#7B001C] tabular-nums mt-0.5">
            {formatCurrency(totalFilteredAmount, business.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">{filteredExpenses.length} expense record(s)</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Categories in Use</span>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {expenseCategories.length} Categories
          </div>
          <span className="text-[11px] text-slate-400">Fuel, Utilities, Internet, Maintenance, etc.</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expense description, vendor, or receipt reference..."
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

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Categories</option>
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Date Range Dropdown */}
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

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <ArrowDownCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No expense records found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your filters or record an expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Vendor / Payee</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date & Time */}
                    <td className="py-3 px-4 text-slate-600">
                      <div>{formatDate(exp.date)}</div>
                      <div className="text-[10px] text-slate-400">{exp.time}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {exp.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs">
                      <div>{exp.description}</div>
                      {exp.referenceNumber && (
                        <div className="text-[10px] text-slate-400">Ref: {exp.referenceNumber}</div>
                      )}
                    </td>

                    {/* Vendor */}
                    <td className="py-3 px-4 text-slate-600">{exp.vendorName}</td>

                    {/* Payment Method */}
                    <td className="py-3 px-4 text-slate-600">{exp.paymentMethod}</td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#7B001C] tabular-nums">
                      {formatCurrency(exp.amount, business.currencySymbol)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {currentUser.role !== 'staff' && (
                        <button
                          onClick={() => handleDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
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
