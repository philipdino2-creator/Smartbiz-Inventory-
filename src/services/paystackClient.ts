import crypto from 'crypto';
import { PlanId, BillingInterval } from '../types/subscription.ts';
import { PLANS } from '../config/plans.ts';

export interface PaystackInitializeRequest {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  planCode?: string;
  metadata?: {
    businessId: string;
    planId: PlanId;
    billingInterval: BillingInterval;
    userId: string;
    expectedEpoch: number;
  };
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  verified: boolean;
  status: 'success' | 'failed' | 'pending' | 'abandoned';
  reference: string;
  providerTransactionId: string;
  amountKobo: number;
  currency: string;
  customerEmail: string;
  customerCode?: string;
  subscriptionCode?: string;
  emailToken?: string;
  channel?: string;
  cardType?: string;
  last4?: string;
  bank?: string;
  paidAt?: string;
  metadata?: {
    businessId?: string;
    planId?: PlanId;
    billingInterval?: BillingInterval;
    expectedEpoch?: number;
  };
}

/**
 * Paystack HTTP API Client with support for mock injection in tests.
 */
export class PaystackClient {
  private explicitSecretKey?: string;

  constructor(secretKey?: string) {
    this.explicitSecretKey = secretKey;
  }

  public getSecretKey(): string {
    return this.explicitSecretKey || process.env.PAYSTACK_SECRET_KEY || '';
  }

  public isConfigured(): boolean {
    const key = this.getSecretKey();
    return Boolean(key && key.startsWith('sk_'));
  }

  /**
   * Constant-time HMAC-SHA512 webhook signature verification.
   */
  public verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
    const key = this.getSecretKey();
    if (!key || !signatureHeader) return false;
    try {
      if (signatureHeader.length !== 128 || !/^[0-9a-fA-F]+$/.test(signatureHeader)) {
        return false;
      }
      const hash = crypto
        .createHmac('sha512', key)
        .update(rawBody)
        .digest('hex');

      const expectedBuf = Buffer.from(hash, 'utf8');
      const signatureBuf = Buffer.from(signatureHeader, 'utf8');

      if (expectedBuf.length !== signatureBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, signatureBuf);
    } catch {
      return false;
    }
  }

  /**
   * Initializes a transaction with Paystack.
   */
  public async initializeTransaction(request: PaystackInitializeRequest): Promise<PaystackInitializeResponse> {
    if (!this.isConfigured()) {
      throw new Error('PAYSTACK_NOT_CONFIGURED: Paystack secret key is missing or unconfigured.');
    }

    const payload: any = {
      email: request.email,
      amount: request.amountKobo,
      currency: 'NGN',
      reference: request.reference,
      callback_url: request.callbackUrl,
      metadata: request.metadata,
    };

    if (request.planCode) {
      payload.plan = request.planCode;
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`PAYSTACK_INITIALIZE_FAILED: HTTP ${res.status} - ${errorBody}`);
    }

    return (await res.json()) as PaystackInitializeResponse;
  }

  /**
   * Verifies a transaction authoritatively with Paystack server.
   */
  public async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (!this.isConfigured()) {
      throw new Error('PAYSTACK_NOT_CONFIGURED: Paystack secret key is missing or unconfigured.');
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getSecretKey()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`PAYSTACK_VERIFY_TRANSIENT_ERROR: HTTP ${res.status}`);
      }
      return {
        verified: false,
        status: 'failed',
        reference,
        providerTransactionId: '',
        amountKobo: 0,
        currency: 'NGN',
        customerEmail: '',
      };
    }

    const body = await res.json();
    const data = body.data;

    return {
      verified: body.status === true && data.status === 'success',
      status: data.status,
      reference: data.reference,
      providerTransactionId: String(data.id),
      amountKobo: Number(data.amount) || 0,
      currency: data.currency || 'NGN',
      customerEmail: data.customer?.email || '',
      customerCode: data.customer?.customer_code,
      subscriptionCode: data.subscription?.subscription_code || data.plan_object?.plan_code,
      emailToken: data.subscription?.email_token,
      channel: data.channel,
      cardType: data.authorization?.card_type,
      last4: data.authorization?.last4,
      bank: data.authorization?.bank,
      paidAt: data.paid_at,
      metadata: data.metadata,
    };
  }
  /**
   * Disables/cancels a subscription on Paystack.
   * Paystack endpoint: POST https://api.paystack.co/subscription/disable
   * Body: { code: subscription_code, token: email_token }
   */
  public async disableSubscription(params: {
    code: string;
    token?: string;
  }): Promise<{ status: boolean; message: string }> {
    if (!this.isConfigured()) {
      throw new Error('PAYSTACK_NOT_CONFIGURED: Paystack secret key is missing or unconfigured.');
    }
    const payload: Record<string, string> = {
      code: params.code,
    };
    if (params.token) {
      payload.token = params.token;
    }
    const res = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`PAYSTACK_DISABLE_TRANSIENT_ERROR: HTTP ${res.status}`);
      }
      const errText = await res.text();
      throw new Error(`PAYSTACK_DISABLE_FAILED: HTTP ${res.status} - ${errText}`);
    }
    const body = await res.json();
    return {
      status: body.status === true,
      message: body.message || 'Subscription disabled successfully',
    };
  }
}

export const paystackClient = new PaystackClient();
