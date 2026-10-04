export type UserRole = 'owner' | 'manager' | 'staff';

export type Permission =
  // Sales
  | 'view_sales'
  | 'create_sale'
  | 'edit_sale'
  | 'delete_sale'
  | 'refund_sale'
  // Expenses
  | 'view_expenses'
  | 'create_expense'
  | 'edit_expense'
  | 'delete_expense'
  // Customers
  | 'view_customers'
  | 'create_customer'
  | 'edit_customer'
  | 'delete_customer'
  // Products / Catalog
  | 'view_catalog'
  | 'create_product'
  | 'edit_product'
  | 'delete_product'
  // Financial
  | 'view_profit'
  | 'view_debts'
  | 'view_payables'
  | 'view_reports'
  | 'export_financial_data'
  // Settings
  | 'manage_business'
  | 'manage_users'
  | 'manage_permissions'
  | 'manage_categories'
  | 'manage_recurring_expenses'
  // Audit
  | 'view_audit_log';

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  permissions?: Permission[];
}

export interface Business {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  currencySymbol: string;
  taxRate: number; // e.g. 7.5 for VAT
  enableTax: boolean;
  logoUrl?: string;
  // Bank details for debt reminders & invoices
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  paymentInstructions?: string;
  includeBankDetailsInReminders?: boolean;
  // Monotonically increasing sequence for unique invoice generation
  lastInvoiceSequence?: number;
  createdAt: string;
  updatedAt: string;
}

export type ReceiptFormat = '58mm' | '80mm' | 'a4';

export type ProductType = 'product' | 'service';

export interface ProductService {
  id: string;
  businessId: string;
  name: string;
  type: ProductType;
  sellingPrice: number;
  costPrice: number;
  sku?: string;
  category: string;
  description?: string;
  openingStock?: number;
  currentStock?: number;
  minStockLevel?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  type: ProductType;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number; // in currency amount
  total: number;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'POS' | 'Card' | 'Mobile Payment' | 'Other';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface Sale {
  id: string;
  businessId: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  recordedByUserId: string;
  recordedByUserName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  vendorName: string;
  referenceNumber?: string;
  notes?: string;
  recordedByUserId: string;
  recordedByUserName: string;
  recurringExpenseId?: string; // Links back to recurring template if auto/batch generated
  occurrenceKey?: string; // e.g. "REC-001-2026-10-01" for strict duplicate protection
  createdAt: string;
  updatedAt: string;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringExpenseStatus = 'active' | 'paused' | 'completed';

export interface RecurringExpense {
  id: string;
  businessId: string;
  description: string;
  category: string;
  amount: number;
  vendorName: string;
  paymentMethod: PaymentMethod;
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (optional)
  status: RecurringExpenseStatus;
  notes?: string;
  lastGeneratedDate?: string;
  generatedExpenseIds: string[];
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByUserName: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingDebt: number;
  createdAt: string;
  updatedAt: string;
}

export type PayableStatus = 'unpaid' | 'partial' | 'paid';

export interface Payable {
  id: string;
  businessId: string;
  vendorName: string;
  vendorPhone?: string;
  description: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate?: string;
  status: PayableStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  businessId: string;
  targetType: 'customer' | 'payable';
  targetId: string;
  targetName: string;
  saleId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  date: string;
  time: string;
  notes?: string;
  recordedByUserId: string;
  recordedByUserName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'create' | 'update' | 'delete' | 'payment_collected' | 'debt_settled' | 'print_receipt' | 'generate_reminder' | 'update_permissions';
  entityType: 'sale' | 'expense' | 'customer' | 'payable' | 'product' | 'settings' | 'user';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface FinancialMetrics {
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  todayCashCollected: number;
  monthSales: number;
  monthExpenses: number;
  monthProfit: number;
  monthCashCollected: number;
  totalReceivables: number; // money customers owe us
  totalPayables: number; // money we owe suppliers
  totalCogs: number;
  grossProfit: number;
  netProfit: number;
}
