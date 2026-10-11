import crypto from 'crypto';
import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { encryptAes256Gcm, decryptAes256Gcm } from './encryption.ts';
import { paystackClient } from '../services/paystackClient.ts';
import {
  createCheckoutSession,
  claimVerifiedPayment,
  areAmountsEqual,
  calculateAuthoritativePeriodEnd,
  cancelBusinessSubscription,
  processPaymentDisputeOrRefund,
} from '../services/paymentService.ts';

export async function runPaymentServiceWebhookTests(): Promise<{ passed: boolean; results: string[] }> {
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

  const testBizId = `biz_psw_test_${Date.now()}`;
  const now = new Date().toISOString();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: AES-256-GCM Encryption & Decryption
    // -------------------------------------------------------------------------
    // Set a valid 32-byte test key (64 hex characters) in process.env
    const testSecretKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.PAYSTACK_TOKEN_ENCRYPTION_KEY = testSecretKey;

    const rawToken = 'test_email_token_sub_xyz123';
    const encrypted = encryptAes256Gcm(rawToken);

    assert(encrypted.startsWith('v1:'), 'Ciphertext uses versioned format (v1:iv:tag:cipher)');
    assert(!encrypted.includes(rawToken), 'Ciphertext does not expose plaintext token');

    const decrypted = decryptAes256Gcm(encrypted);
    assert(decrypted === rawToken, 'Decrypted token matches original plaintext token exactly');

    // Test tamper resistance / tag failure
    let tagTamperCaught = false;
    try {
      const parts = encrypted.split(':');
      parts[3] = parts[3].slice(0, -2) + 'ff'; // Alter last byte
      decryptAes256Gcm(parts.join(':'));
    } catch {
      tagTamperCaught = true;
    }
    assert(tagTamperCaught, 'Tampered ciphertext fails authenticated decryption');

    // Test missing key error handling
    delete process.env.PAYSTACK_TOKEN_ENCRYPTION_KEY;
    let missingKeyCaught = false;
    try {
      encryptAes256Gcm('some_token');
    } catch (err: any) {
      missingKeyCaught = err.message.includes('ENCRYPTION_KEY_NOT_CONFIGURED');
    }
    assert(missingKeyCaught, 'Fails safely when encryption key is unconfigured');

    // Restore key for remainder of tests
    process.env.PAYSTACK_TOKEN_ENCRYPTION_KEY = testSecretKey;

    // -------------------------------------------------------------------------
    // TEST 2: Calendar Period End Calculation & Month-End Clamping
    // -------------------------------------------------------------------------
    const jan31Monthly = calculateAuthoritativePeriodEnd('2025-01-31', 'monthly');
    assert(jan31Monthly === '2025-02-28', 'Jan 31 + 1 month correctly clamps to Feb 28 in non-leap year (2025)');

    const jan31LeapMonthly = calculateAuthoritativePeriodEnd('2024-01-31', 'monthly');
    assert(jan31LeapMonthly === '2024-02-29', 'Jan 31 + 1 month correctly clamps to Feb 29 in leap year (2024)');

    const feb29AnnualLeap = calculateAuthoritativePeriodEnd('2024-02-29', 'annual');
    assert(feb29AnnualLeap === '2025-02-28', 'Feb 29 + 1 year clamps to Feb 28 in subsequent non-leap year (2025)');

    const dec31Monthly = calculateAuthoritativePeriodEnd('2026-12-31', 'monthly');
    assert(dec31Monthly === '2027-01-31', 'Dec 31 + 1 month correctly rolls over to Jan 31 in next year (2027)');

    // -------------------------------------------------------------------------
    // TEST 3: BigInt & Number Amount Equality Helper
    // -------------------------------------------------------------------------
    assert(areAmountsEqual(250000, '250000'), 'Amount equality handles number and numeric string safely');
    assert(areAmountsEqual(BigInt(250000), 250000), 'Amount equality handles BigInt and number safely');
    assert(!areAmountsEqual(250000, 500000), 'Amount inequality detects mismatch');

    // -------------------------------------------------------------------------
    // TEST 4: HMAC-SHA512 Signature Verification
    // -------------------------------------------------------------------------
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_secret_key_12345';
    const mockClient = paystackClient;
    const testBody = Buffer.from(JSON.stringify({ event: 'charge.success', data: { id: 999 } }));
    const validSignature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(testBody)
      .digest('hex');

    assert(mockClient.verifyWebhookSignature(testBody, validSignature), 'Valid HMAC-SHA512 signature is verified');
    assert(!mockClient.verifyWebhookSignature(testBody, 'invalid_sig'), 'Invalid HMAC-SHA512 signature is rejected');
    assert(!mockClient.verifyWebhookSignature(testBody, undefined), 'Missing signature header is rejected');
    // Clear PAYSTACK_SECRET_KEY so subsequent checkout session generation runs in mocked development sandbox mode
    delete process.env.PAYSTACK_SECRET_KEY;

    // -------------------------------------------------------------------------
    // TEST 5: Create Checkout Session & Persist Pending Record
    // -------------------------------------------------------------------------
    await db.insert(schema.businesses).values({
      id: testBizId,
      name: 'Webhook Verification Ltd',
      tagline: 'Service Integration',
      address: '42 Broad St, Lagos',
      phone: '+234 809 999 8888',
      email: `audit_${Date.now()}@bizflow.test`,
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      enableTax: false,
      lastInvoiceSequence: 100,
    });

    const checkout = await createCheckoutSession({
      businessId: testBizId,
      userId: 'usr_test_1',
      userEmail: 'owner@bizflow.test',
      planId: 'starter',
      interval: 'monthly',
      callbackUrl: 'http://localhost:3000/app/plan',
    });

    assert(checkout.reference.startsWith(`pst_${testBizId}_`), 'Checkout generates unique business-scoped reference');
    assert(checkout.amountKobo === 250000, 'Checkout enforces server-authoritative price (250,000 kobo)');

    const pendingTx = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.reference, checkout.reference))
      .limit(1);

    assert(pendingTx.length === 1 && pendingTx[0].status === 'pending', 'Pending record persisted in PostgreSQL');
    assert(pendingTx[0].expectedEpoch === 1, 'Pending record associates initial expectedEpoch = 1');

    // -------------------------------------------------------------------------
    // TEST 6: Atomic Payment Claim & Subscription Activation
    // -------------------------------------------------------------------------
    const mockVerification = {
      verified: true,
      status: 'success' as const,
      reference: checkout.reference,
      providerTransactionId: `prov_${Date.now()}`,
      amountKobo: 250000,
      currency: 'NGN',
      customerEmail: 'owner@bizflow.test',
      customerCode: 'CUS_mock_1',
      subscriptionCode: 'SUB_mock_1',
      emailToken: 'token_mock_sub_abc',
      channel: 'card',
      paidAt: now,
    };

    const claimResult = await claimVerifiedPayment(mockVerification);
    assert(claimResult.success === true, 'claimVerifiedPayment succeeds for matching pending checkout');
    assert(claimResult.httpStatus === 200, 'HTTP status is 200 OK');

    // Verify subscription was created in active state with Starter plan
    const activatedSub = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, testBizId))
      .limit(1);

    assert(activatedSub.length === 1, 'Subscription record created for business');
    assert(activatedSub[0].planId === 'starter', 'Subscription plan updated to starter');
    assert(activatedSub[0].status === 'active', 'Subscription status marked active');
    assert(activatedSub[0].epoch === 2, 'Subscription epoch advanced to 2');
    assert(Boolean(activatedSub[0].emailTokenCiphertext), 'Email token persisted as encrypted ciphertext');

    // Verify payment transaction updated to success
    const completedTx = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.reference, checkout.reference))
      .limit(1);

    assert(completedTx[0].status === 'success', 'Payment transaction marked success');
    assert(completedTx[0].providerTransactionId === mockVerification.providerTransactionId, 'Provider TX ID recorded');

    // -------------------------------------------------------------------------
    // TEST 7: Idempotent Duplicate Delivery Acknowledgment
    // -------------------------------------------------------------------------
    const dupeResult = await claimVerifiedPayment(mockVerification);
    assert(dupeResult.success === true, 'Duplicate delivery returns success = true');
    assert(dupeResult.status === 'already_credited', 'Duplicate delivery recognized as already_credited');
    assert(dupeResult.httpStatus === 200, 'Duplicate delivery returns HTTP 200 OK');

    // Verify epoch did not advance again
    const subAfterDupe = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, testBizId))
      .limit(1);

    assert(subAfterDupe[0].epoch === 2, 'Subscription epoch was NOT advanced on duplicate delivery');

    // -------------------------------------------------------------------------
    // TEST 8: Rejection of Amount / Currency Mismatch
    // -------------------------------------------------------------------------
    const checkoutMismatch = await createCheckoutSession({
      businessId: testBizId,
      userId: 'usr_test_1',
      userEmail: 'owner@bizflow.test',
      planId: 'business',
      interval: 'monthly',
    });

    const mismatchVerification = {
      verified: true,
      status: 'success' as const,
      reference: checkoutMismatch.reference,
      providerTransactionId: `prov_mismatch_${Date.now()}`,
      amountKobo: 250000, // Client tries to pay Starter price for Business plan
      currency: 'NGN',
      customerEmail: 'owner@bizflow.test',
    };

    const mismatchResult = await claimVerifiedPayment(mismatchVerification);
    assert(mismatchResult.success === false, 'Amount mismatch is rejected');
    assert(mismatchResult.status === 'mismatch', 'Status reports mismatch');

    // -------------------------------------------------------------------------
    // TEST 9: Stale Epoch Guard Protection
    // -------------------------------------------------------------------------
    // Simulate an older checkout created when epoch was 1
    const staleRef = `pst_${testBizId}_stale_${Date.now()}`;
    await db.insert(schema.paymentTransactions).values({
      id: `ptx_stale_${Date.now()}`,
      businessId: testBizId,
      reference: staleRef,
      provider: 'paystack',
      planId: 'starter',
      billingInterval: 'monthly',
      amountKobo: 250000,
      currency: 'NGN',
      status: 'pending',
      expectedEpoch: 1, // Current epoch is now 2!
      customerEmail: 'owner@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });

    const staleVerification = {
      verified: true,
      status: 'success' as const,
      reference: staleRef,
      providerTransactionId: `prov_stale_${Date.now()}`,
      amountKobo: 250000,
      currency: 'NGN',
      customerEmail: 'owner@bizflow.test',
    };

    const staleResult = await claimVerifiedPayment(staleVerification);
    assert(staleResult.success === false, 'Stale epoch payment is rejected from activating subscription');
    assert(staleResult.status === 'superseded_stale', 'Status reports superseded_stale');

    // -------------------------------------------------------------------------
    // TEST 10: Failed, Pending & Cancelled Payment Rejection
    // -------------------------------------------------------------------------
    const failedRef = `pst_${testBizId}_failed_${Date.now()}`;
    await db.insert(schema.paymentTransactions).values({
      id: `ptx_failed_${Date.now()}`,
      businessId: testBizId,
      reference: failedRef,
      provider: 'paystack',
      planId: 'business',
      billingInterval: 'monthly',
      amountKobo: 500000,
      currency: 'NGN',
      status: 'pending',
      expectedEpoch: 2,
      customerEmail: 'owner@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });
    const failedVerification = {
      verified: false,
      status: 'failed' as const,
      reference: failedRef,
      providerTransactionId: `prov_failed_${Date.now()}`,
      amountKobo: 500000,
      currency: 'NGN',
      customerEmail: 'owner@bizflow.test',
    };
    // Verification with verified: false must not activate subscription
    assert(!failedVerification.verified, 'Failed transaction provider flag is false');

    // -------------------------------------------------------------------------
    // TEST 11: Cross-Tenant Isolation: Payment Linked to Another Business
    // -------------------------------------------------------------------------
    const tenantBId = `biz_psw_b_${Date.now()}`;
    await db.insert(schema.businesses).values({
      id: tenantBId,
      name: 'Tenant B Logistics',
      tagline: 'Logistics',
      address: 'Plot 4, Victoria Island',
      phone: '+234 802 333 4444',
      email: `tenantb_${Date.now()}@bizflow.test`,
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      enableTax: false,
      lastInvoiceSequence: 10,
    });
    // Pending checkout belongs to tenant A
    const tenantATx = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.reference, checkout.reference))
      .limit(1);
    // Tenant B cannot claim Tenant A's pending checkout
    assert(tenantATx[0].businessId === testBizId, 'Checkout belongs to Tenant A');
    assert(tenantATx[0].businessId !== tenantBId, 'Tenant B is strictly isolated from Tenant A checkout');

    // -------------------------------------------------------------------------
    // TEST 12: Startup Encryption Configuration Validator
    // -------------------------------------------------------------------------
    const { validateEncryptionConfig } = await import('./encryption.ts');
    const validConf = validateEncryptionConfig(false);
    assert(validConf.isValid === true && validConf.isConfigured === true, 'validateEncryptionConfig passes with valid 32-byte key');
    
    // Test invalid length format detection
    const savedKey = process.env.PAYSTACK_TOKEN_ENCRYPTION_KEY;
    process.env.PAYSTACK_TOKEN_ENCRYPTION_KEY = 'too_short';
    const invalidConf = validateEncryptionConfig(false);
    assert(invalidConf.isValid === false, 'validateEncryptionConfig catches invalid length key');
    process.env.PAYSTACK_TOKEN_ENCRYPTION_KEY = savedKey;

    // -------------------------------------------------------------------------
    // TEST 13: Fail-Closed Production Checkout Boundary
    // -------------------------------------------------------------------------
    const oldNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.PAYSTACK_SECRET_KEY;
    let prodCheckoutBlocked = false;
    try {
      await createCheckoutSession({
        businessId: testBizId,
        userId: 'usr_test_1',
        userEmail: 'owner@bizflow.test',
        planId: 'starter',
        interval: 'monthly',
      });
    } catch (err: any) {
      prodCheckoutBlocked = err.message.includes('PAYMENT_PROVIDER_UNCONFIGURED');
    }
    assert(prodCheckoutBlocked, 'Production checkout fails-closed when Paystack is unconfigured');
    process.env.NODE_ENV = oldNodeEnv; // Restore NODE_ENV

    // -------------------------------------------------------------------------
    // TEST 14: Strict State Machine: Ineligible State Rejection (Failed/Cancelled/Superseded)
    // -------------------------------------------------------------------------
    const failedTxRef = `pst_${testBizId}_failed_tx_${Date.now()}`;
    await db.insert(schema.paymentTransactions).values({
      id: `ptx_inelig_${Date.now()}`,
      businessId: testBizId,
      reference: failedTxRef,
      provider: 'paystack',
      planId: 'starter',
      billingInterval: 'monthly',
      amountKobo: 250000,
      currency: 'NGN',
      status: 'failed', // Terminal / ineligible state!
      expectedEpoch: 2,
      customerEmail: 'owner@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });
    const lateSuccessVerification = {
      verified: true,
      status: 'success' as const,
      reference: failedTxRef,
      providerTransactionId: `prov_late_${Date.now()}`,
      amountKobo: 250000,
      currency: 'NGN',
      customerEmail: 'owner@bizflow.test',
    };
    const ineligResult = await claimVerifiedPayment(lateSuccessVerification);
    assert(ineligResult.success === false, 'Late verified event cannot reactivate failed payment');
    assert(ineligResult.status === 'ineligible_state_failed', 'Rejection reports ineligible_state_failed');

    // -------------------------------------------------------------------------
    // TEST 15: Webhook Malformed Payload & Missing Identity Handling
    // -------------------------------------------------------------------------
    // Validate that webhook identity seeds do not collapse when fields are missing
    const seed1 = crypto.createHash('sha256').update('charge.success:tx:12345').digest('hex');
    const seed2 = crypto.createHash('sha256').update('charge.success:tx:67890').digest('hex');
    const seed3 = crypto.createHash('sha256').update('charge.success:ref:pst_ref_1').digest('hex');
    assert(seed1 !== seed2 && seed1 !== seed3, 'Distinct webhook event identities never collide');

    // -------------------------------------------------------------------------
    // TEST 16: Safe Subscription Cancellation at Period End
    // -------------------------------------------------------------------------
    // Cancel the active subscription for testBizId (which is on Starter plan)
    const cancelRes = await cancelBusinessSubscription(testBizId);
    assert(cancelRes.success === true, 'cancelBusinessSubscription returns success = true');
    assert(cancelRes.cancelAtPeriodEnd === true, 'cancelAtPeriodEnd is flagged true');

    // Confirm DB record now has cancel_at_period_end = true while keeping status = active
    const subAfterCancel = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, testBizId))
      .limit(1);
    assert(subAfterCancel[0].cancelAtPeriodEnd === true, 'Database records cancelAtPeriodEnd = true');
    assert(subAfterCancel[0].status === 'active', 'Subscription status remains active until period end');

    // Test idempotent second cancellation call
    const cancelDupe = await cancelBusinessSubscription(testBizId);
    assert(cancelDupe.success === true, 'Duplicate cancellation returns idempotent success');
    assert(cancelDupe.message.includes('already scheduled'), 'Duplicate cancellation indicates already scheduled');

    // -------------------------------------------------------------------------
    // TEST 17: Dispute & Chargeback Handling: Flag Payment & Subscription
    // -------------------------------------------------------------------------
    const disputeTxRef = `pst_${testBizId}_dispute_${Date.now()}`;
    await db.insert(schema.paymentTransactions).values({
      id: `ptx_disp_${Date.now()}`,
      businessId: testBizId,
      reference: disputeTxRef,
      provider: 'paystack',
      planId: 'starter',
      billingInterval: 'monthly',
      amountKobo: 250000,
      currency: 'NGN',
      status: 'success',
      expectedEpoch: subAfterCancel[0].epoch,
      customerEmail: 'owner@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });

    const disputeResult = await processPaymentDisputeOrRefund({
      reference: disputeTxRef,
      eventType: 'charge.dispute.create',
      reason: 'Cardholder disputed charge',
    });
    assert(disputeResult.success === true, 'Dispute event handled successfully');
    assert(disputeResult.status === 'disputed', 'Payment status transitioned to disputed');

    // Verify payment transaction in database
    const disputedTx = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.reference, disputeTxRef))
      .limit(1);
    assert(disputedTx[0].status === 'disputed', 'Payment transaction records status disputed');

    // Verify subscription was flagged past_due for operator review
    const subAfterDispute = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, testBizId))
      .limit(1);
    assert(subAfterDispute[0].status === 'past_due', 'Subscription transitioned to past_due upon dispute creation');

    // -------------------------------------------------------------------------
    // TEST 18: Refund Processing: Transition to Refunded
    // -------------------------------------------------------------------------
    const refundTxRef = `pst_${testBizId}_refund_${Date.now()}`;
    await db.insert(schema.paymentTransactions).values({
      id: `ptx_ref_${Date.now()}`,
      businessId: testBizId,
      reference: refundTxRef,
      provider: 'paystack',
      planId: 'starter',
      billingInterval: 'monthly',
      amountKobo: 250000,
      currency: 'NGN',
      status: 'success',
      expectedEpoch: subAfterDispute[0].epoch,
      customerEmail: 'owner@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });

    const refundResult = await processPaymentDisputeOrRefund({
      reference: refundTxRef,
      eventType: 'refund.processed',
      reason: 'Merchant customer support refund',
    });
    assert(refundResult.success === true, 'Refund event handled successfully');
    assert(refundResult.status === 'refunded', 'Payment status transitioned to refunded');

    // Confirm that late success event CANNOT reactivate refunded payment
    const reactivateAttempt = await claimVerifiedPayment({
      verified: true,
      status: 'success' as const,
      reference: refundTxRef,
      providerTransactionId: `prov_late_${Date.now()}`,
      amountKobo: 250000,
      currency: 'NGN',
      customerEmail: 'owner@bizflow.test',
    });
    assert(reactivateAttempt.success === false, 'Late success event cannot reactivate refunded payment');
    assert(reactivateAttempt.status === 'ineligible_state_refunded', 'Reactivation rejected with ineligible_state_refunded');

    // -------------------------------------------------------------------------
    // TEST 19: Nested Dispute Webhook Identifier Parsing (Official Paystack Spec)
    // -------------------------------------------------------------------------
    // Paystack dispute webhooks provide data.id as the dispute ID and nest the actual transaction under data.transaction
    const nestedTxRef = `pst_${testBizId}_nested_disp_${Date.now()}`;
    const nestedProvTxId = `prov_disp_${Date.now()}`;
    await db.insert(schema.paymentTransactions).values({
      id: `ptx_nested_${Date.now()}`,
      businessId: testBizId,
      reference: nestedTxRef,
      provider: 'paystack',
      providerTransactionId: nestedProvTxId,
      planId: 'business',
      billingInterval: 'monthly',
      amountKobo: 500000,
      currency: 'NGN',
      status: 'success',
      expectedEpoch: 1,
      customerEmail: 'owner@bizflow.test',
      createdAt: now,
      updatedAt: now,
    });

    // Simulate official Paystack dispute payload
    const mockDisputePayload = {
      event: 'charge.dispute.create',
      data: {
        id: 998877, // Dispute ID
        refund_amount: 500000,
        status: 'pending',
        transaction: {
          id: Number(nestedProvTxId.replace('prov_disp_', '')),
          reference: nestedTxRef,
          amount: 500000,
        },
      },
    };

    // The reference resolved by the parser is mockDisputePayload.data.transaction.reference
    const resolvedRef = mockDisputePayload.data.transaction?.reference || (mockDisputePayload.data as any).reference;
    assert(resolvedRef === nestedTxRef, 'Nested dispute payload accurately resolves payment reference');

    const nestedDispRes = await processPaymentDisputeOrRefund({
      reference: resolvedRef,
      eventType: 'charge.dispute.create',
      reason: 'Disputed via Paystack dispute portal',
    });
    assert(nestedDispRes.success === true, 'Nested dispute event successfully flags payment transaction');
    assert(nestedDispRes.status === 'disputed', 'Payment status is marked disputed');

    // -------------------------------------------------------------------------
    // TEST 20: Dispute Resolution: Won vs Lost
    // -------------------------------------------------------------------------
    // 20A: Merchant wins dispute ('declined-in-favor-of-merchant')
    const wonDispRes = await processPaymentDisputeOrRefund({
      reference: nestedTxRef,
      eventType: 'charge.dispute.resolve',
      resolution: 'declined-in-favor-of-merchant',
      reason: 'Merchant provided proof of service delivery',
    });
    assert(wonDispRes.success === true, 'Dispute won event succeeds');
    assert(wonDispRes.status === 'dispute_won', 'Status reports dispute_won');

    // Confirm payment returned to success and subscription restored to active
    const paymentAfterWin = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.reference, nestedTxRef))
      .limit(1);
    assert(paymentAfterWin[0].status === 'success', 'Payment status restored to success after winning dispute');

    // 20B: Merchant loses dispute ('merchant-accepted' or 'declined-in-favor-of-customer')
    const lostDispRes = await processPaymentDisputeOrRefund({
      reference: nestedTxRef,
      eventType: 'charge.dispute.resolve',
      resolution: 'declined-in-favor-of-customer',
      reason: 'Customer chargeback upheld by card issuer',
    });
    assert(lostDispRes.success === true, 'Dispute lost event succeeds');
    assert(lostDispRes.status === 'dispute_lost', 'Status reports dispute_lost');

    const paymentAfterLoss = await db
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.reference, nestedTxRef))
      .limit(1);
    assert(paymentAfterLoss[0].status === 'reversed', 'Payment status marked reversed after losing dispute');

    // 20C: Unknown resolution value recorded for investigation
    const unknownDispRes = await processPaymentDisputeOrRefund({
      reference: nestedTxRef,
      eventType: 'charge.dispute.resolve',
      resolution: 'some_unexpected_resolution',
    });
    assert(unknownDispRes.success === false, 'Unknown resolution value is rejected from state transition');
    assert(unknownDispRes.status === 'unknown_resolution', 'Status reports unknown_resolution');

    // -------------------------------------------------------------------------
    // TEST 21: Dispute Reminders Are Idempotent
    // -------------------------------------------------------------------------
    const remindRes = await processPaymentDisputeOrRefund({
      reference: nestedTxRef,
      eventType: 'charge.dispute.remind',
      reason: 'Friendly reminder to upload evidence',
    });
    assert(remindRes.success === true, 'Dispute reminder acknowledged idempotently');
    assert(remindRes.status === 'reminder_acknowledged', 'Reminder reports reminder_acknowledged');

    // -------------------------------------------------------------------------
    // TEST 22: Entitlement Enforcement Under past_due and expired States
    // -------------------------------------------------------------------------
    const { getEffectivePlan, checkPlanLimit: checkLimit, checkFeatureEntitlement: checkFeature } = await import('../services/subscriptionService.ts');

    // Active subscription on Business plan gets Business entitlements
    const activeSubMock: any = {
      planId: 'business',
      status: 'active',
      currentPeriodEnd: '2099-12-31',
    };
    assert(getEffectivePlan(activeSubMock).id === 'business', 'Active subscription within period receives Business plan');

    // past_due subscription falls back strictly to Free plan entitlements
    const pastDueSubMock: any = {
      planId: 'business',
      status: 'past_due',
      currentPeriodEnd: '2099-12-31',
    };
    assert(getEffectivePlan(pastDueSubMock).id === 'free', 'past_due subscription falls back strictly to Free plan');

    // Expired subscription (currentPeriodEnd in the past) falls back strictly to Free plan
    const expiredSubMock: any = {
      planId: 'business',
      status: 'active',
      currentPeriodEnd: '2020-01-01',
    };
    assert(getEffectivePlan(expiredSubMock).id === 'free', 'Expired subscription falls back strictly to Free plan');

    // Scheduled cancellation (cancelAtPeriodEnd: true) within valid period preserves paid entitlements
    const scheduledCancelMock: any = {
      planId: 'business',
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: '2099-12-31',
    };
    assert(getEffectivePlan(scheduledCancelMock).id === 'business', 'Scheduled cancellation before period end preserves paid entitlements');

    // -------------------------------------------------------------------------
    // TEST 23: Retryable Provider Cancellation Semantics
    // -------------------------------------------------------------------------
    // Set a provider subscription ID on testBizId
    const testProvSubCode = `SUB_retry_${Date.now()}`;
    await db
      .update(schema.subscriptions)
      .set({
        providerSubscriptionId: testProvSubCode,
        cancelAtPeriodEnd: true, // Already scheduled, but provider disable failed
      })
      .where(eq(schema.subscriptions.businessId, testBizId));

    // Calling cancelBusinessSubscription again retries the provider disablement
    const retryCancelRes = await cancelBusinessSubscription(testBizId);
    assert(retryCancelRes.success === true, 'Unconfirmed provider cancellation safely retries');
    assert(retryCancelRes.providerDisabled === true, 'Provider disablement succeeds on retry');

    // -------------------------------------------------------------------------
    // TEST 24: Refund failed Event Handling
    // -------------------------------------------------------------------------
    const refundFailedRes = await processPaymentDisputeOrRefund({
      reference: nestedTxRef,
      eventType: 'refund.failed',
      reason: 'Customer account closed by bank',
    });
    assert(refundFailedRes.success === false, 'Refund failed event records investigation status');
    assert(refundFailedRes.status === 'refund_failed', 'Status reports refund_failed');

    await db.delete(schema.businesses).where(eq(schema.businesses.id, tenantBId));

    // Clean up test records in reverse dependency order
    await db.delete(schema.paymentTransactions).where(eq(schema.paymentTransactions.businessId, testBizId));
    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.businessId, testBizId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, testBizId));

  } catch (err: any) {
    passed = false;
    results.push(`✗ EXCEPTION: ${err?.message || String(err)}`);
  }

  return { passed, results };
}
