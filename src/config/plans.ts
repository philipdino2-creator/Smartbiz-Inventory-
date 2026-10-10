import { PlanId, PlanDefinition, BillingInterval } from '../types/subscription';

/**
 * 1 NGN = 100 KOBO.
 * All monetary amounts for billing arithmetic MUST be calculated in integer kobo
 * to prevent floating-point rounding inaccuracies.
 */
export const KOBO_PER_NAIRA = 100;

export const nairaToKobo = (naira: number): number => {
  return Math.round(naira * KOBO_PER_NAIRA);
};

export const koboToNaira = (kobo: number): number => {
  return Math.floor(kobo / KOBO_PER_NAIRA);
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Essential bookkeeping for single-operator kiosks and startups',
    monthlyPriceKobo: 0,
    annualPriceKobo: 0,
    monthlyPriceNgn: 0,
    annualPriceNgn: 0,
    entitlements: {
      maxUsers: 1,
      maxSalesPerMonth: 50,
      maxExpensesPerMonth: 50,
      maxCustomers: 30,
      maxProducts: 25,
      multiUserRbac: false,
      debtTracking: true,
      thermalReceipts: true,
      recurringExpenses: false,
      dailyReconciliation: false,
      auditTrail: false,
      dataExport: false,
      whatsappReminders: false,
    },
    isAvailable: true,
    isFuture: false,
    highlight: false,
    recommendedFor: 'Solo entrepreneurs, micro-retailers, and new trade kiosks starting their digital records.',
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Empowering busy solo shops with higher limits and recurring bills',
    monthlyPriceKobo: 2500 * KOBO_PER_NAIRA, // 250,000 kobo (₦2,500)
    annualPriceKobo: 25000 * KOBO_PER_NAIRA, // 2,500,000 kobo (₦25,000 - equivalent to 10 months / 2 months free)
    monthlyPriceNgn: 2500,
    annualPriceNgn: 25000,
    entitlements: {
      maxUsers: 1,
      maxSalesPerMonth: 500,
      maxExpensesPerMonth: 500,
      maxCustomers: 500,
      maxProducts: 500,
      multiUserRbac: false,
      debtTracking: true,
      thermalReceipts: true,
      recurringExpenses: true,
      dailyReconciliation: true,
      auditTrail: false,
      dataExport: true,
      whatsappReminders: false,
    },
    isAvailable: true,
    isFuture: false,
    highlight: true,
    recommendedFor: 'Active solo operators needing higher volume, scheduled subscriptions, and CSV exports.',
  },

  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Full multi-user team collaboration, cash drawer auditing & WhatsApp reminders',
    monthlyPriceKobo: 5000 * KOBO_PER_NAIRA, // 500,000 kobo (₦5,000)
    annualPriceKobo: 50000 * KOBO_PER_NAIRA, // 5,000,000 kobo (₦50,000 - equivalent to 10 months / 2 months free)
    monthlyPriceNgn: 5000,
    annualPriceNgn: 50000,
    entitlements: {
      maxUsers: 5,
      maxSalesPerMonth: 5000, // Fair-use volume for growing SMEs
      maxExpensesPerMonth: 5000,
      maxCustomers: 5000,
      maxProducts: 5000,
      multiUserRbac: true,
      debtTracking: true,
      thermalReceipts: true,
      recurringExpenses: true,
      dailyReconciliation: true,
      auditTrail: true,
      dataExport: true,
      whatsappReminders: true,
    },
    isAvailable: true,
    isFuture: false,
    highlight: false,
    recommendedFor: 'Growing SMEs, ICT centres, supermarkets, and stores with cashiers and managers.',
  },

  business_plus: {
    id: 'business_plus',
    name: 'Business Plus',
    tagline: 'Multi-branch operations, automated integrations, and priority SLA',
    monthlyPriceKobo: 10000 * KOBO_PER_NAIRA, // 1,000,000 kobo (₦10,000)
    annualPriceKobo: 100000 * KOBO_PER_NAIRA, // 10,000,000 kobo (₦100,000)
    monthlyPriceNgn: 10000,
    annualPriceNgn: 100000,
    entitlements: {
      maxUsers: 25,
      maxSalesPerMonth: 50000,
      maxExpensesPerMonth: 50000,
      maxCustomers: 50000,
      maxProducts: 50000,
      multiUserRbac: true,
      debtTracking: true,
      thermalReceipts: true,
      recurringExpenses: true,
      dailyReconciliation: true,
      auditTrail: true,
      dataExport: true,
      whatsappReminders: true,
    },
    isAvailable: false, // NOT available for purchase at launch
    isFuture: true,
    highlight: false,
    recommendedFor: 'Multi-location businesses and large vocational academies (Future Offering).',
  },
};

/**
 * Calculates effective annual savings in NGN for a given plan.
 * Returns 0 for Free plans or undefined plans.
 */
export const calculateAnnualSavingsNgn = (planId: PlanId): number => {
  const plan = PLANS[planId];
  if (!plan || plan.monthlyPriceNgn === 0) return 0;
  const twelveMonthsMonthly = plan.monthlyPriceNgn * 12;
  return twelveMonthsMonthly - plan.annualPriceNgn;
};

/**
 * Returns human-readable pricing string for a plan given interval.
 */
export const formatPlanPrice = (planId: PlanId, interval: BillingInterval): {
  amountFormatted: string;
  periodLabel: string;
  billingDetail: string;
} => {
  const plan = PLANS[planId];
  if (!plan) {
    return { amountFormatted: '₦0', periodLabel: '/mo', billingDetail: 'Free ongoing plan' };
  }

  if (plan.monthlyPriceNgn === 0) {
    return { amountFormatted: '₦0', periodLabel: 'forever', billingDetail: 'Free ongoing access' };
  }

  if (interval === 'annual') {
    const monthlyEquivalent = Math.round(plan.annualPriceNgn / 12);
    return {
      amountFormatted: `₦${monthlyEquivalent.toLocaleString()}`,
      periodLabel: '/month',
      billingDetail: `Billed annually at ₦${plan.annualPriceNgn.toLocaleString()}/year (2 months free)`,
    };
  }

  return {
    amountFormatted: `₦${plan.monthlyPriceNgn.toLocaleString()}`,
    periodLabel: '/month',
    billingDetail: 'Billed monthly, cancel anytime',
  };
};

/**
 * Resolves a plan by identifier safely, defaulting to 'free'.
 */
export const resolvePlan = (planId?: string | null): PlanDefinition => {
  if (planId && planId in PLANS) {
    return PLANS[planId as PlanId];
  }
  return PLANS.free;
};
