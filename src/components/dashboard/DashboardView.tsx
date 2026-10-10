import React, { useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/calculations';
import { SalesExpenseTrendChart } from '../common/Charts';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  AlertCircle,
  Package,
  PlusCircle,
  MinusCircle,
  Plus,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  Phone,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { Sale, Customer, Payable } from '../../types';

interface DashboardViewProps {
  onOpenRecordSale: () => void;
  onOpenRecordExpense: () => void;
  onOpenAddProduct?: () => void;
  onViewSaleReceipt: (sale: Sale) => void;
  onOpenCollectDebt: (customer: Customer) => void;
  onOpenPaySupplier: (payable: Payable) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenRecordSale,
  onOpenRecordExpense,
  onOpenAddProduct,
  onViewSaleReceipt,
  onOpenCollectDebt,
  onOpenPaySupplier,
  setActiveTab,
}) => {
  const {
    business,
    sales,
    expenses,
    customers,
    payables,
    products,
    metrics,
    hasPermission,
  } = useBusiness();
  const today = getTodayDateString();

  const canViewProfit = hasPermission('view_profit');
  const canViewReports = hasPermission('view_reports');

  // Low stock items
  const lowStockItems = useMemo(() => {
    return products.filter(
      p => p.type === 'product' && typeof p.currentStock === 'number' && p.currentStock <= (p.minStockLevel || 5)
    );
  }, [products]);

  // Debtors list (top 3)
  const topDebtors = useMemo(() => {
    return customers
      .filter(c => c.outstandingDebt > 0)
      .sort((a, b) => b.outstandingDebt - a.outstandingDebt)
      .slice(0, 3);
  }, [customers]);

  // Payables list (top 2)
  const topPayables = useMemo(() => {
    return payables
      .filter(p => p.balanceDue > 0)
      .sort((a, b) => b.balanceDue - a.balanceDue)
      .slice(0, 2);
  }, [payables]);

  // Recent 5 sales
  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
      .slice(0, 5);
  }, [sales]);

  // Prepare 7-day trend data for lightweight chart
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      const daySales = sales
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + s.totalAmount, 0);

      const dayExpenses = expenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      let dayProfit = 0;
      if (canViewProfit) {
        const dayVat = sales
          .filter(s => s.date === dateStr)
          .reduce((sum, s) => sum + (s.taxAmount || 0), 0);
        const dayNetRev = daySales - dayVat;
        const dayCogs = sales
          .filter(s => s.date === dateStr)
          .reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0), 0);
        dayProfit = dayNetRev - dayCogs - dayExpenses;
      }

      days.push({
        dayLabel,
        date: dateStr,
        sales: daySales,
        expenses: dayExpenses,
        profit: dayProfit,
      });
    }
    return days;
  }, [sales, expenses, canViewProfit]);

  const handleAddProduct = () => {
    if (onOpenAddProduct) {
      onOpenAddProduct();
    } else {
      setActiveTab('products');
    }
  };

  const hasAttentionItems = topDebtors.length > 0 || lowStockItems.length > 0 || topPayables.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & PRIMARY MVP ACTIONS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              BizFlow MVP
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {business.name || 'Smartcore ICT Centre'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Business Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time sales, profit, cash flow, and debt position · {formatDate(today)}
          </p>
        </div>

        {/* The 3 Primary Actions (Never buried in menus) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleAddProduct}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
            title="Add a new course, training program, or physical item to your inventory"
          >
            <Package className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>+ Add Product</span>
          </button>

          <button
            onClick={onOpenRecordExpense}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#7B001C] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 shadow-2xs"
            title="Record fuel, shop rent, supplies, or operating cost"
          >
            <MinusCircle className="w-4 h-4 text-[#7B001C] dark:text-rose-400" />
            <span>+ Add Expense</span>
          </button>

          <button
            onClick={onOpenRecordSale}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
            title="Record a customer purchase or student course fee"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Sale</span>
          </button>
        </div>
      </div>

      {/* Plan & Usage Summary Strip */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#4C0196] text-white shadow-xs shrink-0">
            <Zap className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Workspace Plan:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white dark:bg-slate-800 text-[#4C0196] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Active Tier
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Track live monthly sales, expenses, and catalog usage against plan allowances
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('plan')}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#4C0196] dark:text-purple-300 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 border border-purple-200 dark:border-purple-700 shadow-2xs transition-colors cursor-pointer"
        >
          <span>View Usage &amp; Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. CORE MVP BUSINESS INDICATORS (Clear Visual Hierarchy: 4-5 focused metrics) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            How is your business doing?
          </h2>
          {canViewReports && (
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-[#4C0196] dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Reports</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. REVENUE (Dominant Hero Card) */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Total Revenue</span>
              <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(metrics.monthGrossInvoiced || metrics.monthSales, business.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Today:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(metrics.todayGrossInvoiced || metrics.todaySales, business.currencySymbol)}
              </span>
            </div>
          </div>

          {/* 2. PROFIT / GAIN */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Net Profit (Est.)</span>
              <div className={`p-1 rounded-md ${metrics.monthProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
                {metrics.monthProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              </div>
            </div>
            {canViewProfit ? (
              <div className={`text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight ${metrics.monthProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {formatCurrency(metrics.monthProfit, business.currencySymbol)}
              </div>
            ) : (
              <div className="text-lg font-bold text-slate-400 italic">
                Restricted
              </div>
            )}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Today's Gain:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {canViewProfit ? formatCurrency(metrics.todayProfit, business.currencySymbol) : '—'}
              </span>
            </div>
          </div>

          {/* 3. OUTSTANDING DEBT (Customers Owe Us) */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Customers Owe You</span>
              <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
              {formatCurrency(metrics.totalReceivables, business.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Debtors:</span>
              <button
                onClick={() => setActiveTab('customers')}
                className="font-semibold text-[#4C0196] dark:text-purple-400 hover:underline cursor-pointer"
              >
                {customers.filter(c => c.outstandingDebt > 0).length} customer(s) →
              </button>
            </div>
          </div>

          {/* 4. EXPENSES (Total Outgoing Costs) */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Total Expenses</span>
              <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/60 text-[#7B001C] dark:text-rose-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#7B001C] dark:text-rose-400 tabular-nums tracking-tight">
              {formatCurrency(metrics.monthExpenses, business.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Today:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(metrics.todayExpenses, business.currencySymbol)}
              </span>
            </div>
          </div>

          {/* 5. INVENTORY & STOCK HEALTH */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Products &amp; Stock</span>
              <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
              {products.length} Items
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Stock Status:</span>
              {lowStockItems.length > 0 ? (
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {lowStockItems.length} low
                </span>
              ) : (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Healthy
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. WHAT NEEDS YOUR ATTENTION? (Direct action cards) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3.5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#4C0196] dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              What Needs Your Attention
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Action items for today
          </span>
        </div>

        {!hasAttentionItems ? (
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                All clear! No overdue customer debts or low-stock alerts.
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Your business is operating smoothly. Keep recording sales and tracking items.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Attention Item A: Uncollected Customer Debt */}
            {topDebtors.length > 0 && (
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    Uncollected Debts ({topDebtors.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="text-[11px] font-semibold text-[#4C0196] dark:text-purple-400 hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-1.5">
                  {topDebtors.map(debtor => (
                    <div
                      key={debtor.id}
                      className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                          {debtor.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {debtor.phone || 'No phone'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs">
                          {formatCurrency(debtor.outstandingDebt, business.currencySymbol)}
                        </span>
                        <button
                          onClick={() => onOpenCollectDebt(debtor)}
                          className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-md transition-colors cursor-pointer"
                        >
                          Collect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attention Item B: Low Stock Warning */}
            {lowStockItems.length > 0 && (
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Low Stock Alert ({lowStockItems.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-[11px] font-semibold text-[#4C0196] dark:text-purple-400 hover:underline"
                  >
                    Restock →
                  </button>
                </div>
                <div className="space-y-1.5">
                  {lowStockItems.slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40"
                    >
                      <div className="truncate max-w-[140px]">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Min required: {item.minStockLevel || 5} units
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                        {item.currentStock ?? item.openingStock ?? 0} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attention Item C: Upcoming Supplier Debts */}
            {topPayables.length > 0 && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#7B001C]" />
                    Supplier Payables ({topPayables.length})
                  </span>
                  <button
                    onClick={() => onOpenPaySupplier(topPayables[0])}
                    className="text-[11px] font-semibold text-[#7B001C] dark:text-rose-400 hover:underline"
                  >
                    Settle Bills →
                  </button>
                </div>
                <div className="space-y-1.5">
                  {topPayables.map(payable => (
                    <div
                      key={payable.id}
                      className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800"
                    >
                      <div className="truncate max-w-[140px]">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {payable.vendorName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {payable.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#7B001C] dark:text-rose-400 text-xs">
                          {formatCurrency(payable.balanceDue, business.currencySymbol)}
                        </span>
                        <button
                          onClick={() => onOpenPaySupplier(payable)}
                          className="px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded border border-slate-300 dark:border-slate-700"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. RECENT TRANSACTIONS & SALES (What is happening in your business) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Sales Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Sales &amp; Invoices
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest customer purchases and issued receipts
              </p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-semibold text-[#4C0196] dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>View All Sales ({sales.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentSales.length === 0 ? (
            /* Empty State for MVP */
            <div className="py-10 px-4 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 rounded-2xl flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No sales recorded yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Record your first customer sale to start tracking daily revenue, profits, and issuing receipts.
                </p>
              </div>
              <button
                onClick={onOpenRecordSale}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record First Sale</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSales.map(sale => (
                <div
                  key={sale.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {sale.customerName}
                        </span>
                        <span className="font-mono text-[10px] text-[#4C0196] dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded">
                          #{sale.invoiceNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{formatDate(sale.date)}</span>
                        <span>·</span>
                        <span className="truncate max-w-[150px] sm:max-w-xs">
                          {sale.items.map(i => i.productName).join(', ')}
                        </span>
                        {sale.balanceDue > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[#7B001C] dark:text-rose-400 font-bold">
                              Owes: {formatCurrency(sale.balanceDue, business.currencySymbol)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-11 sm:pl-0">
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(sale.totalAmount, business.currencySymbol)}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {sale.paymentMethod}
                      </div>
                    </div>

                    <button
                      onClick={() => onViewSaleReceipt(sale)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="View & Print Receipt"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 span): Clean 7-Day Performance Trend */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                7-Day Cash Trend
              </h3>
              <span className="text-[11px] text-slate-400">Inflow vs. Outflow</span>
            </div>
            <div className="pt-2">
              <SalesExpenseTrendChart
                data={trendData}
                currencySymbol={business.currencySymbol}
                hideProfit={!canViewProfit}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 mt-4">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Quick Tip for Smartcore:
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Record sales immediately when cash or transfer is received to keep customer debt records and inventory automatically synchronized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
