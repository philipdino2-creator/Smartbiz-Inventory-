import React from 'react';
import { Link, useRouter } from '../../context/RouterContext';
import { ProductPreviewMockup } from './ProductPreviewMockup';
import {
  TrendingUp,
  Receipt,
  Users,
  Printer,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  DollarSign,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  Database,
  Lock,
  MessageCircle,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-12 lg:pt-16 overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-purple-200/40 via-purple-100/20 to-transparent dark:from-purple-950/30 dark:via-purple-900/10 dark:to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 text-[#4C0196] dark:text-purple-300 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#4C0196] dark:text-purple-400" />
            <span>Designed for Small Businesses, Retailers &amp; Training Academies</span>
          </div>

          {/* Main Headline & Supporting Copy */}
          <div className="max-w-4xl mx-auto space-y-5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Run Your Business.{' '}
              <span className="text-[#4C0196] dark:text-purple-400 block sm:inline">
                Understand Your Numbers.
              </span>{' '}
              Grow With Confidence.
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Manage sales, track expenses, monitor business performance and keep your records organised — all from one simple workspace.
            </p>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#4C0196] hover:bg-[#3b0075] text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4C0196]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/features')}
              className="w-full sm:w-auto px-7 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <span>Explore Features</span>
            </button>
          </div>

          {/* Quick Value Metrics */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Instant Workspace Setup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>PostgreSQL Reliability</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Thermal POS Ready (58/80mm)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No Credit Card Required</span>
            </div>
          </div>

          {/* Product Preview Mockup Component */}
          <div className="pt-6 sm:pt-10 max-w-5xl mx-auto">
            <ProductPreviewMockup />
          </div>
        </div>
      </section>

      {/* 2. CORE BENEFITS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4C0196] dark:text-purple-400">
            Practical Business Value
          </h2>
          <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Stop Guessing. Know Exactly How Your Business Performs.
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Replace scattered paper receipts, lost WhatsApp records, and spreadsheet errors with an organized, central bookkeeping system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Benefit 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Keep Sales Records Organised
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Record walk-in transactions, course registrations, and product sales in seconds. Every entry captures customer info, payment method, and line-item details.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Track Real Operating Expenses
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Log daily operational overheads including fuel, generator maintenance, utilities, salaries, and inventory restocking so cash doesn't disappear without a paper trail.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Understand True Net Profit
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Calculate accurate gross margins and net profitability. Crucially, BizFlow ensures unpaid customer balances are never counted as revenue until verified.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Manage Debts &amp; Customer Balances
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Never lose track of installments or partial payments. See exactly who owes what, view repayment histories, and dispatch one-click WhatsApp balance notifications.
            </p>
          </div>

          {/* Benefit 5 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Issue Professional Receipts
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Print clean 58mm and 80mm thermal receipts directly to standard counter printers. Receipts include your logo, bank account numbers, and unique invoice codes.
            </p>
          </div>

          {/* Benefit 6 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Audit Logs &amp; Team Permissions
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Empower cashiers and branch managers with designated roles. Owner protections prevent unauthorized changes, while full audit logs record every sale and adjustment.
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURE HIGHLIGHTS */}
      <section className="bg-slate-50 dark:bg-slate-950/50 py-16 sm:py-24 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#4C0196] dark:text-purple-400">
                Full Operational Suite
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Built Around Everyday Business Realities
              </p>
            </div>

            <Link
              to="/features"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4C0196] dark:text-purple-300 hover:underline"
            >
              <span>Explore All 8 Feature Pillars</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Method Sales</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Accept Bank Transfer, Cash, POS Cards, or OPay with precise tracking per payment channel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Cash Drawer</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Reconcile physical counter drawer floats against recorded cash inflow to identify shortages before shift close.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp Reminders</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Auto-generate friendly or formal debt reminders complete with bank transfer instructions in one click.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monotonic Invoicing</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Strict sequential numbering (#101, #102...) prevents duplicate receipts or unrecorded transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS 3-STEP JOURNEY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4C0196] dark:text-purple-400">
            Simple 3-Step Setup
          </h2>
          <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            From Sign-Up to First Recorded Sale in 3 Minutes
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            No complex accounting degrees required. BizFlow is designed for instant onboarding and clean daily workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 relative">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 flex items-center justify-center font-extrabold text-base">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Your Account</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Register as the Business Owner with your email and name. You gain complete administrative authority and owner-protected controls.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 relative">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 flex items-center justify-center font-extrabold text-base">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Your Workspace</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter your business name, logo, currency (default ₦), and bank details for thermal receipts. Your isolated tenant database is instantly ready.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 relative">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 flex items-center justify-center font-extrabold text-base">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Record &amp; Track Daily</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Start entering sales and expenses. Issue instant thermal receipts, reconcile daily cash drawers, and review accurate net profits.
            </p>
          </div>
        </div>

        <div className="text-center pt-8">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4C0196] dark:text-purple-300 hover:underline"
          >
            <span>Read Complete Onboarding &amp; Daily Walkthrough</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 5. PRICING TEASER SECTION */}
      <section className="bg-gradient-to-br from-purple-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 py-16 sm:py-20 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-[#4C0196] dark:text-purple-300 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Early Access Phase</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transparent Pricing Designed for Growing Businesses
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Our priority is product adoption, reliable bookkeeping, and practical value. Subscription plans are currently being finalized. Get started today to secure early access for your business.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/pricing"
              className="px-6 py-3 bg-[#4C0196] hover:bg-[#3b0075] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              View Pricing Details &rarr;
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 border border-purple-200 dark:border-purple-800 text-[#4C0196] dark:text-purple-300 text-xs font-bold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
            >
              Create Business Account
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ TEASER */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4C0196] dark:text-purple-400">
            Got Questions?
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] dark:text-purple-400 shrink-0" />
              <span>What is BizFlow?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
              BizFlow is a business management and operational bookkeeping application built for retail shops, training centres, computer academies, and service businesses to manage sales, expenses, customer debts, and cash flow.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] dark:text-purple-400 shrink-0" />
              <span>Can I access BizFlow on a mobile phone?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
              Yes. BizFlow features a mobile-first responsive layout with bottom tab navigation, quick sales capture, and mobile receipt printing right from smartphone browsers.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4C0196] dark:text-purple-400 shrink-0" />
              <span>How does BizFlow protect business information?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
              BizFlow enforces strict multi-tenant isolation in Cloud SQL PostgreSQL, password hashing with bcrypt, session tokens with 256-bit entropy, and role-based permissions preventing unauthorized data access.
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/faq"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4C0196] dark:text-purple-300 hover:underline"
          >
            <span>Read All Questions &amp; Answers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 7. FINAL CONVERSION BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#4C0196] text-white p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Subtle circle accents */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#7B001C]/30 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Take Control of Your Business Records.
            </h2>
            <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
              Bring your essential business numbers together and make more informed decisions.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-7 py-3 bg-white text-[#4C0196] text-xs font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-md cursor-pointer"
            >
              Get Started with BizFlow
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-7 py-3 bg-[#3b0075] text-white text-xs font-bold rounded-xl hover:bg-[#310061] transition-colors border border-purple-400/40 cursor-pointer"
            >
              Sign In
            </button>
          </div>

          <div className="relative z-10 pt-4 text-[11px] text-purple-200">
            No long-term commitments &bull; Complete control over your business data
          </div>
        </div>
      </section>
    </div>
  );
};
