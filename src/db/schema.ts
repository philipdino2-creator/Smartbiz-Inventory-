import { pgTable, text, integer, numeric, boolean, timestamp, json, doublePrecision, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. BUSINESSES
export const businesses = pgTable('businesses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  website: text('website'),
  logoUrl: text('logo_url'),
  currency: text('currency').notNull().default('NGN'),
  currencySymbol: text('currency_symbol').notNull().default('₦'),
  taxRate: doublePrecision('tax_rate').notNull().default(7.5),
  enableTax: boolean('enable_tax').notNull().default(true),
  bankName: text('bank_name'),
  bankAccountName: text('bank_account_name'),
  bankAccountNumber: text('bank_account_number'),
  includeBankOnReceipts: boolean('include_bank_on_receipts').notNull().default(true),
  lastInvoiceSequence: integer('last_invoice_sequence').notNull().default(105),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2. USERS
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  uid: text('uid').unique(), // Firebase Auth UID or system ID
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull(), // 'owner' | 'manager' | 'staff'
  active: boolean('active').notNull().default(true),
  permissions: json('permissions').$type<string[]>(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('users_business_id_idx').on(table.businessId),
]);

// 3. CUSTOMERS
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  totalPurchases: numeric('total_purchases', { precision: 14, scale: 2 }).notNull().default('0.00'),
  totalPaid: numeric('total_paid', { precision: 14, scale: 2 }).notNull().default('0.00'),
  outstandingDebt: numeric('outstanding_debt', { precision: 14, scale: 2 }).notNull().default('0.00'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('customers_business_name_idx').on(table.businessId, table.name),
]);

// 4. PRODUCTS & SERVICES
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'product' | 'service'
  sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  sku: text('sku'),
  category: text('category').notNull(),
  description: text('description'),
  openingStock: integer('opening_stock').default(0),
  currentStock: integer('current_stock').default(0),
  minStockLevel: integer('min_stock_level').default(0),
  active: boolean('active').notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('products_business_active_idx').on(table.businessId, table.active),
]);

// 5. SALES
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:mm
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0.00'),
  discount: numeric('discount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull(), // 'paid' | 'partial' | 'unpaid'
  amountPaid: numeric('amount_paid', { precision: 14, scale: 2 }).notNull().default('0.00'),
  balanceDue: numeric('balance_due', { precision: 14, scale: 2 }).notNull().default('0.00'),
  notes: text('notes'),
  recordedByUserId: text('recorded_by_user_id').notNull(),
  recordedByUserName: text('recorded_by_user_name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('sales_business_date_time_idx').on(table.businessId, table.date.desc(), table.time.desc()),
]);

// 6. SALE ITEMS
export const saleItems = pgTable('sale_items', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').references(() => sales.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  discount: numeric('discount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  total: numeric('total', { precision: 14, scale: 2 }).notNull().default('0.00'),
}, (table) => [
  index('sale_items_sale_id_idx').on(table.saleId),
]);

// 7. EXPENSES
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:mm
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  paymentMethod: text('payment_method').notNull(),
  vendorName: text('vendor_name').notNull(),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  recordedByUserId: text('recorded_by_user_id').notNull(),
  recordedByUserName: text('recorded_by_user_name').notNull(),
  recurringExpenseId: text('recurring_expense_id'),
  occurrenceKey: text('occurrence_key'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('expenses_business_date_idx').on(table.businessId, table.date.desc()),
]);

// 8. PAYABLES (SUPPLIERS)
export const payables = pgTable('payables', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  vendorName: text('vendor_name').notNull(),
  description: text('description').notNull(),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  amountPaid: numeric('amount_paid', { precision: 14, scale: 2 }).notNull().default('0.00'),
  balanceDue: numeric('balance_due', { precision: 14, scale: 2 }).notNull().default('0.00'),
  dueDate: text('due_date'),
  status: text('status').notNull(), // 'paid' | 'partial' | 'unpaid'
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 9. DEBT PAYMENTS
export const debtPayments = pgTable('debt_payments', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  targetType: text('target_type').notNull(), // 'customer' | 'payable'
  targetId: text('target_id').notNull(),
  targetName: text('target_name').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  date: text('date').notNull(),
  time: text('time').notNull(),
  paymentMethod: text('payment_method').notNull(),
  reference: text('reference'),
  notes: text('notes'),
  recordedByUserId: text('recorded_by_user_id').notNull(),
  recordedByUserName: text('recorded_by_user_name').notNull(),
  createdAt: text('created_at').notNull(),
});

