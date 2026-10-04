import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { RecurringExpense, RecurrenceFrequency, PaymentMethod } from '../../types';
import { formatCurrency, formatDate, getTodayDateString, getRecurringDueStatus, calculateNextDueDate } from '../../utils/calculations';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCSV, exportToExcelXLSX, exportToPDF } from '../../utils/exportUtils';
import {
  CalendarClock,
  Plus,
  Play,
  Pause,
  SkipForward,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Edit2,
} from 'lucide-react';

interface RecurringExpensesViewProps {
  onSuccessToast?: (msg: string) => void;
}

export const RecurringExpensesView: React.FC<RecurringExpensesViewProps> = ({ onSuccessToast }) => {
  const {
    business,
    recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    recordRecurringExpenseOccurrence,
    skipRecurringExpenseOccurrence,
    recordAllDueRecurringExpenses,
    expenseCategories,
    currentUser,
  } = useBusiness();

  const today = getTodayDateString();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'active' | 'paused'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(expenseCategories[0] || 'Internet');
  const [amount, setAmount] = useState<number | ''>('');
  const [vendorName, setVendorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [startDate, setStartDate] = useState(today);
  const [nextDueDate, setNextDueDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Filtered recurring list
  const filteredList = useMemo(() => {
    return recurringExpenses.filter(item => {
      const dueStatus = getRecurringDueStatus(item.nextDueDate, today);
      const isDue = item.status === 'active' && (dueStatus === 'overdue' || dueStatus === 'due_today');

      if (statusFilter === 'due' && !isDue) return false;
      if (statusFilter === 'active' && item.status !== 'active') return false;
      if (statusFilter === 'paused' && item.status !== 'paused') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.vendorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [recurringExpenses, statusFilter, searchTerm, today]);

  // Aggregate stats
  const dueCount = recurringExpenses.filter(r => {
    const s = getRecurringDueStatus(r.nextDueDate, today);
    return r.status === 'active' && (s === 'overdue' || s === 'due_today');
  }).length;

  const dueSoonCount = recurringExpenses.filter(r => {
    const s = getRecurringDueStatus(r.nextDueDate, today);
    return r.status === 'active' && s === 'due_soon';
  }).length;

  const upcomingCount = recurringExpenses.filter(r => {
    const s = getRecurringDueStatus(r.nextDueDate, today);
    return r.status === 'active' && s === 'upcoming';
  }).length;

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setDescription('');
    setCategory(expenseCategories[0] || 'Internet');
    setAmount('');
    setVendorName('');
    setPaymentMethod('Bank Transfer');
    setFrequency('monthly');
    setStartDate(today);
    setNextDueDate(today);
    setEndDate('');
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RecurringExpense) => {
    setEditingId(item.id);
    setDescription(item.description);
    setCategory(item.category);
    setAmount(item.amount);
    setVendorName(item.vendorName);
    setPaymentMethod(item.paymentMethod);
    setFrequency(item.frequency);
    setStartDate(item.startDate);
    setNextDueDate(item.nextDueDate);
    setEndDate(item.endDate || '');
    setNotes(item.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!description.trim() || !numAmount || numAmount <= 0) {
      setError('Please provide a valid description and amount.');
      return;
    }

    if (editingId) {
      updateRecurringExpense(editingId, {
        description: description.trim(),
        category,
        amount: numAmount,
        vendorName: vendorName.trim() || 'General Vendor',
        paymentMethod,
        frequency,
        startDate,
        nextDueDate,
        endDate: endDate || undefined,
        notes: notes.trim() || undefined,
      });
      if (onSuccessToast) onSuccessToast('Recurring expense updated.');
    } else {
      addRecurringExpense({
        description: description.trim(),
        category,
        amount: numAmount,
        vendorName: vendorName.trim() || 'General Vendor',
        paymentMethod,
        frequency,
        startDate,
        nextDueDate,
        endDate: endDate || undefined,
        status: 'active',
        notes: notes.trim() || undefined,
      });
      if (onSuccessToast) onSuccessToast('New recurring expense schedule created.');
    }

    setIsModalOpen(false);
  };

  const handleRecordOccurrence = (item: RecurringExpense) => {
    const exp = recordRecurringExpenseOccurrence(item.id);
    if (exp) {
      if (onSuccessToast) {
        onSuccessToast(`Recorded ${item.description} (${formatCurrency(item.amount, business.currencySymbol)}). Next due: ${formatDate(calculateNextDueDate(item.nextDueDate, item.frequency))}`);
      }
    } else {
      alert('This recurring expense occurrence has already been recorded.');
    }
  };

  const handleSkipOccurrence = (item: RecurringExpense) => {
    if (window.confirm(`Skip the current due payment for "${item.description}"? The next due date will advance to ${formatDate(calculateNextDueDate(item.nextDueDate, item.frequency))} without adding an expense.`)) {
      skipRecurringExpenseOccurrence(item.id);
      if (onSuccessToast) onSuccessToast('Occurrence skipped and schedule advanced.');
    }
  };

  const handleTogglePause = (item: RecurringExpense) => {
    const nextStatus = item.status === 'paused' ? 'active' : 'paused';
    updateRecurringExpense(item.id, { status: nextStatus });
    if (onSuccessToast) {
      onSuccessToast(`Schedule ${nextStatus === 'paused' ? 'paused' : 'resumed'}.`);
    }
  };

  const handleDelete = (item: RecurringExpense) => {
    if (currentUser.role === 'staff') {
      alert('Permission Denied: Staff members cannot delete recurring expense schedules.');
      return;
    }
    if (window.confirm(`Delete recurring schedule for "${item.description}"? (Note: Past recorded expense records will remain safe and intact in your ledger).`)) {
      deleteRecurringExpense(item.id);
      if (onSuccessToast) onSuccessToast('Recurring expense deleted.');
    }
  };

  const handleRecordAllDue = () => {
    if (dueCount === 0) return;
    if (window.confirm(`Record all ${dueCount} due and overdue recurring expenses now? This will create standard expense transactions in your ledger.`)) {
      const res = recordAllDueRecurringExpenses();
      if (onSuccessToast) {
        onSuccessToast(`Successfully recorded ${res.count} due expenses totaling ${formatCurrency(res.totalAmount, business.currencySymbol)}.`);
      }
    }
  };

  // Export filtered data
  const exportHeaders = ['Description', 'Category', 'Vendor/Payee', 'Amount', 'Frequency', 'Next Due Date', 'Status', 'Start Date', 'Notes'];
  const exportRows = filteredList.map(r => [
    r.description,
    r.category,
    r.vendorName,
    r.amount,
    r.frequency,
    r.nextDueDate,
    r.status,
    r.startDate,
    r.notes || '',
  ]);

  const handleExportCSV = () => {
    exportToCSV(`smartcore_recurring_expenses_${today}`, exportHeaders, exportRows);
  };

  const handleExportExcel = async () => {
    await exportToExcelXLSX(
      `smartcore_recurring_expenses_${today}`,
      'RecurringExpenses',
      exportHeaders,
      exportRows,
      `${business.name} — Recurring Expenses Schedule`
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      `smartcore_recurring_expenses_${today}`,
      'RECURRING EXPENSES SCHEDULE',
      `Active recurring commitments and subscriptions · ${business.name}`,
      ['Description', 'Category', 'Vendor', 'Amount', 'Freq', 'Next Due', 'Status'],
      filteredList.map(r => [
        r.description,
        r.category,
        r.vendorName,
        formatCurrency(r.amount, business.currencySymbol),
        r.frequency,
        formatDate(r.nextDueDate),
        r.status.toUpperCase(),
      ]),
      [
        {
          label: 'Total Monthly Equivalent',
          value: formatCurrency(
            filteredList.reduce((sum, r) => {
              if (r.frequency === 'daily') return sum + r.amount * 30;
              if (r.frequency === 'weekly') return sum + r.amount * 4;
              if (r.frequency === 'biweekly') return sum + r.amount * 2;
              if (r.frequency === 'quarterly') return sum + r.amount / 3;
              if (r.frequency === 'yearly') return sum + r.amount / 12;
              return sum + r.amount;
            }, 0),
            business.currencySymbol
          ),
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
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recurring Expenses &amp; Subscriptions</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#4C0196] border border-purple-200">
              {recurringExpenses.length} Schedules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate tracking for rent, internet, generator diesel, electricity tokens, and salaries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dueCount > 0 && (
            <button
              onClick={handleRecordAllDue}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#7B001C] hover:bg-[#600016] rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record {dueCount} Due Expense(s)</span>
            </button>
          )}

          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Schedule</span>
          </button>
        </div>
      </div>

      {/* Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Due Today or Overdue</span>
            <AlertCircle className={`w-4 h-4 ${dueCount > 0 ? 'text-[#7B001C]' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${dueCount > 0 ? 'text-[#7B001C]' : 'text-slate-900'}`}>
            {dueCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Requires recording into current expenses</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Due Soon (Within 3 Days)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {dueSoonCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Approaching due date</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Upcoming Active Commitments</span>
            <CalendarClock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {upcomingCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Scheduled for future dates</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search recurring expense, vendor, or category..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196]"
        />

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          {(['all', 'due', 'active', 'paused'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? 'All Schedules' : tab === 'due' ? `Due (${dueCount})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Recurring Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No recurring expense schedules found</p>
            <p className="text-xs text-slate-400 mt-1">
              Add recurring templates for generator diesel, Starlink data, or facility rent.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Expense Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor / Payee</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Next Due Date</th>
                  <th className="py-3 px-4 text-center">Due Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map(item => {
                  const dueStatus = getRecurringDueStatus(item.nextDueDate, today);
                  const isDue = item.status === 'active' && (dueStatus === 'overdue' || dueStatus === 'due_today');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.description}</div>
                        {item.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.notes}</div>}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{item.vendorName}</td>

                      <td className="py-3 px-4 capitalize font-medium text-slate-700">
                        {item.frequency}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(item.amount, business.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {formatDate(item.nextDueDate)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.status === 'paused' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Paused
                          </span>
                        ) : item.status === 'completed' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                            Ended
                          </span>
                        ) : dueStatus === 'overdue' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-[#7B001C] border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7B001C]" />
                            Overdue
                          </span>
                        ) : dueStatus === 'due_today' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Due Today
                          </span>
                        ) : dueStatus === 'due_soon' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                            Due Soon
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            Upcoming
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Occurrence Button */}
                          <button
                            onClick={() => handleRecordOccurrence(item)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                              isDue
                                ? 'bg-[#7B001C] text-white hover:bg-[#600016] shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Record this expense now into the ledger"
                          >
                            Record
                          </button>

                          {/* Skip occurrence button */}
                          <button
                            onClick={() => handleSkipOccurrence(item)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Skip this cycle and advance to next due date"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                          </button>

                          {/* Pause / Resume button */}
                          <button
                            onClick={() => handleTogglePause(item)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title={item.status === 'paused' ? 'Resume Schedule' : 'Pause Schedule'}
                          >
                            {item.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Edit Schedule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {currentUser.role !== 'staff' && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete Schedule"
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
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Recurring Schedule' : '+ New Recurring Expense Schedule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Starlink Monthly Internet Subscription"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196]"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ({business.currencySymbol}) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency *</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium capitalize"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="POS">POS Terminal</option>
                    <option value="Mobile Payment">Mobile Payment (OPay)</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Due Date *</label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={e => setNextDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Ongoing"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Payee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. TotalEnergies or BEDC"
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Account details, standing order reference"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4C0196] text-white font-bold rounded-lg hover:bg-[#3b0075]"
                >
                  {editingId ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
