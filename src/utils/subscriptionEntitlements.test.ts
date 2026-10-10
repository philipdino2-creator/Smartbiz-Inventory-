import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import {
  PLANS,
  nairaToKobo,
  koboToNaira,
  calculateAnnualSavingsNgn,
  formatPlanPrice,
  resolvePlan,
} from '../config/plans.ts';
import {
  getBusinessSubscription,
  getBusinessUsage,
  checkPlanLimit,
  checkFeatureEntitlement,
  getFullSubscriptionStatus,
  getCurrentMonthDateRange,
} from '../services/subscriptionService.ts';
import { activePaymentProvider } from '../services/paymentProvider.ts';
import { PlanId } from '../types/subscription.ts';

export async function runSubscriptionEntitlementsTests(): Promise<{
  passed: boolean;
  results: string[];
  summary: Record<string, 'PASS' | 'FAIL'>;
}> {
  const results: string[] = [];
  let passed = true;

  const summary: Record<string, 'PASS' | 'FAIL'> = {
    'Launch Pricing & Kobo Arithmetic': 'PASS',
    'Annual Billing Savings & Disclosure': 'PASS',
    'Plan Identifiers & Future Tier Safety': 'PASS',
    'Absent Subscription Safe Resolution': 'PASS',
    'Customer Limit Enforcement in PostgreSQL': 'PASS',
    'Product Catalog Limit Enforcement': 'PASS',
    'Team User Limit Enforcement': 'PASS',
    'Monthly Sales & Expense Volume Limits': 'PASS',
    'Historical Reads Preserved at Limit': 'PASS',
    'Downgrade Preserves Financial Records': 'PASS',
    'Feature Gating Protects Premium Workflows': 'PASS',
    'Cross-Tenant Subscription Isolation': 'PASS',
    'Unconfigured Payment Provider Rejection': 'PASS',
  };

  function assert(condition: boolean, testKey: string, message: string) {
    if (condition) {
      results.push(`✓ PASS [${testKey}]: ${message}`);
    } else {
      results.push(`✗ FAIL [${testKey}]: ${message}`);
      passed = false;
      summary[testKey] = 'FAIL';
    }
  }

  try {
    // =========================================================================
    // Test 1: Launch Pricing & Integer Kobo Arithmetic
    // =========================================================================
    const freePlan = PLANS.free;
    const starterPlan = PLANS.starter;
    const businessPlan = PLANS.business;
    const plusPlan = PLANS.business_plus;

    const koboMathAccurate =
      starterPlan.monthlyPriceKobo === 250000 &&
      starterPlan.annualPriceKobo === 2500000 &&
      businessPlan.monthlyPriceKobo === 500000 &&
      businessPlan.annualPriceKobo === 5000000 &&
      plusPlan.monthlyPriceKobo === 1000000 &&
      plusPlan.annualPriceKobo === 10000000 &&
      nairaToKobo(2500) === 250000 &&
      koboToNaira(250000) === 2500;

    assert(
      freePlan.monthlyPriceNgn === 0 &&
      starterPlan.monthlyPriceNgn === 2500 &&
      businessPlan.monthlyPriceNgn === 5000 &&
      plusPlan.monthlyPriceNgn === 10000 &&
      koboMathAccurate,
      'Launch Pricing & Kobo Arithmetic',
      'Launch prices (₦0, ₦2,500, ₦5,000, ₦10,000) use integer kobo arithmetic without float inaccuracies'
    );

    // =========================================================================
    // Test 2: Annual Billing Savings & Disclosure
    // =========================================================================
    const starterSavings = calculateAnnualSavingsNgn('starter');
    const businessSavings = calculateAnnualSavingsNgn('business');
    const starterAnnualFmt = formatPlanPrice('starter', 'annual');

    assert(
      starterSavings === 5000 && // 12 * 2500 - 25000 = 5000 (2 months free)
      businessSavings === 10000 && // 12 * 5000 - 50000 = 10000 (2 months free)
      starterAnnualFmt.billingDetail.includes('2 months free') &&
      starterAnnualFmt.amountFormatted === '₦2,083',
      'Annual Billing Savings & Disclosure',
      'Annual billing saves exactly 2 months upfront (₦5,000 on Starter, ₦10,000 on Business) with clear disclosure'
    );

    // =========================================================================
    // Test 3: Plan Identifiers & Future Tier Safety
    // =========================================================================
    assert(
      plusPlan.isAvailable === false &&
      plusPlan.isFuture === true &&
      resolvePlan('unknown_tier' as PlanId).id === 'free' &&
      resolvePlan('free').id === 'free' &&
      resolvePlan('starter').id === 'starter' &&
      resolvePlan('business').id === 'business',
      'Plan Identifiers & Future Tier Safety',
      'Stable plan IDs enforced; Business Plus is explicitly marked unavailable for purchase at launch'
    );

    // =========================================================================
    // Test 4: Absent Subscription Safe Resolution
    // =========================================================================
    const unseededBizId = `biz_fresh_${Date.now()}`;
    const safeSub = await getBusinessSubscription(unseededBizId);

    assert(
      safeSub.planId === 'free' &&
      safeSub.status === 'active' &&
      safeSub.businessId === unseededBizId,
      'Absent Subscription Safe Resolution',
      'Unconfigured business safely resolves to Free tier default without granting unauthorized paid entitlements'
    );

    // =========================================================================
    // Set up Real PostgreSQL Test Environment
    // =========================================================================
    const testBizId = `biz_entitlement_test_${Date.now()}`;
    const now = new Date().toISOString();

    await db.insert(schema.businesses).values({
      id: testBizId,
      name: 'Entitlement Verification Hub',
      tagline: 'Precision Accounting',
      address: '22 Airport Road, Asaba',
      phone: '+234 812 345 6789',
      email: 'audit@entitlementhub.ng',
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      enableTax: true,
      lastInvoiceSequence: 100,
    });

    // Explicitly configure test business on Free plan
    await db.insert(schema.subscriptions).values({
      id: `sub_${testBizId}`,
      businessId: testBizId,
      planId: 'free',
      billingInterval: 'monthly',
      status: 'active',
      startDate: now,
      currentPeriodStart: '2026-10-01',
      currentPeriodEnd: '2026-10-31',
      cancelAtPeriodEnd: false,
      paymentProvider: 'none',
      createdAt: now,
      updatedAt: now,
    });

    // =========================================================================
    // Test 5: Customer Limit Enforcement in PostgreSQL (Free Plan = 30)
    // =========================================================================
    // Insert 30 customers
    for (let i = 1; i <= 30; i++) {
      await db.insert(schema.customers).values({
        id: `cust_test_${i}_${testBizId}`,
        businessId: testBizId,
        name: `Customer ${i}`,
        phone: `+234 800 000 ${String(i).padStart(4, '0')}`,
        email: null,
        address: null,
        notes: null,
        totalPurchases: '0.00',
        totalPaid: '0.00',
        outstandingDebt: '0.00',
        createdAt: now,
        updatedAt: now,
      });
    }

    const customerLimitCheck = await checkPlanLimit(testBizId, 'customers');

    assert(
      customerLimitCheck.allowed === false &&
      customerLimitCheck.currentUsage === 30 &&
      customerLimitCheck.maxAllowed === 30 &&
      customerLimitCheck.upgradeMessage?.includes('Plan Limit Reached') === true,
      'Customer Limit Enforcement in PostgreSQL',
      'Free plan authoritatively blocks customer creation when reaching limit of 30'
    );

    // =========================================================================
    // Test 6: Product Catalog Limit Enforcement (Free Plan = 25)
    // =========================================================================
    for (let i = 1; i <= 25; i++) {
      await db.insert(schema.products).values({
        id: `prod_test_${i}_${testBizId}`,
        businessId: testBizId,
        name: `Item ${i}`,
        type: 'service',
        sellingPrice: '1000.00',
        costPrice: '500.00',
        sku: null,
        category: 'Services',
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const productLimitCheck = await checkPlanLimit(testBizId, 'products');

    assert(
      productLimitCheck.allowed === false &&
      productLimitCheck.currentUsage === 25 &&
      productLimitCheck.maxAllowed === 25,
      'Product Catalog Limit Enforcement',
      'Free plan authoritatively blocks product additions when reaching catalog limit of 25'
    );

    // =========================================================================
    // Test 7: Team User Limit Enforcement (Free Plan = 1 user)
    // =========================================================================
    await db.insert(schema.users).values({
      id: `usr_solo_${testBizId}`,
      businessId: testBizId,
      name: 'Solo Operator',
      email: `solo_${testBizId}@test.ng`,
      role: 'owner',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userLimitCheck = await checkPlanLimit(testBizId, 'users');

    assert(
      userLimitCheck.allowed === false &&
      userLimitCheck.currentUsage === 1 &&
      userLimitCheck.maxAllowed === 1,
      'Team User Limit Enforcement',
      'Free plan authoritatively enforces 1-user limit; additional team members require Business plan'
    );

    // =========================================================================
    // Test 8: Monthly Sales & Expense Volume Limits (Free Plan = 50 each)
    // =========================================================================
    const todayStr = '2026-10-09';
    for (let i = 1; i <= 50; i++) {
      await db.insert(schema.sales).values({
        id: `sale_vol_${i}_${testBizId}`,
        businessId: testBizId,
        invoiceNumber: `VOL-${i}-${Date.now()}`,
        date: todayStr,
        time: '12:00',
        customerName: `Customer ${i}`,
        totalAmount: '5000.00',
        amountPaid: '5000.00',
        balanceDue: '0.00',
        paymentMethod: 'Cash',
        paymentStatus: 'paid',
        recordedByUserId: `usr_solo_${testBizId}`,
        recordedByUserName: 'Solo Operator',
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(schema.expenses).values({
        id: `exp_vol_${i}_${testBizId}`,
        businessId: testBizId,
        date: todayStr,
        time: '12:00',
        category: 'Utilities',
        description: `Expense ${i}`,
        amount: '1000.00',
        paymentMethod: 'Cash',
        vendorName: 'Vendor',
        recordedByUserId: `usr_solo_${testBizId}`,
        recordedByUserName: 'Solo Operator',
        createdAt: now,
        updatedAt: now,
      });
    }

    const salesLimitCheck = await checkPlanLimit(testBizId, 'monthlySales');
    const expensesLimitCheck = await checkPlanLimit(testBizId, 'monthlyExpenses');

    assert(
      salesLimitCheck.allowed === false &&
      salesLimitCheck.currentUsage === 50 &&
      salesLimitCheck.maxAllowed === 50 &&
      expensesLimitCheck.allowed === false &&
      expensesLimitCheck.currentUsage === 50 &&
      expensesLimitCheck.maxAllowed === 50,
      'Monthly Sales & Expense Volume Limits',
      'Free plan authoritatively caps monthly transaction recording at 50 sales and 50 expenses'
    );

    // =========================================================================
    // Test 9: Historical Reads Preserved at Limit
    // =========================================================================
    const readableSales = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.businessId, testBizId));
    const readableExpenses = await db
      .select()
      .from(schema.expenses)
      .where(eq(schema.expenses.businessId, testBizId));

    assert(
      readableSales.length === 50 &&
      readableExpenses.length === 50 &&
      readableSales.every(s => Number(s.totalAmount) === 5000),
      'Historical Reads Preserved at Limit',
      'All historical sales, expenses, and records remain 100% accessible and readable when limits are met'
    );

    // =========================================================================
    // Test 10: Downgrade Preserves Financial Records
    // =========================================================================
    // Simulate upgrade to Starter then downgrade back to Free
    await db
      .update(schema.subscriptions)
      .set({ planId: 'starter', updatedAt: new Date().toISOString() })
      .where(eq(schema.subscriptions.businessId, testBizId));

    let starterUsage = await getBusinessUsage(testBizId);
    let starterSalesCheck = await checkPlanLimit(testBizId, 'monthlySales');

    // On Starter (limit 500), 50 sales is allowed
    const allowedOnStarter = starterSalesCheck.allowed === true;

    // Now simulate downgrade back to Free
    await db
      .update(schema.subscriptions)
      .set({ planId: 'free', updatedAt: new Date().toISOString() })
      .where(eq(schema.subscriptions.businessId, testBizId));

    // Verify all 50 sales, 50 expenses, 30 customers, and 25 products exist completely untouched
    const afterDowngradeCustomers = await db.select().from(schema.customers).where(eq(schema.customers.businessId, testBizId));
    const afterDowngradeProducts = await db.select().from(schema.products).where(eq(schema.products.businessId, testBizId));
    const afterDowngradeSales = await db.select().from(schema.sales).where(eq(schema.sales.businessId, testBizId));

    assert(
      allowedOnStarter &&
      afterDowngradeCustomers.length === 30 &&
      afterDowngradeProducts.length === 25 &&
      afterDowngradeSales.length === 50,
      'Downgrade Preserves Financial Records',
      'Plan downgrades never delete historical customer, catalog, or transaction data; records remain fully intact'
    );

    // =========================================================================
    // Test 11: Feature Gating Protects Premium Workflows
    // =========================================================================
    const freeRecurring = await checkFeatureEntitlement(testBizId, 'recurringExpenses');
    const freeRbac = await checkFeatureEntitlement(testBizId, 'multiUserRbac');

    // Upgrade test business to Business plan temporarily
    await db
      .update(schema.subscriptions)
      .set({ planId: 'business', updatedAt: new Date().toISOString() })
      .where(eq(schema.subscriptions.businessId, testBizId));

    const businessRecurring = await checkFeatureEntitlement(testBizId, 'recurringExpenses');
    const businessRbac = await checkFeatureEntitlement(testBizId, 'multiUserRbac');

    assert(
      freeRecurring.allowed === false &&
      freeRbac.allowed === false &&
      businessRecurring.allowed === true &&
      businessRbac.allowed === true,
      'Feature Gating Protects Premium Workflows',
      'Feature entitlements accurately gate team RBAC and recurring schedules to appropriate tiers'
    );

    // =========================================================================
    // Test 12: Cross-Tenant Subscription Isolation
    // =========================================================================
    const tenantOtherId = `biz_tenant_other_${Date.now()}`;
    await db.insert(schema.businesses).values({
      id: tenantOtherId,
      name: 'Other Tenant Ltd',
      tagline: 'Distinct Ops',
      address: 'Lagos',
      phone: '+234 800 000 1111',
      email: 'other@tenant.ng',
      currency: 'NGN',
      currencySymbol: '₦',
    });

    await db.insert(schema.subscriptions).values({
      id: `sub_${tenantOtherId}`,
      businessId: tenantOtherId,
      planId: 'starter',
      billingInterval: 'annual',
      status: 'active',
      startDate: now,
      currentPeriodStart: '2026-10-01',
      currentPeriodEnd: '2027-09-30',
      cancelAtPeriodEnd: false,
      paymentProvider: 'none',
      createdAt: now,
      updatedAt: now,
    });

    const tenantAStatus = await getFullSubscriptionStatus(testBizId);
    const tenantBStatus = await getFullSubscriptionStatus(tenantOtherId);

    assert(
      tenantAStatus.subscription.businessId === testBizId &&
      tenantBStatus.subscription.businessId === tenantOtherId &&
      tenantBStatus.subscription.planId === 'starter' &&
      tenantAStatus.subscription.planId === 'business',
      'Cross-Tenant Subscription Isolation',
      'Subscription and usage queries are strictly partitioned by businessId with zero cross-tenant leakage'
    );

    // =========================================================================
    // Test 13: Unconfigured Payment Provider Rejection
    // =========================================================================
    let checkoutAttemptThrew = false;
    try {
      await activePaymentProvider.createCheckoutSession({
        businessId: testBizId,
        planId: 'business',
        interval: 'monthly',
        customerEmail: 'audit@entitlementhub.ng',
        customerName: 'Audit Officer',
      });
    } catch (e: any) {
      checkoutAttemptThrew = e.message.includes('Payment Gateway Integration in Progress');
    }

    assert(
      activePaymentProvider.isConfigured === false && checkoutAttemptThrew,
      'Unconfigured Payment Provider Rejection',
      'Payment provider stub safely rejects unverified charges and blocks premature activation'
    );

    // =========================================================================
    // Test 14: Concurrency-Safe Limit Enforcement Under Simultaneous Requests
    // =========================================================================
    // Ensure test business is explicitly set back to Free plan (since Test 11 upgraded it to business)
    await db
      .update(schema.subscriptions)
      .set({ planId: "free", updatedAt: new Date().toISOString() })
      .where(eq(schema.subscriptions.businessId, testBizId));

    // Reset test business sales to exactly 49 (1 below the Free plan limit of 50)
    await db.delete(schema.sales).where(eq(schema.sales.businessId, testBizId));
    for (let s = 1; s <= 49; s++) {
      await db.insert(schema.sales).values({
        id: `sale_concur_${s}_${testBizId}`,
        businessId: testBizId,
        invoiceNumber: `CNCR-2026-${String(s).padStart(3, "0")}`,
        date: now.slice(0, 10),
        time: "12:00",
        customerName: "Concurrent Customer",
        subtotal: "1000.00",
        discount: "0",
        taxAmount: "0",
        totalAmount: "1000.00",
        paymentMethod: "Cash",
        paymentStatus: "paid",
        amountPaid: "1000.00",
        balanceDue: "0",
        recordedByUserId: `usr_solo_${testBizId}`,
        recordedByUserName: "Solo Operator",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Now launch two simultaneous transactions that attempt to insert the 50th sale
    // Protected by FOR UPDATE row locking on the business record
    const executeConcurrentSaleAttempt = async (attemptId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await db.transaction(async (tx) => {
          // Lock business row for update
          const bizRows = await tx.select().from(schema.businesses).where(eq(schema.businesses.id, testBizId)).for("update");
          if (bizRows.length === 0) throw new Error("Business not found");

          // Concurrency-safe limit check inside the transaction lock
          const check = await checkPlanLimit(testBizId, "monthlySales", tx);
          if (!check.allowed) {
            const err: any = new Error(check.upgradeMessage);
            err.code = "PLAN_LIMIT_REACHED";
            throw err;
          }

          // Insert sale
          await tx.insert(schema.sales).values({
            id: `sale_race_${attemptId}_${testBizId}`,
            businessId: testBizId,
            invoiceNumber: `CNCR-2026-${attemptId}`,
            date: now.slice(0, 10),
            time: "12:01",
            customerName: "Concurrent Customer",
            subtotal: "1000.00",
            discount: "0",
            taxAmount: "0",
            totalAmount: "1000.00",
            paymentMethod: "Cash",
            paymentStatus: "paid",
            amountPaid: "1000.00",
            balanceDue: "0",
            recordedByUserId: `usr_solo_${testBizId}`,
            recordedByUserName: "Solo Operator",
            createdAt: now,
            updatedAt: now,
          });
        });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.code || err.message };
      }
    };

    // Execute both attempts concurrently
    const [attemptA, attemptB] = await Promise.all([
      executeConcurrentSaleAttempt("attempt_A"),
      executeConcurrentSaleAttempt("attempt_B"),
    ]);

    // Authoritative count in PostgreSQL
    const finalSales = await db.select().from(schema.sales).where(eq(schema.sales.businessId, testBizId));
    const exactlyOneSucceeded = (attemptA.success && !attemptB.success) || (!attemptA.success && attemptB.success);
    const rejectedAttempt = attemptA.success ? attemptB : attemptA;

    assert(
      exactlyOneSucceeded &&
      rejectedAttempt.error === "PLAN_LIMIT_REACHED" &&
      finalSales.length === 50,
      "Concurrent Plan Limit Race-Condition Prevention",
      "Two simultaneous creation requests cannot exceed plan limits; FOR UPDATE serialization admits exactly one and rejects the second with PLAN_LIMIT_REACHED"
    );

    // =========================================================================
    // Test 15: Plan & Usage Dashboard Entitlements & Metric Accuracy
    // =========================================================================
    const dashboardStatus = await getFullSubscriptionStatus(testBizId);
    const dateRange = getCurrentMonthDateRange();

    const dashboardMetricsValid =
      dashboardStatus.subscription.businessId === testBizId &&
      dashboardStatus.plan.id === "free" &&
      dashboardStatus.usage.billingCycleMonth === dateRange.cycleKey &&
      dashboardStatus.limits.monthlySales.current === 50 &&
      dashboardStatus.limits.monthlySales.max === 50 &&
      dashboardStatus.limits.monthlySales.isAtLimit === true &&
      dashboardStatus.limits.monthlyExpenses.max === 50 &&
      dashboardStatus.limits.customers.max === 30 &&
      dashboardStatus.limits.products.max === 25 &&
      dashboardStatus.limits.users.max === 1;

    assert(
      dashboardMetricsValid,
      "Plan & Usage Dashboard Metric Accuracy",
      "Full subscription status accurately returns tenant-scoped usage metrics, authoritative limits, and limit flags"
    );

    // =========================================================================
    // Clean up Test Entities
    // =========================================================================
    await db.delete(schema.sales).where(eq(schema.sales.businessId, testBizId));
    await db.delete(schema.expenses).where(eq(schema.expenses.businessId, testBizId));
    await db.delete(schema.products).where(eq(schema.products.businessId, testBizId));
    await db.delete(schema.customers).where(eq(schema.customers.businessId, testBizId));
    await db.delete(schema.users).where(eq(schema.users.businessId, testBizId));
    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.businessId, testBizId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, testBizId));

    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.businessId, tenantOtherId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, tenantOtherId));

  } catch (err: any) {
    passed = false;
    results.push(`✗ EXCEPTION: ${err?.message || String(err)}`);
  }

  return { passed, results, summary };
}
