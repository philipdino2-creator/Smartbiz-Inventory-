import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import {
  PlanId,
  BillingInterval,
  SubscriptionStatus,
  BusinessSubscription,
  UsageMetrics,
  SubscriptionStatusResponse,
  LimitType,
  PlanEntitlements,
} from '../types/subscription.ts';
import { PLANS, resolvePlan } from '../config/plans.ts';

/**
 * Returns the current calendar month range in YYYY-MM-DD format strictly adhering to Africa/Lagos timezone.
 */
export const getCurrentMonthDateRange = (): {
  firstDay: string;
  lastDay: string;
  cycleKey: string;
} => {
  const lagosFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = lagosFormatter.formatToParts(new Date());
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2026', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '10', 10);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const lastDate = new Date(year, month, 0); // last calendar day of this month

  const firstDay = `${year}-${pad(month)}-01`;
  const lastDay = `${year}-${pad(month)}-${pad(lastDate.getDate())}`;
  const cycleKey = `${year}-${pad(month)}`;

  return { firstDay, lastDay, cycleKey };
};

/**
 * Authoritatively retrieves or safely defaults the subscription for a business.
 * If no subscription row exists in PostgreSQL, safely resolves to the default Free plan
 * without throwing or modifying records.
 */
export const getBusinessSubscription = async (
  businessId: string,
  executor: any = db
): Promise<BusinessSubscription> => {
  const rows = await executor
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.businessId, businessId))
    .limit(1);

  if (rows.length > 0) {
    const row = rows[0];
    return {
      id: row.id,
      businessId: row.businessId,
      planId: (row.planId in PLANS ? row.planId : 'free') as PlanId,
      billingInterval: (row.billingInterval === 'annual' ? 'annual' : 'monthly') as BillingInterval,
      status: row.status as SubscriptionStatus,
      startDate: row.startDate,
      currentPeriodStart: row.currentPeriodStart,
      currentPeriodEnd: row.currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
      paymentProvider: (row.paymentProvider as any) || 'none',
      providerSubscriptionId: row.providerSubscriptionId,
      providerCustomerId: row.providerCustomerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // Authoritative default: all unconfigured workspaces without a verified subscription record
  // strictly resolve to the Free tier. Paid entitlements require an explicit, verified database record.
  const defaultPlan: PlanId = 'free';
  const now = new Date().toISOString();
  const { firstDay, lastDay } = getCurrentMonthDateRange();
  return {
    id: `sub_default_${businessId}`,
    businessId,
    planId: defaultPlan,
    billingInterval: 'monthly',
    status: 'active',
    startDate: now,
    currentPeriodStart: firstDay,
    currentPeriodEnd: lastDay,
    cancelAtPeriodEnd: false,
    paymentProvider: 'none',
    providerSubscriptionId: null,
    providerCustomerId: null,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Calculates current real-time usage metrics directly from PostgreSQL.
 * Supports passing an optional transaction executor (`executor`) for concurrency-safe transactional queries.
 */
export const getBusinessUsage = async (
  businessId: string,
  executor: any = db
): Promise<UsageMetrics> => {
  const { firstDay, lastDay, cycleKey } = getCurrentMonthDateRange();

  // 1. User count (active team members)
  const usersResult = await executor
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.users)
    .where(and(eq(schema.users.businessId, businessId), eq(schema.users.active, true)));
  const userCount = usersResult[0]?.count || 0;

  // 2. Customer count
  const customersResult = await executor
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.customers)
    .where(eq(schema.customers.businessId, businessId));
  const customerCount = customersResult[0]?.count || 0;

  // 3. Product count
  const productsResult = await executor
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.products)
    .where(and(eq(schema.products.businessId, businessId), eq(schema.products.active, true)));
  const productCount = productsResult[0]?.count || 0;

  // 4. Monthly sales count (calendar month)
  const salesResult = await executor
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.sales)
    .where(
      and(
        eq(schema.sales.businessId, businessId),
        gte(schema.sales.date, firstDay),
        lte(schema.sales.date, lastDay)
      )
    );
  const monthlySalesCount = salesResult[0]?.count || 0;

  // 5. Monthly expenses count (calendar month)
  const expensesResult = await executor
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.expenses)
    .where(
      and(
        eq(schema.expenses.businessId, businessId),
        gte(schema.expenses.date, firstDay),
        lte(schema.expenses.date, lastDay)
      )
    );
  const monthlyExpensesCount = expensesResult[0]?.count || 0;

  return {
    userCount,
    customerCount,
    productCount,
    monthlySalesCount,
    monthlyExpensesCount,
    billingCycleMonth: cycleKey,
  };
};

