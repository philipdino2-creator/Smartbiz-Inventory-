-- Migration: 0000_paystack_foundation.sql
-- Description: Foundation schema for Paystack subscription billing, transaction audit ledger, and webhook idempotency

-- 1. Alter subscriptions table to add epoch, customer_email, and email_token_ciphertext
ALTER TABLE "subscriptions" 
    ADD COLUMN IF NOT EXISTS "epoch" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "customer_email" TEXT,
    ADD COLUMN IF NOT EXISTS "email_token_ciphertext" TEXT;

-- 2. Create payment_transactions table
CREATE TABLE IF NOT EXISTS "payment_transactions" (
    "id" TEXT PRIMARY KEY,
    "business_id" TEXT NOT NULL REFERENCES "businesses"("id") ON DELETE RESTRICT,
    "subscription_id" TEXT REFERENCES "subscriptions"("id") ON DELETE RESTRICT,
    "reference" TEXT NOT NULL UNIQUE,
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "provider_transaction_id" TEXT,
    "plan_id" TEXT NOT NULL,
    "billing_interval" TEXT NOT NULL,
    "amount_kobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expected_epoch" INTEGER NOT NULL DEFAULT 1,
    "channel" TEXT,
    "customer_email" TEXT NOT NULL,
    "subscription_code" TEXT,
    "paid_at" TEXT,
    "card_type" TEXT,
    "last4" TEXT,
    "bank" TEXT,
    "error_message" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_transactions_business_idx" ON "payment_transactions" ("business_id");
CREATE INDEX IF NOT EXISTS "payment_transactions_status_idx" ON "payment_transactions" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_provider_tx_idx" 
    ON "payment_transactions" ("provider", "provider_transaction_id") 
    WHERE "provider_transaction_id" IS NOT NULL;

-- 3. Create webhook_events table
CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" TEXT PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "claim_token" TEXT,
    "first_received_at" TEXT NOT NULL,
    "processed_at" TEXT,
    "error_message" TEXT
);

CREATE INDEX IF NOT EXISTS "webhook_events_reference_idx" ON "webhook_events" ("reference");
CREATE INDEX IF NOT EXISTS "webhook_events_status_idx" ON "webhook_events" ("status");
