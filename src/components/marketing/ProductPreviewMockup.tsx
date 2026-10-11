import React, { useState } from 'react';
import { BizFlowIcon, BizFlowLogo } from '../common/BizFlowLogo';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Printer,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  CreditCard,
  Building,
  Smartphone,
  Laptop,
  Package,
  MessageCircle,
  AlertTriangle,
  Search,
  Bell,
  ChevronRight,
  Sparkles,
  ArrowDownCircle,
  LayoutDashboard,
  Menu,
} from 'lucide-react';

export const ProductPreviewMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'reconciliation' | 'inventory'>('overview');

  return (
    <div
      className="relative w-full"
      role="region"
      aria-label="BizFlow Product Showcase Preview"
    >
      {/* Ambient background soft glow */}
      <div
        aria-hidden="true"
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-4/5 h-64 bg-gradient-to-r from-purple-500/15 via-rose-500/10 to-indigo-500/15 dark:from-purple-900/25 dark:via-rose-950/15 dark:to-indigo-950/20 rounded-full blur-3xl pointer-events-none -z-10"
      />

      {/* Showcase Grid / Composition */}
      <div className="relative">
        {/* ========================================================= */}
        {/* 1. LAPTOP MOCKUP (Desktop Application Dashboard View)    */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[88%] xl:w-[89%] mx-auto transition-all">
          {/* Laptop Screen Top Lid Frame */}
          <div className="relative rounded-t-2xl sm:rounded-t-3xl bg-slate-900 p-2 sm:p-3 pb-0 sm:pb-0 shadow-2xl shadow-purple-950/20 border border-slate-700/70 ring-1 ring-white/10">
            {/* Screen Top Bezel with Camera Dot */}
            <div className="h-4 sm:h-5 flex items-center justify-center relative">
              <div className="w-2 h-2 rounded-full bg-slate-800 ring-1 ring-slate-700/80 flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-emerald-500/70" />
              </div>
            </div>

            {/* Laptop Display Inner Surface */}
            <div className="rounded-t-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-left">
              {/* Window Header / Browser Chrome */}
              <div className="px-3 sm:px-4 py-2.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                {/* Traffic Lights */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div className="hidden sm:flex items-center gap-1.5 ml-2.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-500 font-bold">https://</span>
                    <span>bizflow.app/app/dashboard</span>
                  </div>
                </div>

                {/* Device Title & Compliance Pill */}
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Laptop className="w-3.5 h-3.5 text-[#4C0196] dark:text-purple-400" />
                    <span>Desktop Dashboard</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-[#4C0196] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Sample Data
                  </span>
                </div>
              </div>

              {/* Internal Workspace Top Bar */}
              <div className="px-3 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2.5">
                {/* Brand & Workspace Identity */}
                <div className="flex items-center gap-2.5">
                  <BizFlowIcon size={28} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Smartcore ICT Centre
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="System Online" />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span>Live Currency: NGN (₦)</span>
                      <span>·</span>
                      <span>Asaba Branch</span>
                    </div>
                  </div>
                </div>

                {/* Interactive View Tabs */}
                <div
                  className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs"
                  role="tablist"
                  aria-label="Preview Tabs"
                >
                  <button
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'overview'
                        ? 'bg-white dark:bg-slate-700 text-[#4C0196] dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Financial Summary
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'sales'}
                    onClick={() => setActiveTab('sales')}
                    className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'sales'
                        ? 'bg-white dark:bg-slate-700 text-[#4C0196] dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Recent Sales
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'reconciliation'}
                    onClick={() => setActiveTab('reconciliation')}
                    className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'reconciliation'
                        ? 'bg-white dark:bg-slate-700 text-[#4C0196] dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Drawer Balance
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'inventory'}
                    onClick={() => setActiveTab('inventory')}
                    className={`hidden sm:inline-block px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'inventory'
                        ? 'bg-white dark:bg-slate-700 text-[#4C0196] dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Inventory &amp; Stock
                  </button>
                </div>
              </div>

              {/* Main Dashboard Preview Workspace Body */}
              <div className="p-3 sm:p-5 bg-slate-50/60 dark:bg-slate-950/50 space-y-3.5 sm:space-y-4">
                {/* 4 Core Metric KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {/* Metric 1: Total Sales */}
                  <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                      <span>Total Sales</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                      ₦845,000.00
                    </div>
                    <div className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                      <span>+18.4% vs last period</span>
                    </div>
                  </div>

                  {/* Metric 2: Total Expenses */}
                  <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                      <span>Operating Expenses</span>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                      ₦320,000.00
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Fuel, Generator, Supplies
                    </div>
                  </div>

                  {/* Metric 3: Net Profit */}
                  <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900 shadow-2xs">
                    <div className="flex items-center justify-between text-[#4C0196] dark:text-purple-300 text-[11px] font-bold">
                      <span>True Net Profit</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4C0196] dark:text-purple-400" />
                    </div>
                    <div className="mt-1 text-base sm:text-lg font-bold text-[#4C0196] dark:text-purple-200 font-mono tabular-nums">
                      ₦525,000.00
                    </div>
                    <div className="mt-0.5 text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                      62.1% Net Operating Margin
                    </div>
                  </div>

                  {/* Metric 4: Customer Debts */}
                  <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                      <span>Customer Balances</span>
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="mt-1 text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                      ₦115,000.00
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      3 student debts tracked
                    </div>
                  </div>
                </div>

                {/* Tab Pane 1: Financial Summary & Trend Chart */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Left 2 Cols: Collection Breakdown & 7-Day Trend Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Revenue Collection Channels
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          100% Real-Time
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              Bank Transfer (Zenith &amp; OPay)
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                              ₦560,000.00 (66.3%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-[#4C0196] rounded-full" style={{ width: '66.3%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              Cash in Counter Drawer
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                              ₦210,000.00 (24.8%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '24.8%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              POS Card Terminal
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                              ₦75,000.00 (8.9%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: '8.9%' }} />
                          </div>
                        </div>
                      </div>

                      {/* 7-Day Revenue Visual Sparkline */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-medium text-slate-600 dark:text-slate-400">7-Day Inflow Rhythm:</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 font-bold">Mon ₦110k</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 font-bold">Wed ₦165k</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#4C0196] text-white font-bold">Today ₦185k</span>
                        </div>
                      </div>
                    </div>

                    {/* Right 1 Col: Thermal POS Ready Card */}
                    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                          <Printer className="w-3.5 h-3.5 text-[#4C0196]" />
                          <span>Thermal POS Ready</span>
                        </div>
                        <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Paper Rolls:</span>
                            <span className="font-bold">58mm &amp; 80mm</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Invoice Numbering:</span>
                            <span className="font-bold text-emerald-600">Strictly Monotonic</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Last Invoice:</span>
                            <span className="font-mono font-semibold">#108</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-100 dark:border-purple-900/40 text-[10px] text-[#4C0196] dark:text-purple-300 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 shrink-0" />
                        <span>Driverless browser thermal printing</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Pane 2: Recent Sales Records */}
                {activeTab === 'sales' && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                    <div className="p-2.5 sm:p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">Recent Transactions</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">All Payments Verified</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3">Invoice #</th>
                            <th className="py-2 px-3">Customer / Course</th>
                            <th className="py-2 px-3">Channel</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          <tr>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">#108</td>
                            <td className="py-2 px-3">
                              <div className="font-medium text-slate-900 dark:text-white">Chinedu Okafor</div>
                              <div className="text-[10px] text-slate-500">Web Development Course</div>
                            </td>
                            <td className="py-2 px-3">Transfer</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                Paid Full
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                              ₦120,000.00
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">#107</td>
                            <td className="py-2 px-3">
                              <div className="font-medium text-slate-900 dark:text-white">Grace Adebayo</div>
                              <div className="text-[10px] text-slate-500">UI/UX Design Masterclass</div>
                            </td>
                            <td className="py-2 px-3">Cash</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                Part Paid
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                              ₦45,000.00
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">#106</td>
                            <td className="py-2 px-3">
                              <div className="font-medium text-slate-900 dark:text-white">David Nwachukwu</div>
                              <div className="text-[10px] text-slate-500">Computer Appreciation Training</div>
                            </td>
                            <td className="py-2 px-3">POS Card</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                Paid Full
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                              ₦35,000.00
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab Pane 3: Daily Drawer Cash Reconciliation */}
                {activeTab === 'reconciliation' && (
                  <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Daily Counter Cash Reconciliation
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Audited daily float against physical counter drawer
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Balanced (₦0.00 Variance)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-[10px] text-slate-500">Opening Cash Float</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 tabular-nums">₦25,000.00</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-[10px] text-slate-500">+ Cash Sales Inflow</div>
                        <div className="font-bold text-emerald-600 mt-0.5 tabular-nums">₦210,000.00</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-[10px] text-slate-500">- Cash Expenses Paid</div>
                        <div className="font-bold text-rose-600 mt-0.5 tabular-nums">₦40,000.00</div>
                      </div>
                      <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="text-[10px] text-[#4C0196] dark:text-purple-300 font-bold">= Expected Cash Count</div>
                        <div className="font-bold text-[#4C0196] dark:text-purple-200 mt-0.5 tabular-nums">₦195,000.00</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Pane 4: Inventory & Stock */}
                {activeTab === 'inventory' && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                    <div className="p-2.5 sm:p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">Active Product Catalogue</span>
                      <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>2 Reorder Alerts</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3">Item / SKU</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3">Price</th>
                            <th className="py-2 px-3 text-right">In Stock</th>
                            <th className="py-2 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          <tr>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                              Kingston 64GB USB 3.0 Flash Drive
                            </td>
                            <td className="py-2 px-3 text-slate-500">Hardware &amp; Accessories</td>
                            <td className="py-2 px-3 font-mono">₦7,500.00</td>
                            <td className="py-2 px-3 text-right font-mono font-bold">25</td>
                            <td className="py-2 px-3 text-right">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                In Stock
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                              HP LaserJet 85A Black Toner Cartridge
                            </td>
                            <td className="py-2 px-3 text-slate-500">Office Consumables</td>
                            <td className="py-2 px-3 font-mono">₦28,000.00</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">2</td>
                            <td className="py-2 px-3 text-right">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                Low Stock (Min: 5)
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                              Thermal Receipt Paper Roll 80mm
                            </td>
                            <td className="py-2 px-3 text-slate-500">POS Supplies</td>
                            <td className="py-2 px-3 font-mono">₦1,500.00</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-amber-600">8</td>
                            <td className="py-2 px-3 text-right">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Reorder Soon (Min: 10)
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Laptop Screen Bottom Status Strip */}
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cloud SQL PostgreSQL tenant isolation &amp; bcrypt password encryption</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[#4C0196] dark:text-purple-300 font-semibold">
                  <span>Interactive Live Preview</span>
                </div>
              </div>
            </div>
          </div>

          {/* Laptop Aluminum Base Hinge & Keyboard Deck */}
          <div className="relative">
            {/* Upper metallic edge */}
            <div className="h-2.5 sm:h-3.5 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-400 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 rounded-b-lg border-t border-slate-400/30 flex items-start justify-center shadow-md">
              {/* Center thumb opening notch */}
              <div className="w-20 sm:w-28 h-1 sm:h-1.5 bg-slate-400/80 dark:bg-slate-600 rounded-b-md" />
            </div>
            {/* Bottom shadow lip */}
            <div className="h-1 sm:h-1.5 w-[96%] mx-auto bg-slate-400/40 dark:bg-slate-950/80 rounded-b-2xl blur-2xs" />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SMARTPHONE MOCKUP (Responsive Mobile View)             */}
        {/* ========================================================= */}
        {/* On Desktop/Tablet: Positioned overlapping in bottom-right */}
        {/* On Mobile: Stacks gracefully beneath the laptop           */}
        <div className="mt-6 sm:mt-8 lg:mt-0 lg:absolute lg:right-0 xl:right-2 lg:-bottom-8 xl:-bottom-10 w-full max-w-[270px] sm:max-w-[280px] lg:w-[250px] xl:w-[275px] mx-auto z-20 transition-transform duration-300 hover:-translate-y-1">
          {/* Phone Outer Chassis */}
          <div className="rounded-[36px] sm:rounded-[40px] p-2.5 sm:p-3 bg-slate-900 border-[3.5px] border-slate-700/90 shadow-2xl shadow-black/50 ring-1 ring-white/15">
            {/* Dynamic Island Pill Notch */}
            <div className="w-20 h-3.5 bg-black rounded-full mx-auto mb-1.5 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 ring-1 ring-slate-800" />
            </div>

            {/* Mobile Screen Surface */}
            <div className="rounded-[28px] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-left text-xs">
              {/* Mobile Top Status Bar */}
              <div className="px-3 pt-1 pb-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold">9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px]">5G</span>
                  <div className="w-3.5 h-2 rounded-xs border border-slate-400 dark:border-slate-500 p-0.5">
                    <div className="h-full w-full bg-emerald-500 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Mobile App Header */}
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BizFlowIcon size={20} />
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    Biz<span className="text-[#4C0196]">Flow</span>
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 flex items-center justify-center text-[10px] font-bold">
                  PD
                </div>
              </div>

              {/* Mobile Content Area */}
              <div className="p-2.5 space-y-2 bg-slate-50/70 dark:bg-slate-950/60">
                {/* Mobile Quick Actions Row */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="py-1.5 px-2 bg-[#4C0196] text-white rounded-lg text-center font-bold text-[10px] shadow-2xs">
                    + New Sale
                  </div>
                  <div className="py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-center font-semibold text-[10px]">
                    + Expense
                  </div>
                </div>

                {/* Mobile KPI Summary Card */}
                <div className="p-2.5 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-white dark:bg-slate-900 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Today&apos;s Net Profit</span>
                    <span className="font-semibold text-emerald-600">+62.1%</span>
                  </div>
                  <div className="text-sm font-bold text-[#4C0196] dark:text-purple-300 font-mono tabular-nums">
                    ₦525,000.00
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">
                    ₦845k Inflow · ₦320k Outflow
                  </div>
                </div>

                {/* Mobile WhatsApp Debt Reminder Snippet */}
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">Grace Adebayo</span>
                    <span className="font-mono text-amber-600 font-bold">₦20,000</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>Graphic Design (Balance)</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <MessageCircle className="w-2.5 h-2.5" />
                      <span>WhatsApp</span>
                    </span>
                  </div>
                </div>

                {/* Mobile Thermal Receipt Output Snippet */}
                <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-[9px] text-[#4C0196] dark:text-purple-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Printer className="w-3 h-3" />
                    <span>Invoice #108 Printed</span>
                  </span>
                  <span className="font-mono font-bold">₦120,000</span>
                </div>
              </div>

              {/* Mobile Bottom Tab Bar (Home, Sales, Products, Expenses, More) */}
              <div className="px-2 py-1.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 text-center text-[8px] text-slate-500 dark:text-slate-400">
                <div className="text-[#4C0196] dark:text-purple-400 font-bold flex flex-col items-center">
                  <LayoutDashboard className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Home</span>
                </div>
                <div className="flex flex-col items-center">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Sales</span>
                </div>
                <div className="flex flex-col items-center">
                  <Package className="w-3.5 h-3.5" />
                  <span>Items</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </div>
                <div className="flex flex-col items-center">
                  <Menu className="w-3.5 h-3.5" />
                  <span>More</span>
                </div>
              </div>

              {/* Mobile Home Gesture Indicator Bar */}
              <div className="py-1 bg-white dark:bg-slate-900 flex justify-center">
                <div className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>

          {/* Badge under mobile mockup indicating responsive smartphone support */}
          <div className="mt-2 text-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <Smartphone className="w-3 h-3 text-[#4C0196] dark:text-purple-400" />
              <span>Full Mobile Phone PWA Sync</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
