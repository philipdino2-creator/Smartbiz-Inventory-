import { PlanId, BillingInterval, BusinessSubscription } from '../types/subscription.ts';

export interface CheckoutSessionRequest {
  businessId: string;
  planId: PlanId;
  interval: BillingInterval;
  customerEmail: string;
  customerName: string;
  callbackUrl?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  reference: string;
  amountKobo: number;
  currency: 'NGN';
}

export interface WebhookEventPayload {
  event: string;
  data: {
    reference: string;
    amount: number; // in kobo
    currency: string;
    customer: {
      email: string;
      customer_code?: string;
    };
    metadata?: {
      businessId: string;
      planId: PlanId;
      interval: BillingInterval;
    };
    channel?: string;
    paid_at?: string;
  };
}

export interface PaymentVerificationResult {
  verified: boolean;
  reference: string;
  amountKobo: number;
  currency: string;
  businessId?: string;
  planId?: PlanId;
  interval?: BillingInterval;
  errorMessage?: string;
}

/**
 * Server-side payment provider interface for future Paystack / Flutterwave integration.
 * Ensures clean separation of concerns and guarantees that no paid subscription
 * can ever be activated without cryptographic server-side signature verification.
 */
export interface PaymentProvider {
  readonly providerName: 'none' | 'paystack' | 'flutterwave';
  readonly isConfigured: boolean;

  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResult>;

  verifyTransaction(reference: string): Promise<PaymentVerificationResult>;

  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean;

  handleWebhookEvent(event: WebhookEventPayload): Promise<{
    handled: boolean;
    duplicate: boolean;
    subscription?: BusinessSubscription;
  }>;
}

/**
 * Null/Stub Payment Provider used while payment gateway integration is being finalized.
 * Explicitly rejects transactions and prevents client-side activation of paid tiers.
 */
export class UnconfiguredPaymentProvider implements PaymentProvider {
  readonly providerName = 'none';
  readonly isConfigured = false;

  async createCheckoutSession(_request: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    throw new Error(
      'Payment Gateway Integration in Progress: Automated online checkout is currently being finalized for Nigerian payment gateways (Paystack / Flutterwave). Direct card charging is not yet enabled.'
    );
  }

  async verifyTransaction(_reference: string): Promise<PaymentVerificationResult> {
    return {
      verified: false,
      reference: _reference,
      amountKobo: 0,
      currency: 'NGN',
      errorMessage: 'No active payment provider configured on server.',
    };
  }

  verifyWebhookSignature(_rawBody: string | Buffer, _signatureHeader: string): boolean {
    return false;
  }

  async handleWebhookEvent(_event: WebhookEventPayload): Promise<{
    handled: boolean;
    duplicate: boolean;
  }> {
    return { handled: false, duplicate: false };
  }
}

export const activePaymentProvider: PaymentProvider = new UnconfiguredPaymentProvider();
