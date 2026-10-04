import React, { useState, useMemo } from 'react';
import { Customer, Sale } from '../../types';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency, formatDate } from '../../utils/calculations';
import {
  normalizeNigerianPhone,
  generateWhatsAppReminderMessage,
  buildWhatsAppUrl,
  ReminderTone,
} from '../../utils/whatsappUtils';
import {
  X,
  MessageSquare,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  Building2,
  Phone,
  Clock,
  Send,
} from 'lucide-react';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  sale?: Sale | null;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  customer,
  sale,
}) => {
  const { business, logWhatsAppReminder } = useBusiness();

  const [tone, setTone] = useState<ReminderTone>('friendly');
  const [includeBankDetails, setIncludeBankDetails] = useState<boolean>(
    business.includeBankDetailsInReminders ?? true
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen || !customer) return null;

  const phoneResult = normalizeNigerianPhone(customer.phone);

  const balanceToRemind = sale ? sale.balanceDue : customer.outstandingDebt;

  const generatedMessage = useMemo(() => {
    return generateWhatsAppReminderMessage({
      customerName: customer.name,
      outstandingBalance: balanceToRemind,
      currencySymbol: business.currencySymbol,
      invoiceNumber: sale?.invoiceNumber,
      dueDate: sale?.date ? formatDate(sale.date) : undefined,
      tone,
      businessName: business.name,
      businessTagline: business.tagline,
      businessPhone: business.phone,
      bankDetails: {
        bankName: business.bankName,
        accountName: business.accountName,
        accountNumber: business.accountNumber,
        paymentInstructions: business.paymentInstructions,
        includeBankDetails,
      },
    });
  }, [customer, sale, balanceToRemind, tone, includeBankDetails, business]);

  const whatsappUrlResult = useMemo(() => {
    if (!phoneResult.isValid) return null;
    return buildWhatsAppUrl(customer.phone, generatedMessage);
  }, [customer.phone, generatedMessage, phoneResult.isValid]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    logWhatsAppReminder(customer.id, customer.name, tone, 'copied');
  };

  const handleOpenWhatsApp = () => {
    if (whatsappUrlResult?.url) {
      logWhatsAppReminder(customer.id, customer.name, tone, 'opened_whatsapp');
      window.open(whatsappUrlResult.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">WhatsApp Debt Reminder</h2>
              <p className="text-[11px] text-slate-500">
                Send polite balance reminder to <span className="font-semibold text-slate-800">{customer.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer Summary & Phone Validation */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Recipient Customer:</span>
              <span className="font-bold text-slate-900">{customer.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Outstanding Balance:</span>
              <span className="font-bold font-mono text-[#7B001C] text-sm">
                {formatCurrency(balanceToRemind, business.currencySymbol)}
              </span>
            </div>
            {sale && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Specific Invoice:</span>
                <span className="font-mono font-semibold text-slate-800">{sale.invoiceNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Mobile / WhatsApp:</span>
              {phoneResult.isValid ? (
                <span className="inline-flex items-center gap-1 font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  <Check className="w-3 h-3" />
                  <span>{phoneResult.displayPhone}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                  <AlertCircle className="w-3 h-3" />
                  <span>{customer.phone || 'Missing Phone Number'}</span>
                </span>
              )}
            </div>
          </div>

          {!phoneResult.isValid && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Customer phone number is missing or invalid.</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Direct WhatsApp link cannot be launched. You can still copy the message text below to send manually once a phone number is provided.
                </p>
              </div>
            </div>
          )}

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Reminder Tone &amp; Style:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTone('friendly')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  tone === 'friendly'
                    ? 'border-[#4C0196] bg-purple-50/70 text-[#4C0196] font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">Gentle Check-in</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Friendly &amp; polite</div>
              </button>

              <button
                type="button"
                onClick={() => setTone('due')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  tone === 'due'
                    ? 'border-[#4C0196] bg-purple-50/70 text-[#4C0196] font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">Payment Due</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Formal notice</div>
              </button>

              <button
                type="button"
                onClick={() => setTone('overdue')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  tone === 'overdue'
                    ? 'border-[#7B001C] bg-rose-50 text-[#7B001C] font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">Overdue Follow-up</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Urgent request</div>
              </button>
            </div>
          </div>

          {/* Bank Payment Details Toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="font-semibold text-slate-800">Include Official Bank Account Details</span>
                  <p className="text-[11px] text-slate-500">
                    {business.bankName && business.accountNumber
                      ? `${business.bankName} — ${business.accountNumber} (${business.accountName || business.name})`
                      : 'Configure bank details in Business Settings'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeBankDetails}
                onChange={e => setIncludeBankDetails(e.target.checked)}
                className="w-4 h-4 text-[#4C0196] rounded border-slate-300 focus:ring-[#4C0196] cursor-pointer"
              />
            </label>
          </div>

          {/* Live Message Preview (Styled like WhatsApp) */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Message Preview:</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#4C0196] hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-4 bg-[#E5DDD5] rounded-xl border border-slate-300 relative shadow-inner">
              <div className="bg-white p-3.5 rounded-lg shadow-sm text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {generatedMessage}
              </div>
              <div className="text-[10px] text-slate-500 text-right mt-1.5 flex items-center justify-end gap-1 font-sans">
                <Clock className="w-3 h-3" />
                <span>Ready to dispatch via WhatsApp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Message'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!phoneResult.isValid}
              onClick={handleOpenWhatsApp}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                phoneResult.isValid
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
