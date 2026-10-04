import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { PaymentMethod } from '../../types';
import { getTodayDateString, getCurrentTimeString } from '../../utils/calculations';
import { X, CheckCircle2, Plus } from 'lucide-react';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { business, expenseCategories, addExpenseCategory, addExpense } = useBusiness();

  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [category, setCategory] = useState(expenseCategories[0] || 'Fuel');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [vendorName, setVendorName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      addExpenseCategory(newCategoryName.trim());
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCustomCategory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for the expense.');
      return;
    }

    try {
      addExpense({
        date,
        time,
        category,
        description: description.trim(),
        amount: numericAmount,
        paymentMethod,
        vendorName: vendorName.trim() || 'General Vendor / Cashier',
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record expense.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/50">
          <div>
            <h2 className="text-base font-bold text-[#7B001C]">+ Record Business Expense</h2>
            <p className="text-xs text-slate-500">Record generator fuel, electricity, rent, or maintenance</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Amount (Prominent) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Expense Amount ({business.currencySymbol}) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || '')}
              className="w-full px-3 py-2.5 text-lg font-mono font-bold text-[#7B001C] border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7B001C] focus:border-transparent bg-slate-50/30"
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Expense Category *</label>
              {!isAddingCustomCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(true)}
                  className="text-[11px] text-[#4C0196] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Custom Category</span>
                </button>
              )}
            </div>

            {isAddingCustomCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Generator Servicing"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3 py-1.5 text-xs bg-[#4C0196] text-white rounded-lg font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                required
              >
                {expenseCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              placeholder="e.g. 30 Litres diesel for afternoon practical class generator"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              required
            />
          </div>

          {/* Date, Time & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="POS">POS Terminal</option>
                <option value="Card">Card</option>
                <option value="Mobile Payment">Mobile Payment (OPay)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Payee/Vendor & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paid To / Payee</label>
              <input
                type="text"
                placeholder="e.g. TotalEnergies Okpanam"
                value={vendorName}
                onChange={e => setVendorName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt / Invoice #</label>
              <input
                type="text"
                placeholder="e.g. TOT-REC-892"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="Additional internal remarks or approval notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#7B001C] hover:bg-[#600016] rounded-lg shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
