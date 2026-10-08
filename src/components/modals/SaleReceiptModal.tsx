import React, { useState, useEffect } from 'react';
import { Sale, ReceiptFormat } from '../../types';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency, formatDate } from '../../utils/calculations';
import {
  X,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  FileText,
  MessageSquare,
} from 'lucide-react';

interface SaleReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onOpenWhatsAppReminder?: (sale: Sale) => void;
}

export const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  onOpenWhatsAppReminder,
}) => {
  const { business, logReceiptPrint } = useBusiness();
  const [selectedFormat, setSelectedFormat] = useState<ReceiptFormat>('80mm');

  // Clean up any print classes if closed
  useEffect(() => {
    return () => {
      document.body.classList.remove('printing-receipt', 'printing-58mm', 'printing-80mm', 'printing-a4');
    };
  }, []);

  if (!isOpen || !sale) return null;

  const handlePrint = (formatToPrint: ReceiptFormat = selectedFormat) => {
    // Add print classes to body for print isolation
    document.body.classList.add('printing-receipt');
    if (formatToPrint === '58mm') {
      document.body.classList.add('printing-58mm');
    } else if (formatToPrint === '80mm') {
      document.body.classList.add('printing-80mm');
    } else {
      document.body.classList.add('printing-a4');
    }

    // Log audit trail
    logReceiptPrint(sale.id, sale.invoiceNumber, formatToPrint);

    // Trigger browser print
    window.print();

    // Clean up classes after print dialog
    setTimeout(() => {
      document.body.classList.remove('printing-receipt', 'printing-58mm', 'printing-80mm', 'printing-a4');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto modal-backdrop-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden animate-in fade-in duration-150 modal-window-print">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#4C0196]" />
            <span className="text-xs font-bold text-slate-800">Print / Preview Receipt</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="font-mono text-xs font-bold text-[#4C0196]">{sale.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            {sale.balanceDue > 0 && onOpenWhatsAppReminder && (
              <button
                type="button"
                onClick={() => onOpenWhatsAppReminder(sale)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                title="Send polite WhatsApp debt reminder to customer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">WhatsApp Reminder</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handlePrint(selectedFormat)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ({selectedFormat === '58mm' ? '58mm POS' : selectedFormat === '80mm' ? '80mm POS' : 'A4 Invoice'})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Pills (Hidden in Print) */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between no-print text-xs">
          <span className="text-slate-500 font-medium">Receipt Preview Format:</span>
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedFormat('58mm')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedFormat === '58mm'
                  ? 'bg-[#4C0196] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm Thermal POS
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('80mm')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedFormat === '80mm'
                  ? 'bg-[#4C0196] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm Thermal POS
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('a4')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedFormat === 'a4'
                  ? 'bg-[#4C0196] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 Standard
            </button>
          </div>
        </div>

        {/* Receipt Display Area */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto bg-slate-100/40 flex justify-center">
          <div id="printable-receipt-target" className="w-full flex justify-center">
            {/* 1. 58mm Thermal Receipt Layout */}
            {selectedFormat === '58mm' && (
              <div className="w-[230px] bg-white p-3.5 shadow-sm border border-slate-300 font-mono text-[10px] text-black leading-tight selection:bg-slate-200">
                {/* Header */}
                <div className="text-center space-y-0.5 pb-2">
                  {business.logoUrl && (
                    <img
                      src={business.logoUrl}
                      alt={business.name}
                      className="h-7 max-w-[120px] object-contain mx-auto mb-1 filter grayscale"
                    />
                  )}
                  <div className="font-bold text-xs tracking-tight uppercase">
                    {business.name || 'SMARTCORE ICT CENTRE'}
                  </div>
                  {business.tagline && (
                    <div className="text-[9px] font-bold text-slate-800">
                      {business.tagline}
                    </div>
                  )}
                  <div className="text-[8.5px] leading-tight text-slate-700 mt-1">
                    {business.address}
                  </div>
                  <div className="text-[8.5px] text-slate-700">
                    Tel: {business.phone}
                  </div>
                  <div className="text-[8.5px] text-slate-700">
                    {business.website || business.email}
                  </div>
                </div>

                <div className="border-b border-dashed border-black my-1.5" />

                {/* Meta details */}
                <div className="space-y-0.5 text-[9px]">
                  <div className="flex justify-between">
                    <span>RCV:</span>
                    <span className="font-bold">{sale.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{sale.date} {sale.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{sale.recordedByUserName.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold truncate max-w-[130px]">{sale.customerName}</span>
                  </div>
                  {sale.customerPhone && (
                    <div className="flex justify-between text-[8.5px]">
                      <span>Phone:</span>
                      <span>{sale.customerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="border-b border-dashed border-black my-1.5" />

                {/* Items Table */}
                <div className="text-[9px]">
                  <div className="flex justify-between font-bold pb-1 border-b border-black">
                    <span className="w-28 truncate">ITEM</span>
                    <span className="w-8 text-center">QTY</span>
                    <span className="w-16 text-right">TOTAL</span>
                  </div>
                  <div className="py-1 space-y-1">
                    {sale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <span className="w-28 leading-tight break-words">{item.productName}</span>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <span className="w-16 text-right font-bold">
                          {formatCurrency(item.total, business.currencySymbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-b border-dashed border-black my-1.5" />

                {/* Financial Summary */}
                <div className="space-y-0.5 text-[9.5px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal, business.currencySymbol)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatCurrency(sale.discount, business.currencySymbol)}</span>
                    </div>
                  )}
                  {sale.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>VAT ({business.taxRate}%):</span>
                      <span>+{formatCurrency(sale.taxAmount, business.currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[11px] pt-1 border-t border-black">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(sale.totalAmount, business.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>{formatCurrency(sale.amountPaid, business.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[10.5px] pt-0.5 border-t border-dotted border-black">
                    <span>BALANCE:</span>
                    <span className={sale.balanceDue > 0 ? 'font-black' : ''}>
                      {formatCurrency(sale.balanceDue, business.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[8.5px] pt-0.5">
                    <span>Method:</span>
                    <span>{sale.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-[8.5px]">
                    <span>Status:</span>
                    <span className="font-bold uppercase">
                      {sale.paymentStatus === 'paid' ? 'PAID IN FULL' : sale.paymentStatus === 'partial' ? 'PARTIAL PAYMENT' : 'UNPAID CREDIT'}
                    </span>
                  </div>
                </div>

                {sale.notes && (
                  <div className="mt-1.5 pt-1 border-t border-dotted border-black text-[8px] text-slate-700">
                    <span className="font-bold">Note: </span>{sale.notes}
                  </div>
                )}

                <div className="border-b border-dashed border-black my-2" />

                {/* Footer */}
                <div className="text-center text-[8.5px] space-y-0.5 text-slate-800">
                  <div className="font-semibold">Thank you for your patronage.</div>
                  {business.tagline && <div className="font-bold tracking-wider">{business.tagline}</div>}
                  <div className="text-[7.5px] text-slate-500 pt-0.5">*** POS Receipt · Powered by BizFlow ***</div>
                </div>
              </div>
            )}

            {/* 2. 80mm Thermal Receipt Layout */}
            {selectedFormat === '80mm' && (
              <div className="w-[320px] bg-white p-4 shadow-sm border border-slate-300 font-mono text-xs text-black leading-tight selection:bg-slate-200">
                {/* Header */}
                <div className="text-center space-y-1 pb-2">
                  {business.logoUrl && (
                    <img
                      src={business.logoUrl}
                      alt={business.name}
                      className="h-9 max-w-[150px] object-contain mx-auto mb-1 filter grayscale"
                    />
                  )}
                  <div className="font-bold text-sm tracking-tight uppercase">
                    {business.name || 'SMARTCORE ICT CENTRE'}
                  </div>
                  {business.tagline && (
                    <div className="text-[11px] font-bold text-slate-800">
                      {business.tagline}
                    </div>
                  )}
                  <div className="text-[10px] leading-relaxed text-slate-700 mt-1 max-w-[280px] mx-auto">
                    {business.address}
                  </div>
                  <div className="text-[10px] text-slate-700">
                    Tel: {business.phone} · {business.email}
                  </div>
                  <div className="text-[10px] text-slate-700">
                    {business.website}
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-black my-2" />

                {/* Invoice Metadata */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold">
                    <span>INVOICE / RECEIPT:</span>
                    <span>{sale.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date &amp; Time:</span>
                    <span>{sale.date}  {sale.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier / Staff:</span>
                    <span>{sale.recordedByUserName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer / Student:</span>
                    <span className="font-bold">{sale.customerName}</span>
                  </div>
                  {sale.customerPhone && (
                    <div className="flex justify-between text-[10px]">
                      <span>Customer Phone:</span>
                      <span>{sale.customerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="border-b-2 border-dashed border-black my-2" />

                {/* Items Table */}
                <div className="text-[11px]">
                  <div className="grid grid-cols-12 font-bold pb-1 border-b border-black text-[10px]">
                    <span className="col-span-6">ITEM / DESCRIPTION</span>
                    <span className="col-span-2 text-center">QTY</span>
                    <span className="col-span-4 text-right">TOTAL</span>
                  </div>
                  <div className="py-1.5 space-y-1">
                    {sale.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-start text-[10.5px]">
                        <div className="col-span-6 pr-1 leading-tight break-words">
                          <div className="font-medium">{item.productName}</div>
                          {item.quantity > 1 && (
                            <div className="text-[9px] text-slate-600">
                              @{formatCurrency(item.unitPrice, business.currencySymbol)}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 text-center">{item.quantity}</div>
                        <div className="col-span-4 text-right font-bold">
                          {formatCurrency(item.total, business.currencySymbol)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-black my-2" />

                {/* Financial Summary */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal, business.currencySymbol)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatCurrency(sale.discount, business.currencySymbol)}</span>
                    </div>
                  )}
                  {sale.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>VAT ({business.taxRate}%):</span>
                      <span>+{formatCurrency(sale.taxAmount, business.currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t-2 border-black">
                    <span>TOTAL AMOUNT:</span>
                    <span>{formatCurrency(sale.totalAmount, business.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(sale.amountPaid, business.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-black">
                    <span>OUTSTANDING BALANCE:</span>
                    <span className={sale.balanceDue > 0 ? 'font-black' : ''}>
                      {formatCurrency(sale.balanceDue, business.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] pt-1">
                    <span>Payment Channel:</span>
                    <span>{sale.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Payment Status:</span>
                    <span className="font-bold uppercase">
                      {sale.paymentStatus === 'paid' ? 'PAID IN FULL' : sale.paymentStatus === 'partial' ? 'PARTIALLY PAID' : 'CREDIT / UNPAID'}
                    </span>
                  </div>
                </div>

                {sale.notes && (
                  <div className="mt-2 pt-1 border-t border-dotted border-black text-[9.5px]">
                    <span className="font-bold">Remarks: </span>{sale.notes}
                  </div>
                )}

                <div className="border-b-2 border-dashed border-black my-2.5" />

                {/* Footer Sign-off */}
                <div className="text-center text-[10px] space-y-1 text-slate-800">
                  <div className="font-semibold">Thank you for your patronage.</div>
                  {business.tagline && <div className="font-bold tracking-wider">{business.tagline}</div>}
                  <div className="text-[9px] text-slate-500 pt-0.5">*** Official POS Receipt · Powered by BizFlow ***</div>
                </div>
              </div>
            )}

            {/* 3. A4 Standard Invoice Layout */}
            {selectedFormat === 'a4' && (
              <div className="w-full max-w-xl bg-white p-6 sm:p-8 space-y-6 border border-slate-200 shadow-sm text-xs text-slate-800 print:p-0">
                {/* Organization Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      {business.logoUrl ? (
                        <img
                          src={business.logoUrl}
                          alt={business.name}
                          className="h-10 max-w-[160px] object-contain rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-[#4C0196] flex items-center justify-center text-white font-bold text-base">
                          {business.name ? business.name[0] : 'S'}
                        </div>
                      )}
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        {business.name}
                      </h1>
                    </div>
                    <p className="text-xs font-semibold text-[#4C0196] mt-0.5">{business.tagline}</p>
                    <p className="text-[11px] text-slate-500 mt-2 max-w-sm leading-relaxed">
                      {business.address}
                    </p>
                    <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>Tel: {business.phone}</span>
                      <span>Email: {business.email}</span>
                      <span>Web: {business.website}</span>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      INVOICE / RECEIPT
                    </span>
                    <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
                      {sale.invoiceNumber}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Date: <span className="font-medium text-slate-900">{formatDate(sale.date)}</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Time: <span className="font-medium text-slate-900">{sale.time}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Billed To / Student:
                    </span>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{sale.customerName}</div>
                    {sale.customerPhone && (
                      <div className="text-slate-600 mt-0.5">{sale.customerPhone}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Payment Status:
                    </span>
                    <div className="mt-1">
                      {sale.paymentStatus === 'paid' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>PAID IN FULL</span>
                        </span>
                      )}
                      {sale.paymentStatus === 'partial' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>PARTIALLY PAID</span>
                        </span>
                      )}
                      {sale.paymentStatus === 'unpaid' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#7B001C] bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>CREDIT / UNPAID</span>
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1">
                      Via: <span className="font-medium text-slate-800">{sale.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                        <th className="py-2.5 px-3">Item / Service Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {sale.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                            {item.productName}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {formatCurrency(item.unitPrice, business.currencySymbol)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.total, business.currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCurrency(sale.subtotal, business.currencySymbol)}</span>
                    </div>
                    {sale.discount > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Discount:</span>
                        <span className="font-mono">-{formatCurrency(sale.discount, business.currencySymbol)}</span>
                      </div>
                    )}
                    {sale.taxAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>VAT ({business.taxRate}%):</span>
                        <span className="font-mono">+{formatCurrency(sale.taxAmount, business.currencySymbol)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                      <span>Total Amount:</span>
                      <span className="font-mono text-base">{formatCurrency(sale.totalAmount, business.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700 font-medium">
                      <span>Amount Paid:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {formatCurrency(sale.amountPaid, business.currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-2 border-t-2 border-slate-900">
                      <span className={sale.balanceDue > 0 ? 'text-[#7B001C]' : 'text-slate-800'}>
                        Balance Due:
                      </span>
                      <span className={`font-mono text-sm ${sale.balanceDue > 0 ? 'text-[#7B001C]' : 'text-slate-900'}`}>
                        {formatCurrency(sale.balanceDue, business.currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {sale.notes && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <span className="font-bold">Remarks: </span>
                    {sale.notes}
                  </div>
                )}

                {/* Footer Sign-off */}
                <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
                  <div>
                    Issued by: <span className="font-medium text-slate-800">{sale.recordedByUserName}</span>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="font-medium text-slate-700">Thank you for your business!</p>
                    <p className="text-[10px] text-slate-400">Official Computer Generated Receipt · Powered by BizFlow</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