export interface PlanLimitCheckResult {
  allowed: boolean;
  limitType: LimitType;
  currentUsage: number;
  maxAllowed: number;
  planId: PlanId;
  planName: string;
  upgradeMessage?: string;
}

/**
 * Checks if creating a new entity of type `limitType` is permitted under the business's plan.
 * Accepts an optional transaction executor (`executor`) to evaluate limits within an active PostgreSQL transaction.
 */
export const checkPlanLimit = async (
  businessId: string,
  limitType: LimitType,
  executor: any = db
): Promise<PlanLimitCheckResult> => {
  const subscription = await getBusinessSubscription(businessId, executor);
  const plan = resolvePlan(subscription.planId);
  const usage = await getBusinessUsage(businessId, executor);

  let currentUsage = 0;
  let maxAllowed = 0;
  let limitLabel = '';

  switch (limitType) {
    case 'users':
      currentUsage = usage.userCount;
      maxAllowed = plan.entitlements.maxUsers;
      limitLabel = 'team members';
      break;
    case 'customers':
      currentUsage = usage.customerCount;
      maxAllowed = plan.entitlements.maxCustomers;
      limitLabel = 'customer records';
      break;
    case 'products':
      currentUsage = usage.productCount;
      maxAllowed = plan.entitlements.maxProducts;
      limitLabel = 'products/services in catalog';
      break;
    case 'monthlySales':
      currentUsage = usage.monthlySalesCount;
      maxAllowed = plan.entitlements.maxSalesPerMonth;
      limitLabel = 'sales records this calendar month';
      break;
    case 'monthlyExpenses':
      currentUsage = usage.monthlyExpensesCount;
      maxAllowed = plan.entitlements.maxExpensesPerMonth;
      limitLabel = 'expense records this calendar month';
      break;
  }

  // If current usage meets or exceeds the plan limit, deny mutation
  if (currentUsage >= maxAllowed) {
    return {
      allowed: false,
      limitType,
      currentUsage,
      maxAllowed,
      planId: plan.id,
      planName: plan.name,
      upgradeMessage: `Plan Limit Reached: Your ${plan.name} plan includes up to ${maxAllowed} ${limitLabel} (current: ${currentUsage}). Please upgrade your plan in BizFlow settings to continue recording new entries. Existing records remain fully accessible.`,
    };
  }

  return {
    allowed: true,
    limitType,
    currentUsage,
    maxAllowed,
    planId: plan.id,
    planName: plan.name,
  };
};

/**
 * Checks a specific feature entitlement (e.g. multiUserRbac, dailyReconciliation).
 */
export const checkFeatureEntitlement = async (
  businessId: string,
  feature: keyof PlanEntitlements
): Promise<{ allowed: boolean; planName: string; feature: string }> => {
  const subscription = await getBusinessSubscription(businessId);
  const plan = resolvePlan(subscription.planId);
  const allowed = Boolean(plan.entitlements[feature]);

  return {
    allowed,
    planName: plan.name,
    feature: String(feature),
  };
};

/**
 * Returns comprehensive subscription status, active plan, and live usage metrics.
 */
