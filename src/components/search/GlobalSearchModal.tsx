import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { normalizeSearchQuery, formatCurrency, formatDate } from '../../utils/calculations';
import {
  Search,
  X,
  Users,
  Package,
  Receipt,
  ArrowDownCircle,
  CreditCard,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Sale, Customer, Expense, ProductService, Payable } from '../../types';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
  onViewSaleReceipt: (sale: Sale) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectPayable: (payable: Payable) => void;
}

export type SearchResultType =
  | 'customer'
  | 'product'
  | 'sale'
  | 'expense'
  | 'payable'
  | 'transaction';

interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  extra?: string;
  badge: string;
  badgeColor: string;
  rawItem: any;
  targetTab: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onViewSaleReceipt,
  onSelectCustomer,
  onSelectPayable,
}) => {
  const { business, customers, products, sales, expenses, payables } = useBusiness();
  const [query, setQuery] = useState('');
  const [activeFilterType, setActiveFilterType] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setActiveFilterType('all');
    }
  }, [isOpen]);

  // Global keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform search across all entities
  const results = useMemo(() => {
    const q = normalizeSearchQuery(query);
    if (!q) return [];

    const matches: SearchResultItem[] = [];

    // 1. Search Customers
    customers.forEach(c => {
      const nameMatch = normalizeSearchQuery(c.name).includes(q);
      const phoneMatch = c.phone && normalizeSearchQuery(c.phone).includes(q);
      const emailMatch = c.email && normalizeSearchQuery(c.email).includes(q);
      const notesMatch = c.notes && normalizeSearchQuery(c.notes).includes(q);

      if (nameMatch || phoneMatch || emailMatch || notesMatch) {
        matches.push({
          id: `search_cust_${c.id}`,
          type: 'customer',
          title: c.name,
          subtitle: [c.phone, c.email].filter(Boolean).join(' · '),
          extra: c.outstandingDebt > 0 ? `Owes ${formatCurrency(c.outstandingDebt, business.currencySymbol)}` : 'No debt',
          badge: 'Customer',
          badgeColor: 'bg-purple-100 text-[#4C0196]',
          rawItem: c,
          targetTab: 'customers',
        });
      }
    });

    // 2. Search Products & Services
    products.forEach(p => {
      const nameMatch = normalizeSearchQuery(p.name).includes(q);
      const skuMatch = p.sku && normalizeSearchQuery(p.sku).includes(q);
      const catMatch = normalizeSearchQuery(p.category).includes(q);
      const descMatch = p.description && normalizeSearchQuery(p.description).includes(q);

      if (nameMatch || skuMatch || catMatch || descMatch) {
        matches.push({
          id: `search_prod_${p.id}`,
          type: 'product',
          title: p.name,
          subtitle: `${p.category} ${p.sku ? `· SKU: ${p.sku}` : ''}`,
          extra: formatCurrency(p.sellingPrice, business.currencySymbol),
          badge: p.type === 'service' ? 'Course / Service' : 'Product',
          badgeColor: p.type === 'service' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700',
          rawItem: p,
          targetTab: 'products',
        });
      }
    });

    // 3. Search Sales & Invoices
    sales.forEach(s => {
      const invMatch = normalizeSearchQuery(s.invoiceNumber).includes(q);
      const custMatch = normalizeSearchQuery(s.customerName).includes(q);
      const itemMatch = s.items.some(i => normalizeSearchQuery(i.productName).includes(q));
      const phoneMatch = s.customerPhone && normalizeSearchQuery(s.customerPhone).includes(q);

      if (invMatch || custMatch || itemMatch || phoneMatch) {
        matches.push({
          id: `search_sale_${s.id}`,
          type: 'sale',
          title: `${s.invoiceNumber} — ${s.customerName}`,
          subtitle: `${formatDate(s.date)} · ${s.items.map(i => i.productName).join(', ')}`,
          extra: formatCurrency(s.totalAmount, business.currencySymbol),
          badge: 'Sale / Invoice',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          rawItem: s,
          targetTab: 'sales',
        });
      }
    });

    // 4. Search Expenses
    expenses.forEach(e => {
      const descMatch = normalizeSearchQuery(e.description).includes(q);
      const catMatch = normalizeSearchQuery(e.category).includes(q);
      const vendorMatch = normalizeSearchQuery(e.vendorName).includes(q);
      const refMatch = e.referenceNumber && normalizeSearchQuery(e.referenceNumber).includes(q);

      if (descMatch || catMatch || vendorMatch || refMatch) {
        matches.push({
          id: `search_exp_${e.id}`,
          type: 'expense',
          title: `${e.category}: ${e.description}`,
          subtitle: `${formatDate(e.date)} · Paid to: ${e.vendorName} via ${e.paymentMethod}`,
          extra: `-${formatCurrency(e.amount, business.currencySymbol)}`,
          badge: 'Expense',
          badgeColor: 'bg-rose-100 text-[#7B001C]',
          rawItem: e,
          targetTab: 'expenses',
        });
      }
    });

    // 5. Search Payables / Suppliers
    payables.forEach(p => {
      const vendorMatch = normalizeSearchQuery(p.vendorName).includes(q);
      const descMatch = normalizeSearchQuery(p.description).includes(q);
      const phoneMatch = p.vendorPhone && normalizeSearchQuery(p.vendorPhone).includes(q);

      if (vendorMatch || descMatch || phoneMatch) {
        matches.push({
          id: `search_pay_${p.id}`,
          type: 'payable',
          title: `Supplier: ${p.vendorName}`,
          subtitle: p.description,
          extra: `Owed: ${formatCurrency(p.balanceDue, business.currencySymbol)}`,
          badge: 'Payable',
          badgeColor: 'bg-amber-100 text-amber-800',
          rawItem: p,
          targetTab: 'payables',
        });
      }
    });

    return matches;
  }, [query, customers, products, sales, expenses, payables, business.currencySymbol]);

  // Filtered by category tab inside modal
  const filteredResults = useMemo(() => {
    if (activeFilterType === 'all') return results;
    return results.filter(r => r.type === activeFilterType);
  }, [results, activeFilterType]);

  if (!isOpen) return null;

  const handleSelectResult = (item: SearchResultItem) => {
    onClose();
    onNavigateToTab(item.targetTab);

    // Contextual direct action
    if (item.type === 'sale') {
      onViewSaleReceipt(item.rawItem as Sale);
    } else if (item.type === 'customer') {
      onSelectCustomer(item.rawItem as Customer);
    } else if (item.type === 'payable') {
      onSelectPayable(item.rawItem as Payable);
    }
  };

  const getIconForType = (type: SearchResultType) => {
    switch (type) {
      case 'customer':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'product':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'sale':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'expense':
        return <ArrowDownCircle className="w-4 h-4 text-[#7B001C]" />;
      case 'payable':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search anything: student name, phone, invoice #, course, expense, supplier..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-hidden focus:ring-0 text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 text-xs"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-md text-slate-500 hover:bg-slate-200 text-xs font-semibold"
          >
            Esc
          </button>
        </div>

        {/* Filter Pills if results exist */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-white">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Filter:</span>
            {[
              { id: 'all', label: `All (${results.length})` },
              { id: 'customer', label: `Customers (${results.filter(r => r.type === 'customer').length})` },
              { id: 'sale', label: `Sales (${results.filter(r => r.type === 'sale').length})` },
              { id: 'expense', label: `Expenses (${results.filter(r => r.type === 'expense').length})` },
              { id: 'product', label: `Products (${results.filter(r => r.type === 'product').length})` },
              { id: 'payable', label: `Payables (${results.filter(r => r.type === 'payable').length})` },
            ]
              .filter(tab => tab.id === 'all' || results.some(r => r.type === tab.id))
              .map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    activeFilterType === tab.id
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {!query.trim() ? (
            <div className="p-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">Quick Global Search</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Type a name, invoice code (e.g. SMT-2026), phone number, generator fuel, or product to jump straight to the record.
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm font-semibold">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">
                Check spelling or try a broader keyword like "diesel", "web", or a phone number.
              </p>
            </div>
          ) : (
            filteredResults.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelectResult(item)}
                className="p-3.5 px-4 flex items-center justify-between hover:bg-purple-50/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-2xs transition-all">
                    {getIconForType(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pl-3">
                  {item.extra && (
                    <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                      {item.extra}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#4C0196] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {results.length > 0 ? `${results.length} total result(s) found` : 'Press Esc to exit search'}
          </span>
          <span className="hidden sm:inline">Use ↑ ↓ or Click to select</span>
        </div>
      </div>
    </div>
  );
};
