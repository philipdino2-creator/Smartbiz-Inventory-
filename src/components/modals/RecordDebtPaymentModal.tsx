import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Customer, Payable, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { X, CheckCircle2 } from 'lucide-react';

interface RecordDebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'customer' | 'payable';
  targetItem: Customer | Payable | null;
  onSuccess?: () => void;
}

export const RecordDebtPaymentModal: React.FC<RecordDebtPaymentModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetItem,
  onSuccess,
}) => {
  const { business, recordCustomerDebtPayment, recordPayableDebtPayment } = useBusiness();

  const isCustomer = targetType === 'customer';
  const customer = isCustomer ? (targetItem as Customer) : null;
  const payable = !isCustomer ? (targetItem as Payable) : null;

  const outstandingBalance = isCustomer
    ? customer?.outstandingDebt || 0
    : payable?.balanceDue || 0;

  const targetName = isCustomer ? customer?.name : payable?.vendorName;

  const [amount, setAmount] = useState<number | ''>(outstandingBalance);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !targetItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (numericAmount > outstandingBalance) {
      setError(`Amount cannot exceed the total outstanding balance of ${formatCurrency(outstandingBalance, business.currencySymbol)}.`);
      return;
    }

    let success = false;
    if (isCustomer && customer) {
      success = recordCustomerDebtPayment(customer.id, numericAmount, paymentMethod, reference, notes);
    } else if (payable) {
      success = recordPayableDebtPayment(payable.id, numericAmount, paymentMethod, reference, notes);
    }

    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError('Failed to record payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-200">
        <div className={`px-5 py-4 border-b border-slate-200 flex items-center justify-between ${isCustomer ? 'bg-purple-50' : 'bg-rose-50'}`}>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isCustomer ? 'Collect Customer Debt Payment' : 'Pay Supplier Debt Balance'}
            </h2>
            <p className="text-xs text-slate-500">
              {isCustomer ? 'Receive money owed to business' : 'Record payment made to vendor/supplier'}
            </p>
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

          {/* Target Profile & Outstanding Balance Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isCustomer ? 'Debtor / Student' : 'Creditor / Supplier'}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">{targetName}</span>
              <span className="text-xs font-mono font-bold text-[#7B001C] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                Owes: {formatCurrency(outstandingBalance, business.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Amount to Pay */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-800">
                Payment Amount ({business.currencySymbol}) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(outstandingBalance)}
                className="text-[11px] text-[#4C0196] font-semibold hover:underline"
              >
                Pay Full Balance
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={outstandingBalance}
              step="any"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || '')}
              className="w-full px-3 py-2 text-base font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent"
              required
              autoFocus
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Bank Transfer">Bank Transfer (Zenith / GTBank / Access / OPay)</option>
              <option value="Cash">Cash</option>
              <option value="POS">POS Terminal Card Transaction</option>
              <option value="Card">Online Card</option>
              <option value="Mobile Payment">Mobile Payment (OPay / PalmPay)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Transaction Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank Reference / Receipt #
            </label>
            <input
              type="text"
              placeholder="e.g. TRF-20261003-8849"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              placeholder="e.g. Second instalment for graphic design training"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          {/* Submit buttons */}
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
              className={`flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-md transition-all cursor-pointer ${
                isCustomer ? 'bg-[#4C0196] hover:bg-[#3b0075]' : 'bg-[#7B001C] hover:bg-[#600016]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
