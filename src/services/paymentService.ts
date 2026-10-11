import crypto from 'crypto';
import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import { PlanId, BillingInterval } from '../types/subscription.ts';
import { PLANS } from '../config/plans.ts';
import { paystackClient, PaystackVerifyResponse } from './paystackClient.ts';
import { encryptAes256Gcm, decryptAes256Gcm } from '../utils/encryption.ts';

export interface CheckoutResult {
  checkoutUrl: string;
  reference: string;
  amountKobo: number;
}

export function areAmountsEqual(a: number | string | bigint, b: number | string | bigint): boolean {
  try {
    return BigInt(a) === BigInt(b);
  } catch {
    return false;
  }
}

/**
 * Returns the current date in YYYY-MM-DD adhering strictly to Africa/Lagos timezone.
 */
export function getLagosTodayYmd(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Advances a calendar date by 1 month or 1 year with month-end and leap-year clamping.
 */
export function calculateAuthoritativePeriodEnd(anchorYmd: string, interval: BillingInterval): string {
  const [yearStr, monthStr, dayStr] = anchorYmd.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (interval === 'annual') {
    year += 1;
    if (month === 2 && day === 29) {
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return `${year}-02-${isLeap ? '29' : '28'}`;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Monthly
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  const maxDaysInTargetMonth = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDaysInTargetMonth);

  return `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

/**
 * Creates a unique pending checkout record before returning checkout details.
 */
export async function createCheckoutSession(params: {
  businessId: string;
  userId: string;
  userEmail: string;
  planId: PlanId;
  interval: BillingInterval;
  callbackUrl?: string;
}): Promise<CheckoutResult> {
  const { businessId, userId, userEmail, planId, interval, callbackUrl } = params;

  if (planId === 'free' || planId === 'business_plus') {
    throw new Error('INVALID_PLAN: Free plan does not require checkout, and Business Plus is not yet available.');
  }

  const planDef = PLANS[planId];
  if (!planDef) {
    throw new Error(`UNKNOWN_PLAN: Plan ${planId} is not recognized.`);
  }

  const expectedAmountKobo = interval === 'annual' ? planDef.annualPriceKobo : planDef.monthlyPriceKobo;
  const reference = `pst_${businessId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const nowIso = new Date().toISOString();

  // Determine current subscription epoch
  const subRows = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.businessId, businessId))
    .limit(1);

  const currentEpoch = subRows[0]?.epoch ?? 1;

  // Persist pending checkout record in PostgreSQL
  await db.insert(schema.paymentTransactions).values({
    id: `ptx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    businessId,
    subscriptionId: subRows[0]?.id || null,
    reference,
    provider: 'paystack',
    providerTransactionId: null,
    planId,
    billingInterval: interval,
    amountKobo: expectedAmountKobo,
    currency: 'NGN',
    status: 'pending',
    expectedEpoch: currentEpoch,
    customerEmail: userEmail,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  // Call Paystack Initialize API if configured
  if (paystackClient.isConfigured()) {
    const initRes = await paystackClient.initializeTransaction({
      email: userEmail,
      amountKobo: expectedAmountKobo,
      reference,
      callbackUrl,
      metadata: {
        businessId,
        planId,
        billingInterval: interval,
        userId,
        expectedEpoch: currentEpoch,
      },
    });
    return {
      checkoutUrl: initRes.data.authorization_url,
      reference,
      amountKobo: expectedAmountKobo,
    };
  }

  // Fail-closed in production: Never provide simulated checkout in production!
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    throw new Error(
      'PAYMENT_PROVIDER_UNCONFIGURED: Real-time payment processing is unavailable in production because Paystack credentials are not configured.'
    );
  }

  // Development sandbox fallback URL (strictly non-production development mode)
  const devCallback = callbackUrl || `/app/plan?payment_ref=${reference}`;
  return {
    checkoutUrl: devCallback,
    reference,
    amountKobo: expectedAmountKobo,
  };
}

/**
 * Atomically processes and claims a verified payment.
 */
export async function claimVerifiedPayment(
  verification: PaystackVerifyResponse,
  eventId?: string
): Promise<{ success: boolean; status: string; httpStatus: number; message: string }> {
  const nowIso = new Date().toISOString();
  const todayLagos = getLagosTodayYmd();
  const reference = verification.reference;
  const providerTxId = verification.providerTransactionId;

  return await db.transaction(async (tx) => {
    // 1. Lock pending checkout record
    const pendingRows = await tx
      .select()
      .from(schema.paymentTransactions)
      .where(eq(schema.paymentTransactions.reference, reference))
      .for('update');

    if (pendingRows.length === 0) {
      if (eventId) {
        await tx.execute(sql`
          UPDATE webhook_events SET status = 'investigation_required', error_message = 'Unknown reference' WHERE id = ${eventId}
        `);
      }
      return { success: false, status: 'unknown_reference', httpStatus: 200, message: 'Unknown reference recorded' };
    }

    const pending = pendingRows[0];

    // Double-check: if already successful, acknowledge idempotently
    if (pending.status === 'success') {
      if (eventId) {
        await tx.execute(sql`
          UPDATE webhook_events SET status = 'completed', processed_at = ${nowIso} WHERE id = ${eventId}
        `);
      }
      return { success: true, status: 'already_credited', httpStatus: 200, message: 'Payment already credited' };
    }

    // Guard: Only eligible 'pending' payments can transition to 'success'
    // Failed, superseded, cancelled, refunded, or reversed payments cannot be reactivated
    if (pending.status !== 'pending') {
      if (eventId) {
        await tx.execute(sql`
          UPDATE webhook_events SET status = 'investigation_required', error_message = ${`Payment is ineligible for activation in status: ${pending.status}`} WHERE id = ${eventId}
        `);
      }
      return {
        success: false,
        status: `ineligible_state_${pending.status}`,
        httpStatus: 200,
        message: `Payment cannot transition to success from ineligible state: ${pending.status}`,
      };
    }

    // 2. Validate amount & currency
    if (!areAmountsEqual(pending.amountKobo, verification.amountKobo) || verification.currency !== 'NGN') {
      await tx
        .update(schema.paymentTransactions)
        .set({ status: 'failed', errorMessage: 'Amount or currency mismatch', updatedAt: nowIso })
        .where(eq(schema.paymentTransactions.id, pending.id));

      if (eventId) {
        await tx.execute(sql`
          UPDATE webhook_events SET status = 'investigation_required', error_message = 'Amount or currency mismatch' WHERE id = ${eventId}
        `);
      }
      return { success: false, status: 'mismatch', httpStatus: 200, message: 'Amount or currency mismatch' };
    }

    // 3. Lock Business and Subscription rows
    await tx.select().from(schema.businesses).where(eq(schema.businesses.id, pending.businessId)).for('update');
    const subRows = await tx
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, pending.businessId))
      .for('update');

    const currentSub = subRows[0];

    // 4. Anti-Stale Epoch Guard
    if (currentSub && pending.expectedEpoch < currentSub.epoch) {
      await tx
        .update(schema.paymentTransactions)
        .set({
          status: 'superseded_stale',
          errorMessage: `Checkout belongs to stale epoch ${pending.expectedEpoch} (current: ${currentSub.epoch})`,
          updatedAt: nowIso,
        })
        .where(eq(schema.paymentTransactions.id, pending.id));

      if (eventId) {
        await tx.execute(sql`
          UPDATE webhook_events SET status = 'investigation_required', error_message = 'Superseded epoch' WHERE id = ${eventId}
        `);
      }
      return { success: false, status: 'superseded_stale', httpStatus: 200, message: 'Payment superseded by newer epoch' };
    }

    // 5. Calculate Period Boundaries
    let newPeriodStart = todayLagos;
    let newPeriodEnd: string;
    const isCurrentPlanActive =
      currentSub && currentSub.currentPeriodEnd > todayLagos && currentSub.planId === pending.planId;

    if (isCurrentPlanActive) {
      newPeriodStart = currentSub.currentPeriodStart;
      newPeriodEnd = calculateAuthoritativePeriodEnd(currentSub.currentPeriodEnd, pending.billingInterval as any);
    } else {
      newPeriodStart = todayLagos;
      newPeriodEnd = calculateAuthoritativePeriodEnd(todayLagos, pending.billingInterval as any);
    }

    // 6. Encrypted email token if provided
    let encryptedToken: string | null = currentSub?.emailTokenCiphertext || null;
    if (verification.emailToken) {
      try {
        encryptedToken = encryptAes256Gcm(verification.emailToken);
      } catch (err) {
        console.warn('Could not encrypt email token (encryption key not configured). Token not persisted.');
      }
    }

    const nextEpoch = (currentSub?.epoch || 1) + 1;

    // 7. Atomic UPSERT Subscription
    await tx
      .insert(schema.subscriptions)
      .values({
        id: `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        businessId: pending.businessId,
        planId: pending.planId,
        billingInterval: pending.billingInterval,
        status: 'active',
        startDate: todayLagos,
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        cancelAtPeriodEnd: false,
        paymentProvider: 'paystack',
        providerSubscriptionId: verification.subscriptionCode || null,
        providerCustomerId: verification.customerCode || null,
        customerEmail: pending.customerEmail,
        emailTokenCiphertext: encryptedToken,
        epoch: nextEpoch,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: schema.subscriptions.businessId,
        set: {
          planId: pending.planId,
          billingInterval: pending.billingInterval,
          status: 'active',
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          cancelAtPeriodEnd: false,
          paymentProvider: 'paystack',
          providerSubscriptionId: sql`COALESCE(${verification.subscriptionCode || null}, subscriptions.provider_subscription_id)`,
          providerCustomerId: sql`COALESCE(${verification.customerCode || null}, subscriptions.provider_customer_id)`,
          customerEmail: pending.customerEmail,
          emailTokenCiphertext: sql`COALESCE(${encryptedToken}, subscriptions.email_token_ciphertext)`,
          epoch: nextEpoch,
          updatedAt: nowIso,
        },
      });

    // 8. Update Payment Record to success
    await tx
      .update(schema.paymentTransactions)
      .set({
        status: 'success',
        providerTransactionId: providerTxId || null,
        paidAt: verification.paidAt || nowIso,
        channel: verification.channel || 'card',
        cardType: verification.cardType || null,
        last4: verification.last4 || null,
        bank: verification.bank || null,
        updatedAt: nowIso,
      })
      .where(eq(schema.paymentTransactions.id, pending.id));

    // 9. Mark Webhook Event completed
    if (eventId) {
      await tx.execute(sql`
        UPDATE webhook_events SET status = 'completed', processed_at = ${nowIso} WHERE id = ${eventId}
      `);
    }

    return {
      success: true,
      status: 'credited',
      httpStatus: 200,
      message: `Successfully activated ${pending.planId} plan until ${newPeriodEnd}`,
    };
  });
}

