import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { SaleItem, PaymentMethod } from '../../types';
import { calculateSaleTotals, formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/calculations';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sale: any) => void;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { business, products, customers, addSale, addProduct, deleteProduct, currentUser } = useBusiness();

  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Quick Create Product/Service modal state
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateLineIdx, setQuickCreateLineIdx] = useState<number | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdType, setNewProdType] = useState<'service' | 'product'>('service');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState<number | ''>('');
  const [newProdCostPrice, setNewProdCostPrice] = useState<number | ''>('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdStock, setNewProdStock] = useState<number | ''>('');
  const [quickCreateError, setQuickCreateError] = useState('');

  const [items, setItems] = useState<SaleItem[]>([
    {
      id: 'item_1',
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      type: products[0]?.type || 'service',
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || 0,
      costPrice: products[0]?.costPrice || 0,
      discount: 0,
      total: products[0]?.sellingPrice || 0,
    },
  ]);

  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Synchronize customer details when picking from dropdown
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (id === 'walk_in' || !id) {
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
    } else {
      const found = customers.find(c => c.id === id);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone || '');
      }
    }
  };

  // Quick Product/Service creation and deletion handlers
  const handleOpenQuickCreate = (targetLineIdx: number | null = null) => {
    setQuickCreateLineIdx(targetLineIdx);
    setNewProdName('');
    setNewProdType('service');
    setNewProdSellingPrice('');
    setNewProdCostPrice('');
    setNewProdCategory('');
    setNewProdStock('');
    setQuickCreateError('');
    setIsQuickCreateOpen(true);
  };

  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      setQuickCreateError('Item / Service name is required');
      return;
    }
    const sellPrice = typeof newProdSellingPrice === 'number' ? newProdSellingPrice : parseFloat(newProdSellingPrice);
    if (isNaN(sellPrice) || sellPrice < 0) {
      setQuickCreateError('Please enter a valid selling price');
      return;
    }

    const costPrice = typeof newProdCostPrice === 'number' ? newProdCostPrice : parseFloat(newProdCostPrice) || 0;
    const stockVal = newProdType === 'product'
      ? (typeof newProdStock === 'number' ? newProdStock : parseInt(newProdStock) || 0)
      : undefined;

    const created = addProduct({
      name: newProdName.trim(),
      type: newProdType,
      sellingPrice: sellPrice,
      costPrice: costPrice,
      category: newProdCategory.trim() || (newProdType === 'service' ? 'Course / Service' : 'Hardware & Supplies'),
      openingStock: stockVal,
      currentStock: stockVal,
      minStockLevel: 5,
      active: true,
    });

    if (quickCreateLineIdx !== null && items[quickCreateLineIdx]) {
      handleItemProductChange(quickCreateLineIdx, created.id);
    } else {
      const newItem: SaleItem = {
        id: `item_${Date.now()}_${items.length}`,
        productId: created.id,
        productName: created.name,
        type: created.type,
        quantity: 1,
        unitPrice: created.sellingPrice,
        costPrice: created.costPrice,
        discount: 0,
        total: created.sellingPrice,
      };
      setItems(prev => [...prev, newItem]);
    }

    setIsQuickCreateOpen(false);
  };

  const handleDeleteCatalogProduct = (productId: string, productName: string) => {
    if (currentUser?.role === 'staff') {
      alert('Permission Denied: Staff members cannot delete products or services from the catalog.');
      return;
    }
    if (window.confirm(`Delete "${productName}" completely from your catalog? It will be permanently removed.`)) {
      deleteProduct(productId);
      // Update any line items currently referencing this deleted product
      setItems(prevItems =>
        prevItems.map(it => {
          if (it.productId === productId) {
            const nextProd = products.find(p => p.id !== productId);
            return {
              ...it,
              productId: nextProd?.id || '',
              productName: nextProd?.name || '',
              type: nextProd?.type || 'service',
              unitPrice: nextProd?.sellingPrice || 0,
              costPrice: nextProd?.costPrice || 0,
              total: (it.quantity || 1) * (nextProd?.sellingPrice || 0),
            };
          }
          return it;
        })
      );
    }
  };

  // Add line item
  const handleAddItem = () => {
    const defaultProd = products[0];
    const newItem: SaleItem = {
      id: `item_${Date.now()}_${items.length}`,
      productId: defaultProd?.id || '',
      productName: defaultProd?.name || '',
      type: defaultProd?.type || 'service',
      quantity: 1,
      unitPrice: defaultProd?.sellingPrice || 0,
      costPrice: defaultProd?.costPrice || 0,
      discount: 0,
      total: defaultProd?.sellingPrice || 0,
    };
    setItems([...items, newItem]);
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Item changed
  const handleItemProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const updated = [...items];
    const qty = updated[index].quantity || 1;
    const disc = updated[index].discount || 0;
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.name,
      type: prod.type,
      unitPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      total: Math.max(0, qty * prod.sellingPrice - disc),
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const validQty = Math.max(1, quantity);
    const updated = [...items];
    const item = updated[index];
    updated[index] = {
      ...item,
      quantity: validQty,
      total: Math.max(0, validQty * item.unitPrice - (item.discount || 0)),
    };
    setItems(updated);
  };

  const handleUnitPriceChange = (index: number, unitPrice: number) => {
    const validPrice = Math.max(0, unitPrice);
    const updated = [...items];
    const item = updated[index];
    updated[index] = {
      ...item,
      unitPrice: validPrice,
      total: Math.max(0, item.quantity * validPrice - (item.discount || 0)),
    };
    setItems(updated);
  };

  const handleItemDiscountChange = (index: number, discount: number) => {
    const validDisc = Math.max(0, discount);
    const updated = [...items];
    const item = updated[index];
    updated[index] = {
      ...item,
      discount: validDisc,
      total: Math.max(0, item.quantity * item.unitPrice - validDisc),
    };
    setItems(updated);
  };

  // Calculate live totals
  const totals = calculateSaleTotals(
    items,
    overallDiscount,
    business.taxRate,
    business.enableTax,
    amountPaid
  );

  // Set default amount paid to full price when items change if user hasn't typed a custom partial amount
  useEffect(() => {
    if (totals.totalAmount > 0 && amountPaid === 0) {
      setAmountPaid(totals.totalAmount);
    }
  }, [totals.totalAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Please add at least one product or service.');
      return;
    }

    const finalCustomerName = customerName.trim() || 'Walk-in Customer';

    // If there is an outstanding debt, a customer name or phone is recommended for tracking
    if (totals.balanceDue > 0 && finalCustomerName === 'Walk-in Customer') {
      if (!window.confirm('This sale has an unpaid balance of ' + formatCurrency(totals.balanceDue, business.currencySymbol) + '. Are you sure you want to record it under "Walk-in Customer"? (Adding their name helps track who owes money)')) {
        return;
      }
    }

    try {
      const createdSale = addSale({
        date,
        time,
        customerId: selectedCustomerId === 'walk_in' ? undefined : selectedCustomerId,
        customerName: finalCustomerName,
        customerPhone: customerPhone.trim(),
        items,
        subtotal: totals.subtotal,
        discount: totals.totalDiscount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        paymentMethod,
        paymentStatus: totals.paymentStatus,
        amountPaid: Math.min(amountPaid, totals.totalAmount),
        balanceDue: totals.balanceDue,
        notes: notes.trim(),
      });

      if (onSuccess) {
        onSuccess(createdSale);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record sale.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">+ Record New Sale / Enrollment</h2>
            <p className="text-xs text-slate-500">Record course tuition, product purchase, or service order</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Date, Time & Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent bg-white"
              >
                <option value="walk_in">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.outstandingDebt > 0 ? `(Owes ${formatCurrency(c.outstandingDebt, business.currencySymbol)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Name & Phone Input (for walk-in or editing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Student Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe / Walk-in"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Phone Number</label>
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Items / Services</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenQuickCreate(null)}
                  className="flex items-center gap-1 text-[11px] text-white bg-[#4C0196] hover:bg-[#390070] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shadow-2xs"
                  title="Create new product or service for catalog"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Create Product / Service</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-[11px] text-[#4C0196] font-semibold hover:underline cursor-pointer bg-purple-50 px-2 py-1 rounded-md border border-purple-200"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Row</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    {/* Product Selector */}
                    <div className="sm:col-span-6">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-medium text-slate-500">Product or Service</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenQuickCreate(idx)}
                            className="text-[10px] text-[#4C0196] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                            title="Create new item and select for this row"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>+ Create New</span>
                          </button>
                          {products.length > 0 && item.productId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCatalogProduct(item.productId, item.productName)}
                              className="text-[10px] text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                              title="Delete this product/service from catalog"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Delete Product</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <select
                        value={item.productId}
                        onChange={e => {
                          if (e.target.value === '__CREATE_NEW__') {
                            handleOpenQuickCreate(idx);
                          } else {
                            handleItemProductChange(idx, e.target.value);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-[#4C0196]"
                        required
                      >
                        <option value="" disabled>Select product or service...</option>
                        <option value="__CREATE_NEW__" className="font-bold text-[#4C0196] bg-purple-50">
                          ➕ + Create New Product or Service...
                        </option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.type === 'service' ? 'Service' : `Stock: ${p.currentStock ?? 0}`}) - {formatCurrency(p.sellingPrice, business.currencySymbol)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono text-center"
                        required
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Price ({business.currencySymbol})</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={e => handleUnitPriceChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono text-right"
                        required
                      />
                    </div>

                    {/* Remove button */}
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className={`p-1.5 rounded-md text-slate-400 hover:text-red-600 transition-colors ${
                          items.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Line Total preview */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Item Total:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(item.total, business.currencySymbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Overall Discount ({business.currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={overallDiscount}
                onChange={e => setOverallDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="POS">POS / Card Terminal</option>
                <option value="Card">Card</option>
                <option value="Mobile Payment">Mobile Payment (OPay / PalmPay)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Amount Paid vs Balance Due Summary Box */}
          <div className="bg-slate-100 rounded-xl p-4 space-y-2 border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(totals.subtotal, business.currencySymbol)}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-amber-700">
                <span>Discount Applied:</span>
                <span className="font-mono">-{formatCurrency(totals.totalDiscount, business.currencySymbol)}</span>
              </div>
            )}
            {business.enableTax && (
              <div className="flex justify-between text-xs text-slate-600">
                <span>VAT ({business.taxRate}%):</span>
                <span className="font-mono">+{formatCurrency(totals.taxAmount, business.currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>Total Amount:</span>
              <span className="font-mono text-base text-[#4C0196]">{formatCurrency(totals.totalAmount, business.currencySymbol)}</span>
            </div>

            {/* Amount Paid input */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Amount Paid Now ({business.currencySymbol}):
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(totals.totalAmount)}
                    className="text-[11px] px-2 py-0.5 bg-purple-100 text-[#4C0196] rounded-md font-medium hover:bg-purple-200"
                  >
                    Paid in Full
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(0)}
                    className="text-[11px] px-2 py-0.5 bg-rose-100 text-[#7B001C] rounded-md font-medium hover:bg-rose-200"
                  >
                    Credit (₦0)
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                max={totals.totalAmount}
                value={amountPaid}
                onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>

            {/* Balance Due feedback */}
            <div className="flex justify-between text-xs font-semibold pt-1 border-t border-slate-200">
              <span className="text-slate-700">Outstanding Balance Due:</span>
              <span className={`font-mono text-sm ${totals.balanceDue > 0 ? 'text-[#7B001C] font-bold' : 'text-emerald-700'}`}>
                {formatCurrency(totals.balanceDue, business.currencySymbol)}
                {totals.balanceDue > 0 ? ' (Recorded as Customer Debt)' : ' (Fully Settled)'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
            <input
              type="text"
              placeholder="e.g. Deposit for web dev training; balance promised on 15th"
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
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#390070] rounded-lg shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save &amp; Generate Invoice</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Create Product/Service Sub-Modal */}
      {isQuickCreateOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#4C0196] text-white flex items-center justify-center font-bold text-xs">
                  +
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Product or Service</h3>
                  <p className="text-[11px] text-slate-500">Add to catalog &amp; use immediately in this sale</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickProduct} className="p-5 space-y-3.5 text-xs">
              {quickCreateError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {quickCreateError}
                </div>
              )}

              {/* Type selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Type *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setNewProdType('service')}
                    className={`py-1.5 px-3 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                      newProdType === 'service'
                        ? 'bg-white text-[#4C0196] shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Training / Service
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProdType('product')}
                    className={`py-1.5 px-3 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                      newProdType === 'product'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Physical Product
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name / Title *</label>
                <input
                  type="text"
                  placeholder={newProdType === 'service' ? 'e.g. Graphics Design Masterclass' : 'e.g. HP Wireless Mouse 2.4GHz'}
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196] focus:border-transparent outline-hidden"
                  autoFocus
                  required
                />
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Selling Price ({business.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={newProdSellingPrice}
                    onChange={e => setNewProdSellingPrice(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4C0196]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cost Price ({business.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={newProdCostPrice}
                    onChange={e => setNewProdCostPrice(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder={newProdType === 'service' ? 'e.g. IT Training, Repair Service' : 'e.g. Hardware, Accessories'}
                  value={newProdCategory}
                  onChange={e => setNewProdCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* If product, opening stock */}
              {newProdType === 'product' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Stock (Units)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={newProdStock}
                    onChange={e => setNewProdStock(parseInt(e.target.value) || '')}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4C0196] hover:bg-[#390070] text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
