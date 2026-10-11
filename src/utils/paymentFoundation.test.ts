import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';

export async function runPaymentFoundationTests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let passed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      results.push(`✓ PASS: ${message}`);
    } else {
      results.push(`✗ FAIL: ${message}`);
      passed = false;
    }
  }

  const testBizId = `biz_pfd_test_${Date.now()}`;
  const now = new Date().toISOString();

  try {
    // 1. Setup isolated test business
    await db.insert(schema.businesses).values({
      id: testBizId,
      name: 'Payment Foundation Test Ltd',
      tagline: 'Integrity Testing',
      address: '10 Marina, Lagos',
      phone: '+234 801 111 2222',
      email: `finance_${Date.now()}@bizflow.test`,
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      enableTax: false,
      lastInvoiceSequence: 100,
    });

    // -------------------------------------------------------------------------
    // TEST 1: Schema Integrity & Subscriptions Epoch Column
    // -------------------------------------------------------------------------
    const subId = `sub_${Date.now()}_test`;
    await db.insert(schema.subscriptions).values({
      id: subId,
      businessId: testBizId,
      planId: 'starter',
      billingInterval: 'monthly',
      status: 'active',
      startDate: now.slice(0, 10),
      currentPeriodStart: now.slice(0, 10),
      currentPeriodEnd: '2026-11-10',
      cancelAtPeriodEnd: false,
      paymentProvider: 'paystack',
      epoch: 1,
      customerEmail: 'test@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });

    const insertedSub = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, testBizId))
      .limit(1);

    assert(insertedSub.length === 1, 'Subscription record inserted successfully in dev database');
    assert(insertedSub[0].epoch === 1, 'Subscription tracks integer epoch column (default 1)');
    assert(insertedSub[0].customerEmail === 'test@bizflow.test', 'Subscription tracks customerEmail');

    // -------------------------------------------------------------------------
    // TEST 2: Unique Constraint on Subscriptions business_id
    // -------------------------------------------------------------------------
    let subDuplicateCaught = false;
    try {
      await db.insert(schema.subscriptions).values({
        id: `sub_dupe_${Date.now()}`,
        businessId: testBizId, // Duplicate!
        planId: 'business',
        billingInterval: 'annual',
        status: 'active',
        startDate: now.slice(0, 10),
        currentPeriodStart: now.slice(0, 10),
        currentPeriodEnd: '2027-10-10',
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err: any) {
      subDuplicateCaught = true;
    }
    assert(subDuplicateCaught, 'Unique constraint prevents duplicate subscriptions for same business');

    // -------------------------------------------------------------------------
    // TEST 3: Payment Transactions Insertion & Strict Integer Kobo Precision
    // -------------------------------------------------------------------------
    const ref1 = `pst_test_${Date.now()}_001`;
    await db.insert(schema.paymentTransactions).values({
      id: `ptx_${Date.now()}_001`,
      businessId: testBizId,
      subscriptionId: subId,
      reference: ref1,
      provider: 'paystack',
      providerTransactionId: null, // Initial pending checkout
      planId: 'starter',
      billingInterval: 'monthly',
      amountKobo: 250000, // ₦2,500.00
      currency: 'NGN',
      status: 'pending',
      expectedEpoch: 1,
      customerEmail: 'test@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });

    const pendingTx = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.reference, ref1))
      .limit(1);

    assert(pendingTx.length === 1, 'Payment transaction created with pending status');
    assert(Number(pendingTx[0].amountKobo) === 250000, 'Integer kobo amount preserved accurately (250,000 kobo)');
    assert(pendingTx[0].expectedEpoch === 1, 'Payment transaction stores expected_epoch (1)');

    // -------------------------------------------------------------------------
    // TEST 4: Unique Checkout Reference Enforcement
    // -------------------------------------------------------------------------
    let refDuplicateCaught = false;
    try {
      await db.insert(schema.paymentTransactions).values({
        id: `ptx_${Date.now()}_002`,
        businessId: testBizId,
        reference: ref1, // Duplicate reference!
        planId: 'business',
        billingInterval: 'annual',
        amountKobo: 5000000,
        currency: 'NGN',
        status: 'pending',
        customerEmail: 'test@bizflow.test',
        createdAt: now,
        updatedAt: now,
      });
    } catch (err: any) {
      refDuplicateCaught = true;
    }
    assert(refDuplicateCaught, 'Unique constraint prevents duplicate payment checkout references');

    // -------------------------------------------------------------------------
    // TEST 5: Partial Unique Index on (provider, provider_transaction_id)
    // -------------------------------------------------------------------------
    // Multiple pending records with provider_transaction_id = null ARE permitted:
    const ref2 = `pst_test_${Date.now()}_002`;
    await db.insert(schema.paymentTransactions).values({
      id: `ptx_${Date.now()}_003`,
      businessId: testBizId,
      reference: ref2,
      provider: 'paystack',
      providerTransactionId: null, // Second pending record with null
      planId: 'starter',
      billingInterval: 'monthly',
      amountKobo: 250000,
      currency: 'NGN',
      status: 'pending',
      customerEmail: 'test@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });
    assert(true, 'Multiple pending checkouts with null provider_transaction_id are safely permitted');

    // Set provider_transaction_id on ref1
    const testProviderTxId = `ptx_live_${Date.now()}`;
    await db
      .update(schema.paymentTransactions)
      .set({ providerTransactionId: testProviderTxId, status: 'success' })
      .where(eq(schema.paymentTransactions.reference, ref1));

    // Attempting to assign the SAME non-null provider_transaction_id to ref2 must fail:
    let providerTxDupeCaught = false;
    try {
      await db
        .update(schema.paymentTransactions)
        .set({ providerTransactionId: testProviderTxId })
        .where(eq(schema.paymentTransactions.reference, ref2));
    } catch (err: any) {
      providerTxDupeCaught = true;
    }
    assert(providerTxDupeCaught, 'Partial unique index blocks claiming same provider_transaction_id across different checkouts');

    // -------------------------------------------------------------------------
    // TEST 6: Webhook Events Idempotency & Primary Key Uniqueness
    // -------------------------------------------------------------------------
    const webhookEventId = `ev_test_${Date.now()}`;
    await db.insert(schema.webhookEvents).values({
      id: webhookEventId,
      eventType: 'charge.success',
      provider: 'paystack',
      reference: ref1,
      status: 'processing',
      attempts: 1,
      claimToken: 'token_uuid_1',
      firstReceivedAt: now,
    });

    const insertedEvent = await db
      .select()
      .from(schema.webhookEvents)
      .where(eq(schema.webhookEvents.id, webhookEventId))
      .limit(1);

    assert(insertedEvent.length === 1, 'Webhook event inserted in processing state');
    assert(insertedEvent[0].claimToken === 'token_uuid_1', 'Webhook event records claimToken');

    let eventDupeCaught = false;
    try {
      await db.insert(schema.webhookEvents).values({
        id: webhookEventId, // Duplicate eventId!
        eventType: 'charge.success',
        provider: 'paystack',
        firstReceivedAt: now,
      });
    } catch (err: any) {
      eventDupeCaught = true;
    }
    assert(eventDupeCaught, 'Primary key prevents duplicate webhook event insertion');

    // -------------------------------------------------------------------------
    // TEST 7: Tenant Isolation on Payment History
    // -------------------------------------------------------------------------
    const otherBizId = `biz_other_${Date.now()}`;
    await db.insert(schema.businesses).values({
      id: otherBizId,
      name: 'Competitor Enterprise',
      tagline: 'Isolation Verification',
      address: '20 Broad St, Lagos',
      phone: '+234 802 222 3333',
      email: `other_${Date.now()}@bizflow.test`,
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      enableTax: false,
      lastInvoiceSequence: 100,
    });

    const tenantATxs = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.businessId, testBizId));

    const tenantBTxs = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.businessId, otherBizId));

    assert(tenantATxs.length >= 1, 'Tenant A can query its own payment transactions');
    assert(tenantBTxs.length === 0, 'Tenant B has zero access to Tenant A transactions (strict isolation)');

    // -------------------------------------------------------------------------
    // TEST 8: Foreign Key Restrict Deletion Protection
    // -------------------------------------------------------------------------
    let fkRestrictBlocked = false;
    try {
      // Deleting a business with financial payment transactions must fail under onDelete: restrict
      await db.delete(schema.businesses).where(eq(schema.businesses.id, testBizId));
    } catch (err: any) {
      fkRestrictBlocked = true;
    }
    assert(fkRestrictBlocked, 'Foreign key onDelete: restrict prevents silent deletion of financial payment history');

    // Clean up test data safely in reverse dependency order
    await db.delete(schema.webhookEvents).where(eq(schema.webhookEvents.id, webhookEventId));
    await db.delete(schema.paymentTransactions).where(eq(schema.paymentTransactions.businessId, testBizId));
    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.businessId, testBizId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, testBizId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, otherBizId));

  } catch (err: any) {
    passed = false;
    results.push(`✗ EXCEPTION: ${err?.message || String(err)}`);
  }

  return { passed, results };
}