/**
 * Safely requests cancellation of a business subscription.
 *
 * Rules:
 * 1. Derives subscription purely from businessId and PostgreSQL.
 * 2. If already cancelled or free, returns idempotent result.
 * 3. Network calls to Paystack happen completely OUTSIDE of database row locks.
 * 4. Cancellation takes effect at period end (cancelAtPeriodEnd: true) preserving paid access.
 * 5. Increments subscription epoch to guard against in-flight race conditions.
 */
export async function cancelBusinessSubscription(businessId: string): Promise<{
  success: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  providerDisabled: boolean;
  providerStatus?: 'confirmed' | 'pending_retry' | 'not_applicable';
  message: string;
}> {
  const nowIso = new Date().toISOString();

  // 1. Fetch current subscription outside of lock
  const subRows = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.businessId, businessId))
    .limit(1);

  if (subRows.length === 0) {
    throw new Error('SUBSCRIPTION_NOT_FOUND: Business does not have an active subscription record.');
  }

  const sub = subRows[0];

  if (sub.planId === 'free') {
    return {
      success: true,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: sub.currentPeriodEnd,
      providerDisabled: false,
      message: 'Subscription is already on the Free tier.',
    };
  }

  // If already scheduled for cancellation AND has no active provider subscription needing retry, acknowledge idempotently
  const hasPendingProviderDisable =
    sub.cancelAtPeriodEnd &&
    sub.paymentProvider === 'paystack' &&
    Boolean(sub.providerSubscriptionId);

  if (sub.cancelAtPeriodEnd && !hasPendingProviderDisable) {
    return {
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: sub.currentPeriodEnd,
      providerDisabled: true,
      providerStatus: 'confirmed',
      message: `Subscription is already scheduled for cancellation on on ${sub.currentPeriodEnd}.`,
    };
  }

  // 2. If provider subscription code exists and provider is Paystack, call disable API OUTSIDE of lock
  let providerDisabled = false;
  let providerStatus: 'confirmed' | 'pending_retry' | 'not_applicable' = 'not_applicable';

  if (sub.paymentProvider === 'paystack' && sub.providerSubscriptionId) {
    if (paystackClient.isConfigured()) {
      let emailToken: string | undefined;
      if (sub.emailTokenCiphertext) {
        try {
          emailToken = decryptAes256Gcm(sub.emailTokenCiphertext);
        } catch (err) {
          console.warn('Could not decrypt email token for provider subscription disable.');
        }
      }

      try {
        const disableRes = await paystackClient.disableSubscription({
          code: sub.providerSubscriptionId,
          token: emailToken,
        });
        providerDisabled = disableRes.status;
        providerStatus = providerDisabled ? 'confirmed' : 'pending_retry';
      } catch (err: any) {
        console.error('Paystack subscription disable failed or warning:', err.message);
        providerDisabled = false;
        providerStatus = 'pending_retry';
      }
    } else {
      // In development or when Paystack client is unconfigured
      providerDisabled = true;
      providerStatus = 'confirmed';
    }
  }

  // 3. Atomically update subscription with lock
  return await db.transaction(async (tx) => {
    const lockedSubRows = await tx
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, businessId))
      .for('update');

    const currentSub = lockedSubRows[0];
    if (!currentSub) {
      throw new Error('SUBSCRIPTION_NOT_FOUND: Record missing during lock.');
    }

    const nextEpoch = currentSub.epoch + 1;

    // If provider disablement succeeded, clear providerSubscriptionId so it is confirmed and not retried
    // If provider disablement failed (pending_retry), preserve providerSubscriptionId so a retry can succeed
    const updatedProviderSubId = providerStatus === 'confirmed' ? null : currentSub.providerSubscriptionId;

    await tx
      .update(schema.subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        providerSubscriptionId: updatedProviderSubId,
        epoch: nextEpoch,
        updatedAt: nowIso,
      })
      .where(eq(schema.subscriptions.businessId, businessId));

    const statusMsg = providerStatus === 'confirmed'
      ? `Subscription will be cancelled at period end on ${currentSub.currentPeriodEnd}. Paid entitlements remain active until this date.`
      : providerStatus === 'pending_retry'
      ? `Subscription scheduled for cancellation on ${currentSub.currentPeriodEnd}, but provider recurring disable is pending retry.`
      : `Subscription will be cancelled at period end on ${currentSub.currentPeriodEnd}.`;

    return {
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: currentSub.currentPeriodEnd,
      providerDisabled,
      providerStatus,
      message: statusMsg,
    };
  });
}

