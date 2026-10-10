import React, { useEffect, useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { useRouter } from '../../context/RouterContext';
import {
  Sparkles,
  TrendingUp,
  CreditCard,
  Users,
  Package,
  Receipt,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  ExternalLink,
  Zap,
  Info,
} from 'lucide-react';
import { formatDate } from '../../utils/calculations';
import { PLANS } from '../../config/plans';

interface QuotaCardProps {
  title: string;
  current: number;
  max: number;
  icon: React.ElementType;
  isMonthly: boolean;
  unit: string;
  nextResetDate?: string;
  planName: string;
  onUpgradeClick: () => void;
}

const QuotaCard: React.FC<QuotaCardProps> = ({
  title,
  current,
  max,
  icon: Icon,
  isMonthly,
  unit,
  nextResetDate,
  planName,
  onUpgradeClick,
}) => {
  const percentage = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const remaining = Math.max(0, max - current);
  const isAtLimit = current >= max;
  const isNearLimit = !isAtLimit && percentage >= 80;

  // Determine indicator coloring based on quota health
  let statusBadge = (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
      <span>Normal</span>
    </span>
  );
  let progressColor = 'bg-[#4C0196] dark:bg-purple-500';

  if (isAtLimit) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
        <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        <span>Limit Reached</span>
      </span>
    );
    progressColor = 'bg-rose-600 dark:bg-rose-500';
  } else if (isNearLimit) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>{percentage}% Used</span>
      </span>
    );
    progressColor = 'bg-amber-500 dark:bg-amber-400';
  }

  return (
    <div
      className={`rounded-2xl border p-5 transition-all shadow-2xs flex flex-col justify-between ${
        isAtLimit
          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-200 dark:ring-rose-900/40'
          : isNearLimit
          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div>
        {/* Top Header of Quota Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isAtLimit
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                  : isNearLimit
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  : 'bg-purple-50 text-[#4C0196] dark:bg-purple-950/60 dark:text-purple-300'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isMonthly ? 'Monthly billing cycle quota' : 'Total workspace resource limit'}
              </p>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Big Numbers */}
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {current.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold ml-1">
              / {max.toLocaleString()} {unit}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Remaining info and reset date */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Remaining: <strong className="font-semibold text-slate-700 dark:text-slate-200">{remaining.toLocaleString()}</strong> {unit}
          </span>
          {isMonthly && nextResetDate ? (
            <span className="flex items-center gap-1 text-[10.5px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Resets {formatDate(nextResetDate)}</span>
            </span>
          ) : (
            <span className="text-[10.5px] text-slate-400 dark:text-slate-500">
              Permanent limit
            </span>
          )}
        </div>
      </div>

      {/* Warning Callouts if limit reached or approaching */}
      {isAtLimit && (
        <div className="mt-4 pt-3 border-t border-rose-200 dark:border-rose-900/60">
          <div className="flex items-start gap-2 text-[11px] text-rose-800 dark:text-rose-200 leading-snug">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {title} limit reached for your {planName} plan.
              </p>
              <p className="text-[10.5px] text-rose-700 dark:text-rose-300 mt-0.5">
                New records will be blocked until the monthly reset or plan upgrade. Existing records remain 100% accessible.
              </p>
              <button
                type="button"
                onClick={onUpgradeClick}
                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                <span>Upgrade to Increase Limit</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60">
          <div className="flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-200 leading-snug">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Approaching plan quota ({remaining} {unit} left).
              </p>
              <button
                type="button"
                onClick={onUpgradeClick}
                className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-900 dark:text-amber-300 hover:underline cursor-pointer"
              >
                <span>Explore higher tiers</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const UsagePlanView: React.FC = () => {
  const { business, subscriptionStatus, refreshSubscription } = useBusiness();
  const { navigate } = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubscription();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpgradeClick = () => {
    navigate('/pricing');
  };

  // Safe fallback to Free plan if subscription status is loading or unconfigured
  const plan = subscriptionStatus?.plan || PLANS.free;
  const subscription = subscriptionStatus?.subscription;
  const usage = subscriptionStatus?.usage;
  const limits = subscriptionStatus?.limits;

  // Derive usage numbers with defensive fallbacks to 0
  const salesUsed = limits?.monthlySales?.current ?? usage?.monthlySalesCount ?? 0;
  const salesMax = limits?.monthlySales?.max ?? plan.entitlements.maxSalesPerMonth;

  const expensesUsed = limits?.monthlyExpenses?.current ?? usage?.monthlyExpensesCount ?? 0;
  const expensesMax = limits?.monthlyExpenses?.max ?? plan.entitlements.maxExpensesPerMonth;

  const customersUsed = limits?.customers?.current ?? usage?.customerCount ?? 0;
  const customersMax = limits?.customers?.max ?? plan.entitlements.maxCustomers;

  const productsUsed = limits?.products?.current ?? usage?.productCount ?? 0;
  const productsMax = limits?.products?.max ?? plan.entitlements.maxProducts;

  const usersUsed = limits?.users?.current ?? usage?.userCount ?? 1;
  const usersMax = limits?.users?.max ?? plan.entitlements.maxUsers;

  // Monthly billing cycle period and next reset date
  const periodStart = subscription?.currentPeriodStart;
  const periodEnd = subscription?.currentPeriodEnd;

  // Calculate next reset date (first day of following calendar month)
  const calculateNextResetDate = (endDateStr?: string): string => {
    if (!endDateStr) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth.toISOString().slice(0, 10);
    }
    try {
      const [year, month, day] = endDateStr.split('-').map(Number);
      const nextDate = new Date(year, month - 1, day);
      nextDate.setDate(nextDate.getDate() + 1);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const d = String(nextDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  };

  const nextResetDate = calculateNextResetDate(periodEnd);

  // Check if any limits are breached
  const anyLimitReached =
    salesUsed >= salesMax ||
    expensesUsed >= expensesMax ||
    customersUsed >= customersMax ||
    productsUsed >= productsMax ||
    usersUsed >= usersMax;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[#4C0196] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Subscription &amp; Entitlements
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {business.name || 'Workspace'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Usage &amp; Plan Quotas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time server-enforced quotas and monthly volume tracking for your workspace
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs disabled:opacity-50"
            title="Refresh current usage from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Quotas'}</span>
          </button>
          <button
            type="button"
            onClick={handleUpgradeClick}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#4C0196] hover:bg-[#3b0075] rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
            title="View BizFlow plans and pricing"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* Global Limit Warning Banner (if any quota is reached) */}
      {anyLimitReached && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold">
                One or more workspace quotas have been reached
              </h2>
              <p className="text-xs text-rose-800 dark:text-rose-200 mt-0.5">
                Creation of new records for exhausted quotas is currently locked. All past transactions, historical customer records, and reports remain 100% accessible.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUpgradeClick}
            className="self-start sm:self-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            Upgrade Plan Now
          </button>
        </div>
      )}

      {/* Current Subscription Status Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-[#4C0196] dark:text-purple-300 flex items-center justify-center font-black text-lg">
              {plan.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {plan.name} Plan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {subscription?.status || 'active'}
                </span>
                {subscription?.billingInterval && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {subscription.billingInterval} billing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {plan.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpgradeClick}
              className="text-xs font-bold text-[#4C0196] dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Compare all tiers on Pricing Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Plan metadata strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Current Billing Period</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {periodStart && periodEnd
                ? `${formatDate(periodStart)} – ${formatDate(periodEnd)}`
                : 'Current Calendar Month'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Next Monthly Quota Reset</span>
            <span className="font-semibold text-purple-700 dark:text-purple-300 mt-0.5 block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{nextResetDate ? formatDate(nextResetDate) : '1st of next month'}</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Plan Cost</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
              {plan.monthlyPriceNgn === 0
                ? '₦0 / Free ongoing'
                : `₦${plan.monthlyPriceNgn.toLocaleString()} / month`}
            </span>
          </div>
        </div>
      </div>

      {/* Quota Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Usage &amp; Quota Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authoritatively calculated directly from your PostgreSQL tenant records
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Monthly Sales Quota */}
          <QuotaCard
            title="Monthly Sales Volume"
            current={salesUsed}
            max={salesMax}
            icon={Receipt}
            isMonthly={true}
            unit="sales"
            nextResetDate={nextResetDate}
            planName={plan.name}
            onUpgradeClick={handleUpgradeClick}
          />

          {/* 2. Monthly Expenses Quota */}
          <QuotaCard
            title="Monthly Expenses Volume"
            current={expensesUsed}
            max={expensesMax}
            icon={ArrowDownCircle}
            isMonthly={true}
            unit="expenses"
            nextResetDate={nextResetDate}
            planName={plan.name}
            onUpgradeClick={handleUpgradeClick}
          />

          {/* 3. Customer Directory Limit */}
          <QuotaCard
            title="Customer & Student Records"
            current={customersUsed}
            max={customersMax}
            icon={CreditCard}
            isMonthly={false}
            unit="customers"
            planName={plan.name}
            onUpgradeClick={handleUpgradeClick}
          />

          {/* 4. Product Catalog Limit */}
          <QuotaCard
            title="Products & Courses Catalog"
            current={productsUsed}
            max={productsMax}
            icon={Package}
            isMonthly={false}
            unit="items"
            planName={plan.name}
            onUpgradeClick={handleUpgradeClick}
          />

          {/* 5. Team Users Limit */}
          <QuotaCard
            title="Active Team Members"
            current={usersUsed}
            max={usersMax}
            icon={Users}
            isMonthly={false}
            unit="members"
            planName={plan.name}
            onUpgradeClick={handleUpgradeClick}
          />

          {/* 6. Feature Entitlements Snapshot Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-purple-50 text-[#4C0196] dark:bg-purple-950/60 dark:text-purple-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    Included Operational Features
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Unlocked for {plan.name} plan
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Multi-User &amp; RBAC:</span>
                  <span className={`font-semibold text-[11px] ${plan.entitlements.multiUserRbac ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {plan.entitlements.multiUserRbac ? 'Enabled' : 'Business Tier Only'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Daily Till Balancing:</span>
                  <span className={`font-semibold text-[11px] ${plan.entitlements.dailyReconciliation ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {plan.entitlements.dailyReconciliation ? 'Enabled' : 'Starter & Above'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Recurring Commitments:</span>
                  <span className={`font-semibold text-[11px] ${plan.entitlements.recurringExpenses ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {plan.entitlements.recurringExpenses ? 'Enabled' : 'Starter & Above'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">WhatsApp Debt Reminders:</span>
                  <span className={`font-semibold text-[11px] ${plan.entitlements.whatsappReminders ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {plan.entitlements.whatsappReminders ? 'Enabled' : 'Business Tier Only'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleUpgradeClick}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-[#4C0196] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Compare All Plan Features</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Isolation Notice */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-[#4C0196] dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Tenant Data Protection Guarantee
          </p>
          <p className="text-[11px]">
            Quotas and limits apply exclusively to creating new records. Reaching a quota or downgrading a plan will <strong>never delete or hide</strong> existing sales, expenses, invoices, customers, or financial audit records.
          </p>
        </div>
      </div>
    </div>
  );
};