export const getFullSubscriptionStatus = async (
  businessId: string
): Promise<SubscriptionStatusResponse> => {
  const subscription = await getBusinessSubscription(businessId);
  const plan = resolvePlan(subscription.planId);
  const usage = await getBusinessUsage(businessId);

  return {
    subscription,
    plan,
    usage,
    limits: {
      users: {
        current: usage.userCount,
        max: plan.entitlements.maxUsers,
        isAtLimit: usage.userCount >= plan.entitlements.maxUsers,
      },
      customers: {
        current: usage.customerCount,
        max: plan.entitlements.maxCustomers,
        isAtLimit: usage.customerCount >= plan.entitlements.maxCustomers,
      },
      products: {
        current: usage.productCount,
        max: plan.entitlements.maxProducts,
        isAtLimit: usage.productCount >= plan.entitlements.maxProducts,
      },
      monthlySales: {
        current: usage.monthlySalesCount,
        max: plan.entitlements.maxSalesPerMonth,
        isAtLimit: usage.monthlySalesCount >= plan.entitlements.maxSalesPerMonth,
      },
      monthlyExpenses: {
        current: usage.monthlyExpensesCount,
        max: plan.entitlements.maxExpensesPerMonth,
        isAtLimit: usage.monthlyExpensesCount >= plan.entitlements.maxExpensesPerMonth,
      },
    },
  };
};

/**
 * Concurrency-hardened plan limit assertion executed inside a PostgreSQL transaction.
 * Acquires a row-level lock on the business row, recalculates authoritative usage,
 * and throws a typed PLAN_LIMIT_REACHED error if limits are reached.
 */
export const assertPlanLimitInTransaction = async (
  tx: any,
  businessId: string,
  limitType: LimitType
): Promise<void> => {
  // Lock the business row to serialize concurrent create operations for this tenant
  await tx.select().from(schema.businesses).where(eq(schema.businesses.id, businessId)).for('update');

  const subscription = await getBusinessSubscription(businessId);
  const plan = resolvePlan(subscription.planId);
  const { firstDay, lastDay } = getCurrentMonthDateRange();

  let count = 0;
  let maxAllowed = 0;
  let limitLabel = '';

  switch (limitType) {
    case 'users': {
      const res = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.users)
        .where(and(eq(schema.users.businessId, businessId), eq(schema.users.active, true)));
      count = res[0]?.count || 0;
      maxAllowed = plan.entitlements.maxUsers;
      limitLabel = 'team members';
      break;
    }
    case 'customers': {
      const res = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.customers)
        .where(eq(schema.customers.businessId, businessId));
      count = res[0]?.count || 0;
      maxAllowed = plan.entitlements.maxCustomers;
      limitLabel = 'customer records';
      break;
    }
    case 'products': {
      const res = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.products)
        .where(and(eq(schema.products.businessId, businessId), eq(schema.products.active, true)));
      count = res[0]?.count || 0;
      maxAllowed = plan.entitlements.maxProducts;
      limitLabel = 'catalog items';
      break;
    }
    case 'monthlySales': {
      const res = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.sales)
        .where(and(eq(schema.sales.businessId, businessId), gte(schema.sales.date, firstDay), lte(schema.sales.date, lastDay)));
      count = res[0]?.count || 0;
      maxAllowed = plan.entitlements.maxSalesPerMonth;
      limitLabel = 'sales records this calendar month';
      break;
    }
    case 'monthlyExpenses': {
      const res = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.expenses)
        .where(and(eq(schema.expenses.businessId, businessId), gte(schema.expenses.date, firstDay), lte(schema.expenses.date, lastDay)));
      count = res[0]?.count || 0;
      maxAllowed = plan.entitlements.maxExpensesPerMonth;
      limitLabel = 'expense records this calendar month';
      break;
    }
  }

  if (count >= maxAllowed) {
    const error: any = new Error(
      `Plan Limit Reached: Your ${plan.name} plan includes up to ${maxAllowed} ${limitLabel} (current: ${count}). Please upgrade your plan in BizFlow settings to continue recording new entries. Existing records remain fully accessible.`
    );
    error.code = 'PLAN_LIMIT_REACHED';
    error.limitType = limitType;
    error.currentUsage = count;
    error.maxAllowed = maxAllowed;
    error.planId = plan.id;
    error.planName = plan.name;
    throw error;
  }
};