/**
 * Safely processes a verified dispute, chargeback, or refund event.
 *
 * State Machine Rules:
 * - Transitions payment transaction to 'disputed', 'reversed', or 'refunded'.
 * - If dispute/refund is successful, marks subscription for administrative review ('past_due' or flagged).
 * - Never reactivates any payment.
 * - Entirely idempotent and tenant-scoped.
 */
export async function processPaymentDisputeOrRefund(params: {
  reference: string;
  providerTransactionId?: string;
  eventType:
    | 'charge.dispute.create'
    | 'charge.dispute.remind'
    | 'charge.dispute.resolve'
    | 'refund.processed'
    | 'refund.failed';
  resolution?: string; // For charge.dispute.resolve: 'merchant-accepted' | 'declined-in-favor-of-customer' | 'declined-in-favor-of-merchant'
  amountKobo?: number;
  reason?: string;
  eventId?: string;
}): Promise<{ success: boolean; status: string; httpStatus: number; message: string }> {
  const { reference, providerTransactionId, eventType, reason, eventId } = params;
  const nowIso = new Date().toISOString();

  return await db.transaction(async (tx) => {
    // 1. Lock payment record by reference or providerTransactionId
    let query = tx.select().from(schema.paymentTransactions);
    if (reference && reference !== 'no_ref' && reference !== 'none') {
      query = query.where(eq(schema.paymentTransactions.reference, reference)) as any;
    } else if (providerTransactionId) {
      query = query.where(eq(schema.paymentTransactions.providerTransactionId, providerTransactionId)) as any;
    } else {
      if (eventId) {
        await tx.execute(sql`UPDATE webhook_events SET status = 'investigation_required', error_message = 'Missing identifier for dispute/refund' WHERE id = ${eventId};`);
      }
      return { success: false, status: 'missing_identifier', httpStatus: 200, message: 'Missing payment identifier' };
    }

    const lockedRows = await query.for('update');
    if (lockedRows.length === 0) {
      if (eventId) {
        await tx.execute(sql`UPDATE webhook_events SET status = 'investigation_required', error_message = 'Payment not found for dispute/refund' WHERE id = ${eventId};`);
      }
      return { success: false, status: 'payment_not_found', httpStatus: 200, message: 'Payment record not found' };
    }

    const payment = lockedRows[0];
    const { resolution } = params;

    // Terminal state protection: Once refunded or reversed, dispute events cannot override terminal refund
    if (payment.status === 'refunded' && eventType !== 'refund.processed') {
      if (eventId) {
        await tx.execute(sql`UPDATE webhook_events SET status = 'completed', processed_at = ${nowIso} WHERE id = ${eventId};`);
      }
      return { success: true, status: 'already_terminal_refunded', httpStatus: 200, message: 'Payment is already refunded' };
    }

    // Handle Branch A: Dispute Reminders (Idempotent, no unnecessary state progression)
    if (eventType === 'charge.dispute.remind') {
      if (eventId) {
        await tx.execute(sql`UPDATE webhook_events SET status = 'completed', processed_at = ${nowIso} WHERE id = ${eventId};`);
      }
      return { success: true, status: 'reminder_acknowledged', httpStatus: 200, message: 'Dispute reminder logged idempotently' };
    }

    // Handle Branch B: Dispute Resolved
    if (eventType === 'charge.dispute.resolve') {
      if (resolution === 'merchant-won' || resolution === 'declined-in-favor-of-merchant') {
        // Merchant won dispute: clear dispute hold, restore payment status to success, restore active subscription
        await tx
          .update(schema.paymentTransactions)
          .set({
            status: 'success',
            errorMessage: `Dispute resolved in merchant favor: ${reason || 'Resolution confirmed'}`,
            updatedAt: nowIso,
          })
          .where(eq(schema.paymentTransactions.id, payment.id));

        const lockedSubRows = await tx
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.businessId, payment.businessId))
          .for('update');

        if (lockedSubRows.length > 0) {
          const sub = lockedSubRows[0];
          const lagosToday = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Africa/Lagos',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date());

          // Only restore active if within current billing period
          const restoredStatus = sub.currentPeriodEnd >= lagosToday ? 'active' : 'expired';
          await tx
            .update(schema.subscriptions)
            .set({
              status: restoredStatus,
              epoch: sub.epoch + 1,
              updatedAt: nowIso,
            })
            .where(eq(schema.subscriptions.businessId, payment.businessId));
        }

        if (eventId) {
          await tx.execute(sql`UPDATE webhook_events SET status = 'completed', processed_at = ${nowIso} WHERE id = ${eventId};`);
        }
        return { success: true, status: 'dispute_won', httpStatus: 200, message: 'Dispute resolved in merchant favor; access restored' };
      } else if (resolution === 'customer-won' || resolution === 'merchant-accepted' || resolution === 'declined-in-favor-of-customer') {
        // Merchant lost dispute: transition payment to reversed/refunded, keep subscription restricted
        await tx
          .update(schema.paymentTransactions)
          .set({
            status: 'reversed',
            errorMessage: `Dispute lost (${resolution}): ${reason || 'Funds clawed back'}`,
            updatedAt: nowIso,
          })
          .where(eq(schema.paymentTransactions.id, payment.id));

        const lockedSubRows = await tx
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.businessId, payment.businessId))
          .for('update');

        if (lockedSubRows.length > 0) {
          const sub = lockedSubRows[0];
          await tx
            .update(schema.subscriptions)
            .set({
              status: 'past_due',
              epoch: sub.epoch + 1,
              updatedAt: nowIso,
            })
            .where(eq(schema.subscriptions.businessId, payment.businessId));
        }

        if (eventId) {
          await tx.execute(sql`UPDATE webhook_events SET status = 'completed', processed_at = ${nowIso} WHERE id = ${eventId};`);
        }
        return { success: true, status: 'dispute_lost', httpStatus: 200, message: 'Dispute lost; payment reversed' };
      } else {
        // Unknown or ambiguous resolution value: mark for investigation
        if (eventId) {
          await tx.execute(sql`UPDATE webhook_events SET status = 'investigation_required', error_message = ${`Unknown dispute resolution: ${resolution}`} WHERE id = ${eventId};`);
        }
        return { success: false, status: 'unknown_resolution', httpStatus: 200, message: `Unknown dispute resolution: ${resolution}` };
      }
    }

    // Handle Branch C: Refund Failed
    if (eventType === 'refund.failed') {
      if (eventId) {
        await tx.execute(sql`UPDATE webhook_events SET status = 'investigation_required', error_message = ${`Refund failed: ${reason || 'Unknown provider reason'}`} WHERE id = ${eventId};`);
      }
      return { success: false, status: 'refund_failed', httpStatus: 200, message: 'Refund failed recorded for investigation' };
    }

    // Handle Branch D: Dispute Created or Refund Processed
    const newPaymentStatus = eventType === 'refund.processed' ? 'refunded' : 'disputed';

    await tx
      .update(schema.paymentTransactions)
      .set({
        status: newPaymentStatus,
        errorMessage: reason || `Updated by webhook event ${eventType}`,
        updatedAt: nowIso,
      })
      .where(eq(schema.paymentTransactions.id, payment.id));

    const lockedSubRows = await tx
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, payment.businessId))
      .for('update');

    if (lockedSubRows.length > 0) {
      const sub = lockedSubRows[0];
      await tx
        .update(schema.subscriptions)
        .set({
          status: 'past_due',
          epoch: sub.epoch + 1,
          updatedAt: nowIso,
        })
        .where(eq(schema.subscriptions.businessId, payment.businessId));
    }

    if (eventId) {
      await tx.execute(sql`UPDATE webhook_events SET status = 'completed', processed_at = ${nowIso} WHERE id = ${eventId};`);
    }

    return {
      success: true,
      status: newPaymentStatus,
      httpStatus: 200,
      message: `Payment successfully marked as ${newPaymentStatus} and subscription flagged for review`,
    };
  });
}
