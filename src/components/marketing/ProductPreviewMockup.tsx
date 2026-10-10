import React, { useState } from 'react';
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
  Eye,
} from 'lucide-react';

export const ProductPreviewMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'reconciliation'>('overview');

  return (
    <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
      {/* Top Window Bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
            bizflow.app/app/dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Interactive Product Preview
          </span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/70 px-2 py-0.5 rounded-full">
            Sample Data
          </span>
        </div>
      </div>

      {/* Internal Navigation Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4C0196] text-white flex items-center justify-center font-bold text-xs">
            BF
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Main Business Workspace</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Live Currency: NGN (₦) • Daily Session Active
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-700 text-[#4C0196] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Financial Summary
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-white dark:bg-slate-700 text-[#4C0196] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Recent Sales
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-white dark:bg-slate-700 text-[#4C0196] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Drawer Balance
          </button>
        </div>
      </div>

      {/* Main Workspace Preview Content */}
      <div className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-5">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Sales */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Total Sales</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
              ₦845,000.00
            </div>
            <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <span>+18.4% vs last period</span>
            </div>
          </div>

          {/* Card 2: Expenses */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Total Expenses</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
              ₦320,000.00
            </div>
            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              Rent, Generator, Supplies
            </div>
          </div>

          {/* Card 3: Net Profit */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/40 to-white dark:from-purple-950/20 dark:to-slate-900 shadow-2xs">
            <div className="flex items-center justify-between text-[#4C0196] dark:text-purple-300 text-xs font-bold">
              <span>Net Profit</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4C0196] dark:text-purple-400" />
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold text-[#4C0196] dark:text-purple-200 font-mono">
              ₦525,000.00
            </div>
            <div className="mt-1 text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
              62.1% Operating Margin
            </div>
          </div>

          {/* Card 4: Customer Debts */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Customer Debts</span>
              <Users className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              ₦115,000.00
            </div>
            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              3 customers with balance
            </div>
          </div>
        </div>

        {/* Tab 1: Overview Breakdown */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Revenue & Category Distribution */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Payment Method Collection Breakdown
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Real-Time Verification</span>
              </div>

              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Bank Transfer (Zenith &amp; OPay)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      ₦560,000.00 (66.3%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#4C0196] rounded-full" style={{ width: '66.3%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Cash in Counter Drawer
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      ₦210,000.00 (24.8%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '24.8%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">POS Card Terminal</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      ₦75,000.00 (8.9%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: '8.9%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Thermal POS Ready Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Printer className="w-3.5 h-3.5 text-[#4C0196]" />
                  <span>Thermal POS Ready</span>
                </div>
                <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Formats Supported:</span>
                    <span className="font-bold">58mm &amp; 80mm Roll</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Sequence Integrity:</span>
                    <span className="font-bold text-emerald-600">Strictly Monotonic</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Invoice Counter:</span>
                    <span className="font-mono font-semibold">#108</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-100 dark:border-purple-900/40 text-[11px] text-[#4C0196] dark:text-purple-300 flex items-center gap-2">
                <Receipt className="w-4 h-4 shrink-0" />
                <span>One-click thermal print dialog without drivers</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Recent Sales Table */}
        {activeTab === 'sales' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Recent Transactions</span>
              <span className="text-[11px] text-emerald-600 font-semibold">All Payments Verified</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer / Item</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">#108</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium">Chinedu Okafor</div>
                      <div className="text-[10px] text-slate-500">Web Development (Full Program)</div>
                    </td>
                    <td className="py-2.5 px-3">Transfer</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        Paid Full
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₦120,000.00
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">#107</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium">Grace Adebayo</div>
                      <div className="text-[10px] text-slate-500">UI/UX Design Certification</div>
                    </td>
                    <td className="py-2.5 px-3">Cash</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        Part Paid
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₦45,000.00
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">#106</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium">David Nwachukwu</div>
                      <div className="text-[10px] text-slate-500">Computer Appreciation Training</div>
                    </td>
                    <td className="py-2.5 px-3">POS Card</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        Paid Full
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₦35,000.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Daily Drawer Cash Reconciliation */}
        {activeTab === 'reconciliation' && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Daily Counter Cash Drawer Reconciliation
                </span>
                <span className="text-[10px] text-slate-500">Prevents cashier shortfalls and end-of-day discrepancies</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Balanced (₦0.00 Variance)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500">Opening Cash Float</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">₦25,000.00</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500">+ Cash Sales Inflow</div>
                <div className="font-bold text-emerald-600 mt-1">₦210,000.00</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500">- Cash Expenses Paid</div>
                <div className="font-bold text-rose-600 mt-1">₦40,000.00</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="text-[10px] text-[#4C0196] dark:text-purple-300 font-bold">= Expected Cash Count</div>
                <div className="font-bold text-[#4C0196] dark:text-purple-200 mt-1">₦195,000.00</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Banner */}
      <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-time financial integrity: Unpaid debts are never treated as revenue.</span>
        </div>
        <div className="font-semibold text-[#4C0196] dark:text-purple-400">
          Try BizFlow in your browser &rarr;
        </div>
      </div>
    </div>
  );
};