// 10. EXPENSE CATEGORIES
export const expenseCategories = pgTable('expense_categories', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

// 11. RECURRING EXPENSES
export const recurringExpenses = pgTable('recurring_expenses', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  frequency: text('frequency').notNull(),
  paymentMethod: text('payment_method').notNull(),
  vendorName: text('vendor_name').notNull(),
  nextDueDate: text('next_due_date').notNull(),
  status: text('status').notNull().default('active'),
  autoRecord: boolean('auto_record').notNull().default(false),
  notes: text('notes'),
  lastGeneratedDate: text('last_generated_date'),
  generatedExpenseIds: json('generated_expense_ids').$type<string[]>().default([]),
  createdByUserId: text('created_by_user_id').notNull(),
  createdByUserName: text('created_by_user_name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 12. DAILY RECONCILIATIONS
export const dailyReconciliations = pgTable('daily_reconciliations', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at'),
  openedByUserId: text('opened_by_user_id').notNull(),
  openedByUserName: text('opened_by_user_name').notNull(),
  closedByUserId: text('closed_by_user_id'),
  closedByUserName: text('closed_by_user_name'),
  status: text('status').notNull().default('open'), // 'open' | 'closed' | 'adjusted'
  openingFloat: numeric('opening_float', { precision: 14, scale: 2 }).notNull().default('0.00'),
  systemCashSales: numeric('system_cash_sales', { precision: 14, scale: 2 }).notNull().default('0.00'),
  systemPosSales: numeric('system_pos_sales', { precision: 14, scale: 2 }).notNull().default('0.00'),
  systemTransferSales: numeric('system_transfer_sales', { precision: 14, scale: 2 }).notNull().default('0.00'),
  systemDebtCashCollected: numeric('system_debt_cash_collected', { precision: 14, scale: 2 }).notNull().default('0.00'),
  systemCashExpenses: numeric('system_cash_expenses', { precision: 14, scale: 2 }).notNull().default('0.00'),
  cashDrop: numeric('cash_drop', { precision: 14, scale: 2 }).notNull().default('0.00'),
  expectedCashInHand: numeric('expected_cash_in_hand', { precision: 14, scale: 2 }).notNull().default('0.00'),
  actualCashCounted: numeric('actual_cash_counted', { precision: 14, scale: 2 }).notNull().default('0.00'),
  actualPosSettlement: numeric('actual_pos_settlement', { precision: 14, scale: 2 }).notNull().default('0.00'),
  actualTransferSettlement: numeric('actual_transfer_settlement', { precision: 14, scale: 2 }).notNull().default('0.00'),
  cashVariance: numeric('cash_variance', { precision: 14, scale: 2 }).notNull().default('0.00'),
  varianceReason: text('variance_reason'),
  reconciliationNotes: text('reconciliation_notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  uniqueIndex('daily_reconciliations_business_date_unique').on(table.businessId, table.date),
]);

// 13. AUDIT LOGS
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id).notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  details: text('details').notNull(),
  metadata: json('metadata'),
  timestamp: text('timestamp').notNull(),
}, (table) => [
  index('audit_logs_business_timestamp_idx').on(table.businessId, table.timestamp.desc()),
]);

// 14. SESSIONS (Persistent Authentication Sessions)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_expires_at_idx').on(table.expiresAt),
]);

// RELATIONS
export const businessesRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  products: many(products),
  sales: many(sales),
  expenses: many(expenses),
  payables: many(payables),
  debtPayments: many(debtPayments),
  expenseCategories: many(expenseCategories),
  recurringExpenses: many(recurringExpenses),
  dailyReconciliations: many(dailyReconciliations),
  auditLogs: many(auditLogs),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [sessions.businessId],
    references: [businesses.id],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  business: one(businesses, {
    fields: [sales.businessId],
    references: [businesses.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
}));
