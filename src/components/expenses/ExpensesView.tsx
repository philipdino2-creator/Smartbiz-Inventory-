import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Expense, Payable } from '../../types';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import { RecurringExpensesView } from './RecurringExpensesView';
import { PayablesView } from '../payables/PayablesView';
import { ReconciliationView } from '../reconciliation/ReconciliationView';
import {
  Search,
  PlusCircle,
  Trash2,
  CalendarClock,
  ArrowDownCircle,
  X,
  CreditCard,
  Scale,
  Receipt,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface ExpensesViewProps {
  onOpenRecordExpense: () => void;
  onNavigateToRecurring?: () => void;
  onOpenPaySupplier?: (payable: Payable) => void;
  initialSubTab?: 'expenses' | 'recurring' | 'payables' | 'reconciliation';
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenRecordExpense,
  onNavigateToRecurring,
  onOpenPaySupplier,
  initialSubTab = 'expenses',
}) => {
  const { business, expenses, recurringExpenses, expenseCategories, deleteExpense, currentUser } = useBusiness();

  const [subTab, setSubTab] = useState<'expenses' | 'recurring' | 'payables' | 'reconciliation'>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const dueRecurringCount = useMemo(() => {
    return recurringExpenses.filter(r => r.status === 'active' && r.nextDueDate <= todayStr).length;
  }, [recurringExpenses, todayStr]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7);
      if (dateFilter === 'today' && exp.date !== today) return false;
      if (dateFilter === 'this_month' && !exp.date.startsWith(currentMonth)) return false;

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

  const confirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    if (currentUser.role === 'staff') {
      showToast('Permission Denied: Staff members cannot delete recorded expenses.');
      setExpenseToDelete(null);
      return;
    }
    deleteExpense(expenseToDelete.id);
    showToast(`Deleted expense "${expenseToDelete.description}".`);
    setExpenseToDelete(null);
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

    exportToPDF(
      exportFilename,
      'OPERATING EXPENSES REPORT',
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
      [
        {
          label: 'Total Filtered Expenses:',
          value: formatCurrency(totalFilteredAmount, business.currencySymbol),
        },
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

      {/* Top Header & Sub-Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Expenses &amp; Payables
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track fuel, generator, rent, supplier payables, and cash drawer reconciliations
            </p>
          </div>

          <div className="flex items-center gap-2">
            {subTab === 'expenses' && (
              <ExportDropdown
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                label="Export"
                disabled={filteredExpenses.length === 0}
              />
            )}
            <button
              onClick={onOpenRecordExpense}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#7B001C] hover:bg-[#600016] rounded-xl shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation (Progressive Disclosure) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setSubTab('expenses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'expenses'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Operating Expenses</span>
          </button>

          <button
            onClick={() => setSubTab('recurring')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'recurring'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Recurring Schedules</span>
            {dueRecurringCount > 0 && (
              <span className="bg-[#7B001C] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {dueRecurringCount} due
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('payables')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'payables'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Supplier Payables</span>
          </button>

          <button
            onClick={() => setSubTab('reconciliation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'reconciliation'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Cash Reconciliation</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: OPERATING EXPENSES (DEFAULT) */}
      {subTab === 'expenses' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Filtered Expenses</span>
              <div className="text-xl font-bold font-mono text-[#7B001C] dark:text-rose-400 tabular-nums">
                {formatCurrency(totalFilteredAmount, business.currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400">{filteredExpenses.length} expense record(s)</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expense Categories</span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {expenseCategories.length} Categories
              </div>
              <span className="text-[11px] text-slate-400">Fuel, Utilities, Internet, Maintenance, Supplies</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs transition-colors">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search expense description, vendor, or receipt reference..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#7B001C] dark:bg-slate-800 dark:text-white outline-hidden"
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
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-hidden"
              >
                <option value="all">All Categories</option>
                {expenseCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

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

          {/* List & Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
            {filteredExpenses.length === 0 ? (
              /* Empty State */
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-[#7B001C] dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                  <ArrowDownCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {searchTerm || selectedCategory !== 'all' || dateFilter !== 'all'
                      ? 'No matching expenses found'
                      : 'No expenses recorded yet'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    {searchTerm || selectedCategory !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your category or date filter.'
                      : 'Keep track of generator fuel, shop rent, supplies, and utilities.'}
                  </p>
                </div>
                <button
                  onClick={onOpenRecordExpense}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#7B001C] hover:bg-[#600016] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Record Expense</span>
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Cards (block sm:hidden) */}
                <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExpenses.map(exp => (
                    <div key={exp.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {exp.description}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatDate(exp.date)} · {exp.vendorName}
                          </div>
                        </div>

                        <span className="font-mono font-bold text-[#7B001C] dark:text-rose-400 text-sm">
                          {formatCurrency(exp.amount, business.currencySymbol)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {exp.category}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 capitalize">{exp.paymentMethod}</span>
                          {currentUser.role !== 'staff' && (
                            <button
                              onClick={() => setExpenseToDelete(exp)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Vendor / Payee</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredExpenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <div>{formatDate(exp.date)}</div>
                            <div className="text-[10px] text-slate-400">{exp.time}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                              {exp.category}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs">
                            <div>{exp.description}</div>
                            {exp.referenceNumber && (
                              <div className="text-[10px] text-slate-400">Ref: {exp.referenceNumber}</div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{exp.vendorName}</td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize">{exp.paymentMethod}</td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-[#7B001C] dark:text-rose-400 tabular-nums">
                            {formatCurrency(exp.amount, business.currencySymbol)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {currentUser.role !== 'staff' && (
                              <button
                                onClick={() => setExpenseToDelete(exp)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
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
              </>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: RECURRING SCHEDULES */}
      {subTab === 'recurring' && (
        <RecurringExpensesView onSuccessToast={showToast} />
      )}

      {/* SUBTAB 3: SUPPLIER PAYABLES */}
      {subTab === 'payables' && (
        <PayablesView onOpenPaySupplier={onOpenPaySupplier || (() => {})} />
      )}

      {/* SUBTAB 4: CASH RECONCILIATION */}
      {subTab === 'reconciliation' && (
        <ReconciliationView />
      )}

      {/* Delete Confirmation Modal (Replaces window.confirm) */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Expense?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{expenseToDelete.description}"</strong> ({formatCurrency(expenseToDelete.amount, business.currencySymbol)})?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExpense}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
