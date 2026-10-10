export type PlanId = 'free' | 'starter' | 'business' | 'business_plus';

export type BillingInterval = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'active'
  | 'pending_payment'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export interface PlanEntitlements {
  maxUsers: number;
  maxSalesPerMonth: number;
  maxExpensesPerMonth: number;
  maxCustomers: number;
  maxProducts: number;
  // Feature flags
  multiUserRbac: boolean;
  debtTracking: boolean;
  thermalReceipts: boolean;
  recurringExpenses: boolean;
  dailyReconciliation: boolean;
  auditTrail: boolean;
  dataExport: boolean;
  whatsappReminders: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPriceKobo: number; // Stored in kobo (integer)
  annualPriceKobo: number; // Stored in kobo (integer, equivalent to 10 months / 2 months free)
  monthlyPriceNgn: number;
  annualPriceNgn: number;
  entitlements: PlanEntitlements;
  isAvailable: boolean; // false for future tiers like business_plus
  isFuture?: boolean;
  highlight?: boolean;
  recommendedFor: string;
}

export interface BusinessSubscription {
  id: string;
  businessId: string;
  planId: PlanId;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider: 'none' | 'paystack' | 'flutterwave';
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsageMetrics {
  userCount: number;
  customerCount: number;
  productCount: number;
  monthlySalesCount: number;
  monthlyExpensesCount: number;
  billingCycleMonth: string; // YYYY-MM
}

export interface SubscriptionStatusResponse {
  subscription: BusinessSubscription;
  plan: PlanDefinition;
  usage: UsageMetrics;
  limits: {
    users: { current: number; max: number; isAtLimit: boolean };
    customers: { current: number; max: number; isAtLimit: boolean };
    products: { current: number; max: number; isAtLimit: boolean };
    monthlySales: { current: number; max: number; isAtLimit: boolean };
    monthlyExpenses: { current: number; max: number; isAtLimit: boolean };
  };
}

export type LimitType = 'users' | 'customers' | 'products' | 'monthlySales' | 'monthlyExpenses';
