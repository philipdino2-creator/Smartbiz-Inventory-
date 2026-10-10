import React, { useState } from 'react';
import { useRouter, Link } from '../../context/RouterContext';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Mail,
  ShieldCheck,
  Building,
  ArrowRight,
  Database,
  Lock,
  User,
  Users,
  Receipt,
  FileText,
  Calendar,
  AlertCircle,
  X,
  CreditCard,
} from 'lucide-react';
import { PLANS, formatPlanPrice, calculateAnnualSavingsNgn } from '../../config/plans';
import { PlanId, BillingInterval } from '../../types/subscription';

export const PricingPage: React.FC = () => {
  const { navigate } = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#4C0196] dark:text-purple-300 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Early Access Program · Plans Being Finalized</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Transparent, Sustainable Pricing for Nigerian Businesses
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Built for solo kiosks, growing retailers, and multi-staff academies. Start free and scale transparently as your transaction volume grows.
        </p>

        {/* Monthly / Annual Billing Switch */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingInterval === 'monthly'
                ? 'bg-[#4C0196] text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              billingInterval === 'annual'
                ? 'bg-[#4C0196] text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Save 2 Months
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. FREE PLAN */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Free
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Starter Kiosk
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₦0</span>
                  <span className="text-xs text-slate-500">/forever</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  100% free ongoing plan. No card required.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span><strong>1 Team User</strong> (Solo Operator)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>50 Sales</strong> / calendar month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>50 Expenses</strong> / calendar month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Up to <strong>30 Customers</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Up to <strong>25 Catalog Products</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Thermal Receipts (58mm / 80mm)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Customer Debt &amp; Credit Ledger</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Historical Data Preserved Forever</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[11px] text-slate-500 italic">
                Best for solo entrepreneurs, trade kiosks, and side hustles starting bookkeeping.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. STARTER PLAN */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#4C0196] p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#4C0196] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Most Popular
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4C0196] dark:text-purple-400">
                  Starter
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300">
                  Solo Pro
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {billingInterval === 'annual' ? '₦25,000' : '₦2,500'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {billingInterval === 'annual' ? '/year' : '/month'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {billingInterval === 'annual'
                    ? 'Billed annually upfront (₦2,083/mo equivalent · 2 months free)'
                    : 'Billed monthly · Cancel anytime'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span><strong>1 Team User</strong> (Solo Operator)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>500 Sales</strong> / calendar month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>500 Expenses</strong> / calendar month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Up to <strong>500 Customers</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Up to <strong>500 Catalog Products</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span><strong>Recurring Expenses</strong> &amp; Subscriptions</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Daily Cash Drawer Reconciliation</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>CSV Financial Reports Export</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[11px] text-slate-500 italic">
                Best for high-volume solo shopkeepers, repair centers, and service professionals.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-2.5 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Start with Starter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. BUSINESS PLAN */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Business
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Team Collaboration
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {billingInterval === 'annual' ? '₦50,000' : '₦5,000'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {billingInterval === 'annual' ? '/year' : '/month'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {billingInterval === 'annual'
                    ? 'Billed annually upfront (₦4,167/mo equivalent · 2 months free)'
                    : 'Billed monthly · Cancel anytime'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span><strong>Up to 5 Team Users</strong> (Owner, Mgr, Staff)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>5,000 Sales</strong> / month (Fair-use SME)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>5,000 Expenses</strong> / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>5,000 Customers &amp; Products</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Granular Role Permissions (RBAC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Cash Drawer Variance &amp; Audit Logs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>WhatsApp Debt Reminder Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Complete System Audit Trail</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[11px] text-slate-500 italic">
                Best for growing SMEs, ICT centres, supermarkets, and stores with cashiers and managers.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-2.5 bg-slate-900 hover:bg-black dark:bg-purple-900 dark:hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Start Business Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. BUSINESS PLUS (FUTURE PHASE) */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-6 flex flex-col justify-between opacity-85 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Business Plus
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Future Phase
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-400 dark:text-slate-500">
                    {billingInterval === 'annual' ? '₦100,000' : '₦10,000'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {billingInterval === 'annual' ? '/year' : '/month'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  Not available at launch · Roadmapped
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Up to <strong>25 Team Members</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Multi-Branch &amp; Franchise Consolidations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>50,000 Monthly Transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Custom ERP API &amp; Bank Webhooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Dedicated SLA &amp; On-Site Training</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-[11px] text-slate-400 italic">
                Planned for large vocational institutions and multi-branch retail operations.
              </p>
              <button
                disabled
                className="w-full py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <span>Coming Soon (Future Offering)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Feature Matrix Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Feature Comparison Grounded in Real Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Compare verified operational features across each BizFlow subscription tier.
          </p>
        </div>

        <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-4 px-6 font-bold text-slate-900 dark:text-white">Capability</th>
                <th className="py-4 px-4 font-bold text-slate-900 dark:text-white text-center">Free</th>
                <th className="py-4 px-4 font-bold text-[#4C0196] dark:text-purple-400 text-center">Starter</th>
                <th className="py-4 px-4 font-bold text-slate-900 dark:text-white text-center">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Authorized Team Members</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">1 (Solo)</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">1 (Solo)</td>
                <td className="py-3 px-4 text-center font-bold text-[#4C0196] dark:text-purple-400">Up to 5 Users</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Sales Records / Month</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">50</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">500</td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">5,000</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Operating Expenses / Month</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">50</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">500</td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">5,000</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Customer Records Limit</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">30</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">500</td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">5,000</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Products &amp; Services Catalog</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">25</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">500</td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">5,000</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">58mm &amp; 80mm Thermal Receipt Printing</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Customer Debt Tracking &amp; Part-Payments</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Recurring Expenses &amp; Scheduled Bills</td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Daily Cash Drawer Reconciliation &amp; Float</td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Multi-User Roles &amp; Granular Permissions (RBAC)</td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">WhatsApp Debt Reminders</td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-800 dark:text-slate-200">Security Audit Trail</td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Honest Transparency Notice: Payment Gateway Status */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#4C0196] text-white flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Payment Gateway Integration Status
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Automated card checkout via Nigerian payment gateways (Paystack and Flutterwave) is currently being finalized. During this early adoption phase, your account starts on the Free tier and you will never be charged without explicit confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Clarification & Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center">
          Pricing Clarifications &amp; Questions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] shrink-0" />
              <span>When will commercial checkout be live?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Plans are being finalized alongside server-side webhook integrations. We are testing with active businesses in Asaba and across Nigeria to ensure reliable reconciliation before activating direct billing.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] shrink-0" />
              <span>What happens if I reach my monthly limit?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              You will be notified that your plan limit has been reached. All existing sales, expenses, and invoices remain 100% accessible and readable. No records are ever deleted.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] shrink-0" />
              <span>Can I downgrade anytime?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes. Downgrading preserves all historical records, receipts, and customer balances in PostgreSQL. You will only be limited when attempting to create new entries beyond the lower tier.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#4C0196] shrink-0" />
              <span>How can I speak with support?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Contact our team at <span className="font-semibold text-slate-800 dark:text-slate-200">info@smartcoreict.online</span> or message us on WhatsApp at +234 8148483687.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Ready to streamline your business bookkeeping?
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <span>Sign In to Existing Workspace</span>
          </button>
        </div>
      </section>
    </div>
  );
};
