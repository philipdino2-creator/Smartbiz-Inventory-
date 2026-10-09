import React from 'react';
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
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#4C0196] dark:text-purple-300 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Product Access &amp; Availability</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Transparent Pricing for Growing Businesses
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Our immediate focus is product adoption, reliable bookkeeping, and practical value for small businesses and training centres.
        </p>
      </section>

      {/* Main Transparent Pricing Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8 relative overflow-hidden">
          {/* Subtle accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4C0196]" />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#4C0196] dark:text-purple-400">
                  Current Status
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Early Access Program
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-[#4C0196] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Plans Being Finalized
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Commercial subscription packages and tier options are currently being finalized. During this phase, early businesses can create an account and access all core management features immediately.
            </p>
          </div>

          {/* Included Features List */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Complete Feature Value Included In Your Workspace:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Unlimited Sales &amp; Transaction Recording</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Operating Expense Logging &amp; Categorization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Real-Time Gross &amp; Net Profit Ledgers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Customer Debt Tracking &amp; Repayment History</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>58mm &amp; 80mm Thermal Receipt Printing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>WhatsApp Customer Debt Reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Daily Cash Drawer Reconciliation Auditing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Multi-User Roles (Owner, Manager, Staff)</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Get started today
              </span>
              <span className="text-[11px] text-slate-500">
                Set up your business workspace and start recording in minutes.
              </span>
            </div>

            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Create Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Clarification & Transparency Q&A */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center">
          Pricing Clarifications &amp; Questions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] shrink-0" />
              <span>When will subscription pricing be announced?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We are working closely with active businesses to ensure pricing matches real operational value. All existing workspace users will receive advance notification before any commercial plans are published.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] shrink-0" />
              <span>Will my business data be preserved?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes. All business records, sales history, customer ledgers, and settings are securely stored in persistent PostgreSQL and will remain intact across future plan updates.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] shrink-0" />
              <span>Can I add multiple staff cashiers?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes. You can add team members with designated staff or manager roles to record counter sales without granting access to sensitive company settings.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#4C0196] shrink-0" />
              <span>How can I speak with the team?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              You can contact our support team at <span className="font-semibold text-slate-800 dark:text-slate-200">info@smartcoreict.online</span> or reach out via WhatsApp at +234 8148483687.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
