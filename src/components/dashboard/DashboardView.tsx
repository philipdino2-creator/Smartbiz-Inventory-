import React, { useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency, formatDate, getTodayDateString, getRecurringDueStatus } from '../../utils/calculations';
import { SalesExpenseTrendChart, ExpenseCategoryBreakdown } from '../common/Charts';
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
  Clock,
  Eye,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';
import { Sale, Customer, Payable } from '../../types';

interface DashboardViewProps {
  onOpenRecordSale: () => void;
  onOpenRecordExpense: () => void;
  onViewSaleReceipt: (sale: Sale) => void;
  onOpenCollectDebt: (customer: Customer) => void;
  onOpenPaySupplier: (payable: Payable) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenRecordSale,
  onOpenRecordExpense,
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
    recurringExpenses,
    recordAllDueRecurringExpenses,
    metrics,
    hasPermission,
  } = useBusiness();
  const today = getTodayDateString();

  const canViewProfit = hasPermission('view_profit');
  const canViewReports = hasPermission('view_reports');

  // Recurring status counts
  const overdueRecCount = useMemo(() => {
    return recurringExpenses.filter(r => r.status === 'active' && getRecurringDueStatus(r.nextDueDate, today) === 'overdue').length;
  }, [recurringExpenses, today]);

  const dueSoonRecCount = useMemo(() => {
    return recurringExpenses.filter(r => {
      const s = getRecurringDueStatus(r.nextDueDate, today);
      return r.status === 'active' && (s === 'due_today' || s === 'due_soon');
    }).length;
  }, [recurringExpenses, today]);

  const upcomingRecCount = useMemo(() => {
    return recurringExpenses.filter(r => r.status === 'active' && getRecurringDueStatus(r.nextDueDate, today) === 'upcoming').length;
  }, [recurringExpenses, today]);

  // Prepare 7-day trend data
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

      // Only compute and expose COGS/Profit if user has view_profit permission
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

  // Prepare category breakdown for current month
  const categoryBreakdown = useMemo(() => {
    const currentMonth = today.slice(0, 7);
    const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    const totalMonthExp = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const catMap: Record<string, number> = {};
    monthExpenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    return Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalMonthExp > 0 ? (amount / totalMonthExp) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, today]);

  // Debtors list (top 3)
  const topDebtors = useMemo(() => {
    return customers
      .filter(c => c.outstandingDebt > 0)
      .sort((a, b) => b.outstandingDebt - a.outstandingDebt)
      .slice(0, 4);
  }, [customers]);

  // Payables list (top 2)
  const topPayables = useMemo(() => {
    return payables
      .filter(p => p.balanceDue > 0)
      .sort((a, b) => b.balanceDue - a.balanceDue)
      .slice(0, 3);
  }, [payables]);

  // Low stock products
  const lowStockItems = useMemo(() => {
    return products.filter(
      p => p.type === 'product' && typeof p.currentStock === 'number' && p.currentStock <= (p.minStockLevel || 5)
    );
  }, [products]);

  // Recent combined transactions
  const recentActivities = useMemo(() => {
    const combined = [
      ...sales.map(s => ({
        id: s.id,
        type: 'sale' as const,
        title: `Sale: ${s.customerName}`,
        amount: s.totalAmount,
        date: s.date,
        time: s.time,
        status: s.paymentStatus,
        method: s.paymentMethod,
        raw: s,
      })),
      ...expenses.map(e => ({
        id: e.id,
        type: 'expense' as const,
        title: `Expense: ${e.category} (${e.vendorName})`,
        amount: e.amount,
        date: e.date,
        time: e.time,
        status: 'paid' as const,
        method: e.paymentMethod,
        raw: e,
      })),
    ];
    return combined.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)).slice(0, 6);
  }, [sales, expenses]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-[#4C0196] border border-purple-200">
              BizFlow Dashboard
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">{business.name || 'Smartcore ICT Centre'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {business.name || 'Smartcore ICT Centre'} Position
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cash flow, receivables, payables, and estimated net profit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRecordExpense}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#7B001C] bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-2xs"
          >
            <MinusCircle className="w-4 h-4" />
            <span>+ Record Expense</span>
          </button>
          <button
            onClick={onOpenRecordSale}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl transition-all cursor-pointer shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Record Sale</span>
          </button>
        </div>
      </div>

      {/* TODAY'S POSITION CARDS */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Today's Position ({formatDate(today)})
          </h2>
          <span className="text-xs font-medium text-slate-400">Africa/Lagos</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Today's Sales */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Today's Invoiced Sales</span>
              <div className="p-1 rounded-md bg-purple-50 text-[#4C0196]">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(metrics.todayGrossInvoiced || metrics.todaySales, business.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between gap-1">
              {metrics.todayVatCollected > 0 ? (
                <span>
                  Net: <span className="font-semibold text-slate-700 font-mono">{formatCurrency(metrics.todayOperatingRevenue, business.currencySymbol)}</span>
                  {' · '}
                  VAT: <span className="font-semibold text-purple-700 font-mono">{formatCurrency(metrics.todayVatCollected, business.currencySymbol)}</span>
                </span>
              ) : (
                <span>
                  Cash collected: <span className="font-semibold text-slate-700 font-mono">{formatCurrency(metrics.todayCashCollected, business.currencySymbol)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Today's Expenses */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Today's Expenses</span>
              <div className="p-1 rounded-md bg-rose-50 text-[#7B001C]">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#7B001C] tabular-nums">
              {formatCurrency(metrics.todayExpenses, business.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Generator, fuel, supplies &amp; operations
            </div>
          </div>

          {/* Card 3: Today's Estimated Net Profit (Restricted to users with view_profit) */}
          {canViewProfit ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Today's Net Gain</span>
                <div className={`p-1 rounded-md ${metrics.todayProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {metrics.todayProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>
              <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${metrics.todayProfit >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formatCurrency(metrics.todayProfit, business.currencySymbol)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Net turnover minus direct costs &amp; expenses (excludes VAT)
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Today's Activity &amp; Invoices</span>
                <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {metrics.todaySalesCount} Invoices
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Cash inflow: <span className="font-semibold text-slate-700 font-mono">{formatCurrency(metrics.todayCashCollected, business.currencySymbol)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MONTH-TO-DATE & DEBTS POSITION CARDS */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            This Month &amp; Debt Position
          </h2>
          {canViewReports && (
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-[#4C0196] hover:underline cursor-pointer"
            >
              View Full P&amp;L Report →
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Month Sales */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium block mb-1">Month's Sales</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatCurrency(metrics.monthGrossInvoiced || metrics.monthSales, business.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {metrics.monthVatCollected > 0
                ? `Net: ${formatCurrency(metrics.monthOperatingRevenue, business.currencySymbol)}`
                : 'Month to date'}
            </span>
          </div>

          {/* Month Expenses */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium block mb-1">Month's Expenses</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#7B001C] tabular-nums">
              {formatCurrency(metrics.monthExpenses, business.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Total operating costs</span>
          </div>

          {/* Customers Owing (Receivables) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium">Customers Owe Us</span>
              <Users className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 tabular-nums">
              {formatCurrency(metrics.totalReceivables, business.currencySymbol)}
            </div>
            <button
              onClick={() => setActiveTab('customers')}
              className="text-[11px] text-[#4C0196] font-semibold hover:underline mt-1 block"
            >
              Debtors ({customers.filter(c => c.outstandingDebt > 0).length}) →
            </button>
          </div>

          {/* We Owe Suppliers (Payables) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium">We Owe Suppliers</span>
              <AlertCircle className="w-3.5 h-3.5 text-[#7B001C]" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#7B001C] tabular-nums">
              {formatCurrency(metrics.totalPayables, business.currencySymbol)}
            </div>
            <button
              onClick={() => setActiveTab('payables')}
              className="text-[11px] text-[#7B001C] font-semibold hover:underline mt-1 block"
            >
              Payables ({payables.filter(p => p.balanceDue > 0).length}) →
            </button>
          </div>

          {/* Recurring Expenses Card */}
          <div
            onClick={() => setActiveTab('recurring')}
            className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-[#4C0196] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-900 group-hover:text-[#4C0196] transition-colors">
                Recurring Expenses
              </span>
              <CalendarClock className="w-3.5 h-3.5 text-[#4C0196]" />
            </div>
            <div className="text-xs space-y-0.5 mt-1 font-medium">
              <div className="flex items-center justify-between">
                <span className="text-[#7B001C] flex items-center gap-1 font-bold">
                  <span className="text-[11px]">🔴</span> {overdueRecCount} Overdue
                </span>
                <span className="text-amber-700 flex items-center gap-1">
                  <span className="text-[11px]">🟡</span> {dueSoonRecCount} Due
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-0.5">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="text-[11px]">🟢</span> {upcomingRecCount} Upcoming
                </span>
                <span className="text-[#4C0196] font-semibold group-hover:underline">
                  View →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION: 7-DAY TREND & CATEGORY SHARE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesExpenseTrendChart
            data={trendData}
            currencySymbol={business.currencySymbol}
            hideProfit={!canViewProfit}
          />
        </div>
        <div className="lg:col-span-1">
          <ExpenseCategoryBreakdown categories={categoryBreakdown} currencySymbol={business.currencySymbol} />
        </div>
      </div>

      {/* QUICK DEBT COLLECTION & INVENTORY ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Debtors Watchlist */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Uncollected Customer Debts</h3>
              <p className="text-xs text-slate-500">Highest outstanding student &amp; client balances</p>
            </div>
            <button
              onClick={() => setActiveTab('customers')}
              className="text-xs font-semibold text-[#4C0196] hover:underline"
            >
              View All Debtors
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {topDebtors.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No outstanding customer debts! All fees collected.</p>
            ) : (
              topDebtors.map(debtor => (
                <div key={debtor.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{debtor.name}</h4>
                    <p className="text-[11px] text-slate-500">{debtor.phone || 'No phone'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#7B001C] tabular-nums">
                      {formatCurrency(debtor.outstandingDebt, business.currencySymbol)}
                    </span>
                    <button
                      onClick={() => onOpenCollectDebt(debtor)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#4C0196] bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suppliers We Owe & Low Stock Alerts */}
        <div className="space-y-4">
          {/* Supplier Payables */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Upcoming Supplier Payables</h3>
                <p className="text-xs text-slate-500">Fuel, stationery, or inventory debts</p>
              </div>
              <button
                onClick={() => setActiveTab('payables')}
                className="text-xs font-semibold text-[#7B001C] hover:underline"
              >
                View Payables
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {topPayables.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No unpaid supplier debts.</p>
              ) : (
                topPayables.map(payable => (
                  <div key={payable.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">{payable.vendorName}</h4>
                      <p className="text-[11px] text-slate-500 truncate max-w-[160px] sm:max-w-xs">{payable.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#7B001C] tabular-nums">
                        {formatCurrency(payable.balanceDue, business.currencySymbol)}
                      </span>
                      <button
                        onClick={() => onOpenPaySupplier(payable)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#7B001C] bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      >
                        Settle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Warning (if any) */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
              <Package className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-900">Low Stock Alert</h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {lowStockItems.map(p => `${p.name} (${p.currentStock} left)`).join(' · ')}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('products')}
                className="text-xs font-semibold text-amber-900 hover:underline shrink-0"
              >
                Restock →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY LEDGER PREVIEW */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest recorded sales, enrollments, and expenses</p>
          </div>
          <button
            onClick={() => setActiveTab('ledger')}
            className="text-xs font-semibold text-[#4C0196] hover:underline"
          >
            View Complete Ledger →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivities.map(item => {
            const isSale = item.type === 'sale';
            return (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSale ? 'bg-purple-50 text-[#4C0196]' : 'bg-rose-50 text-[#7B001C]'
                  }`}>
                    {isSale ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{item.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{formatDate(item.date)}</span>
                      <span>·</span>
                      <span>{item.time}</span>
                      <span>·</span>
                      <span className="capitalize">{item.method}</span>
                      {isSale && (item.raw as Sale).balanceDue > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-[#7B001C] font-semibold">
                            Balance: {formatCurrency((item.raw as Sale).balanceDue, business.currencySymbol)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-11 sm:pl-0">
                  <span className={`font-mono text-xs font-bold tabular-nums ${isSale ? 'text-slate-900' : 'text-[#7B001C]'}`}>
                    {isSale ? '+' : '-'}{formatCurrency(item.amount, business.currencySymbol)}
                  </span>
                  {isSale && (
                    <button
                      onClick={() => onViewSaleReceipt(item.raw as Sale)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="View Invoice Receipt"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
