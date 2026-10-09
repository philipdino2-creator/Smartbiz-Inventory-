import React from 'react';
import { useRouter, Link } from '../../context/RouterContext';
import {
  UserPlus,
  Sliders,
  PlayCircle,
  Sun,
  Coffee,
  Moon,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building,
  Printer,
  Sparkles,
  CreditCard,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#4C0196] dark:text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple, Practical Workflow</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How BizFlow Works in Your Daily Operations
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          From first sign-up to daily counter reconciliation: discover how BizFlow simplifies record-keeping without complicated bookkeeping jargon.
        </p>
      </section>

      {/* 3 Step Main Journey */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 font-extrabold text-sm flex items-center justify-center">
                  01
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Step One
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Create Your Account in Seconds
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sign up with your name, email, and password. As the business owner, your account is immediately granted full administrative authority and Owner Protection guarantees.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No credit card or upfront commitment required</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automatic isolated PostgreSQL database schema</span>
                </li>
              </ul>
            </div>

            <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                <span>Sign Up Form</span>
                <span className="text-emerald-600 font-bold">&check; Owner Role Verified</span>
              </div>
              <div className="space-y-2">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Full Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Philip Dino</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Email Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">philip@smartcoreict.online</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Role Assignment:</span>
                  <span className="font-semibold text-[#4C0196] dark:text-purple-300">Business Owner (Protected)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 font-extrabold text-sm flex items-center justify-center">
                  02
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Step Two
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Set Up Your Workspace
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Add your business name, address, currency symbol (₦), and bank transfer account details. These populate your customer receipts and WhatsApp debt reminders automatically.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Configurable bank account numbers on receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Upload official logo for print slips and header</span>
                </li>
              </ul>
            </div>

            <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                <span>Business &amp; Receipt Configuration</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">Auto-Syncs Across Sessions</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 col-span-2">
                  <span className="text-[10px] text-slate-400 block">Organization Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Smartcore ICT Centre</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Bank Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Zenith Bank PLC</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Account Number:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">1014848368</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 font-extrabold text-sm flex items-center justify-center">
                  03
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Step Three
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Record Transactions &amp; Monitor Profit
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Click "Sale" to record a walk-in purchase, log generator fuel expenses in seconds, print thermal slips, and reconcile your cash drawer before shift close.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time dashboard updates without reloading</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Accurate net profit and debtor lists always ready</span>
                </li>
              </ul>
            </div>

            <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                <span>Daily Sales Ledger</span>
                <span className="text-emerald-600 font-bold">₦525,000.00 Net Profit</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Total Gross Inflow</div>
                  <div className="text-[10px] text-slate-400">Bank Transfer + Cash + POS</div>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">₦845,000.00</div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-600">Total Operating Expenses</div>
                  <div className="text-[10px] text-slate-400">Fuel, Utilities, Supplies</div>
                </div>
                <div className="text-base font-bold text-rose-600">₦320,000.00</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A Day in the Life with BizFlow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4C0196] dark:text-purple-400">
            Everyday Operations
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            A Typical Business Day with BizFlow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase">
              <Sun className="w-4 h-4" />
              <span>Morning Opening (8:30 AM)</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Drawer Float Logged</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The counter cashier enters the opening cash float (e.g. ₦25,000) for daily change. BizFlow starts tracking counter cash inflow immediately.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-[#4C0196] dark:text-purple-400 font-bold text-xs uppercase">
              <Coffee className="w-4 h-4" />
              <span>Daytime Operations (11:00 AM - 4:00 PM)</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Sales, Thermal Receipts &amp; Debts</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Customers make purchases across Cash, Transfer, and POS. Thermal slips print in 2 seconds. When installment balances occur, they enter the customer ledger.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">
              <Moon className="w-4 h-4" />
              <span>Closing Shift (6:00 PM)</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cash Reconciliation &amp; Audit</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The cashier counts the register drawer. BizFlow compares actual cash with recorded transactions, identifies zero variance, and the owner reviews net profit from home.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center max-w-3xl mx-auto px-4 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Start operating with total financial clarity today.
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Get Started Free &rarr;
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            Explore Pricing
          </button>
        </div>
      </section>
    </div>
  );
};
