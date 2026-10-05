import { User, UserRole, Permission } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
  // Sales
  'view_sales',
  'create_sale',
  'edit_sale',
  'delete_sale',
  'refund_sale',
  // Expenses
  'view_expenses',
  'create_expense',
  'edit_expense',
  'delete_expense',
  // Customers
  'view_customers',
  'create_customer',
  'edit_customer',
  'delete_customer',
  // Products / Catalog
  'view_catalog',
  'create_product',
  'edit_product',
  'delete_product',
  // Financial
  'view_profit',
  'view_debts',
  'view_payables',
  'view_reports',
  'export_financial_data',
  // Settings
  'manage_business',
  'manage_users',
  'manage_permissions',
  'manage_categories',
  'manage_recurring_expenses',
  // Daily Reconciliation
  'view_reconciliation',
  'manage_reconciliation',
  // Audit
  'view_audit_log',
];

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'sales',
    name: 'Sales & Invoicing',
    description: 'Create and manage sales, invoices, and customer receipts',
    permissions: ['view_sales', 'create_sale', 'edit_sale', 'delete_sale', 'refund_sale'],
  },
  {
    id: 'expenses',
    name: 'Expenses & Overhead',
    description: 'Track daily running costs, operational spending, and vendor purchases',
    permissions: ['view_expenses', 'create_expense', 'edit_expense', 'delete_expense'],
  },
  {
    id: 'customers',
    name: 'Customers & Students',
    description: 'Manage student/customer directory, credit profiles, and contact details',
    permissions: ['view_customers', 'create_customer', 'edit_customer', 'delete_customer'],
  },
  {
    id: 'catalog',
    name: 'Courses & Catalog',
    description: 'Manage training courses, tuition prices, and equipment inventory',
    permissions: ['view_catalog', 'create_product', 'edit_product', 'delete_product'],
  },
  {
    id: 'financial',
    name: 'Financial & Reports',
    description: 'Sensitive profit & loss metrics, customer debts, and ledger exports',
    permissions: ['view_profit', 'view_debts', 'view_payables', 'view_reports', 'export_financial_data'],
  },
  {
    id: 'settings',
    name: 'Business Settings & Users',
    description: 'Company information, team members, recurring schedules, and categories',
    permissions: [
      'manage_business',
      'manage_users',
      'manage_permissions',
      'manage_categories',
      'manage_recurring_expenses',
    ],
  },
  {
    id: 'reconciliation',
    name: 'Daily Business Reconciliation',
    description: 'Cash drawer float, end-of-day register closing, and variance reporting',
    permissions: ['view_reconciliation', 'manage_reconciliation'],
  },
  {
    id: 'audit',
    name: 'Security & Audit Log',
    description: 'View chronological audit trail of all financial and system actions',
    permissions: ['view_audit_log'],
  },
];

export const PERMISSION_LABELS: Record<Permission, { label: string; description: string }> = {
  // Sales
  view_sales: { label: 'View Sales', description: 'Browse recorded sales and receipts' },
  create_sale: { label: 'Record Sale', description: 'Create new invoices and print receipts' },
  edit_sale: { label: 'Edit Sale', description: 'Modify recorded transaction details' },
  delete_sale: { label: 'Delete Sale', description: 'Permanently remove recorded sales' },
  refund_sale: { label: 'Issue Refund', description: 'Process customer transaction reversals' },

  // Expenses
  view_expenses: { label: 'View Expenses', description: 'View operational costs and vouchers' },
  create_expense: { label: 'Record Expense', description: 'Log generator fuel, rent, and overhead' },
  edit_expense: { label: 'Edit Expense', description: 'Update expense vouchers and payees' },
  delete_expense: { label: 'Delete Expense', description: 'Remove expense records from ledger' },

  // Customers
  view_customers: { label: 'View Customers', description: 'Access customer and student list' },
  create_customer: { label: 'Create Customer', description: 'Register new customers or students' },
  edit_customer: { label: 'Edit Customer', description: 'Update customer contact info and notes' },
  delete_customer: { label: 'Delete Customer', description: 'Remove customer accounts' },

  // Catalog
  view_catalog: { label: 'View Catalog', description: 'Browse courses, services, and inventory' },
  create_product: { label: 'Add Item', description: 'Create new training course or product' },
  edit_product: { label: 'Edit Item', description: 'Modify course pricing and details' },
  delete_product: { label: 'Delete Item', description: 'Archive or remove catalog items' },

  // Financial
  view_profit: { label: 'View Profit / P&L', description: 'Access net profit, margins, and COGS' },
  view_debts: { label: 'View Debtors', description: 'View customer accounts with outstanding debt' },
  view_payables: { label: 'View Payables', description: 'View supplier credit and liabilities' },
  view_reports: { label: 'View Reports', description: 'Access financial summaries and charts' },
  export_financial_data: { label: 'Export Financial Data', description: 'Download CSV, Excel, and PDF reports' },

  // Settings
  manage_business: { label: 'Manage Business', description: 'Modify company profile and tax rates' },
  manage_users: { label: 'Manage Users', description: 'Add, activate, or deactivate staff' },
  manage_permissions: { label: 'Manage Permissions', description: 'Configure granular user permissions' },
  manage_categories: { label: 'Manage Categories', description: 'Create and edit expense categories' },
  manage_recurring_expenses: { label: 'Manage Recurring', description: 'Configure recurring expense schedules' },

  // Daily Reconciliation
  view_reconciliation: { label: 'View Register & Balancing', description: 'Inspect daily cash drawer status and closing history' },
  manage_reconciliation: { label: 'Manage Day Closing', description: 'Open business days, count till cash, and close reconciliation' },

  // Audit
  view_audit_log: { label: 'View Audit Log', description: 'Inspect immutable system event history' },
};

/**
 * Default permission sets by role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Owner: Full uninhibited access
  owner: [...ALL_PERMISSIONS],

  // Manager: High operational & financial access, cannot manage business core or permissions
  manager: [
    'view_sales',
    'create_sale',
    'edit_sale',
    'delete_sale',
    'refund_sale',
    'view_expenses',
    'create_expense',
    'edit_expense',
    'delete_expense',
    'view_customers',
    'create_customer',
    'edit_customer',
    'delete_customer',
    'view_catalog',
    'create_product',
    'edit_product',
    'delete_product',
    'view_profit',
    'view_debts',
    'view_payables',
    'view_reports',
    'export_financial_data',
    'manage_categories',
    'manage_recurring_expenses',
    'view_reconciliation',
    'manage_reconciliation',
    'view_audit_log',
  ],

  // Staff: Front-desk operational only
  staff: [
    'view_sales',
    'create_sale',
    'view_customers',
    'create_customer',
    'view_catalog',
    'create_product',
    'edit_product',
    'delete_product',
  ],
};

/**
 * Get effective permissions for a user, respecting custom overrides or defaults
 */
export function getUserPermissions(user: User): Permission[] {
  // If user is owner, they always possess all permissions
  if (user.role === 'owner') {
    return [...ALL_PERMISSIONS];
  }

  // If user has customized permissions, return them
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }

  // Fallback to role defaults
  return DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.staff;
}

/**
 * Check whether a user has a specific permission
 */
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user || !user.active) return false;
  if (user.role === 'owner') return true;

  const permissions = getUserPermissions(user);
  return permissions.includes(permission);
}

/**
 * Owner Protection:
 * Prevent business with zero owners, deleting the final owner,
 * or demoting the final owner to manager or staff.
 */
export function validateOwnerProtection(
  allUsers: User[],
  targetUserId: string,
  action: 'delete' | 'change_role' | 'deactivate' | 'modify_permissions',
  newRole?: UserRole
): { allowed: boolean; reason?: string } {
  const activeOwners = allUsers.filter(u => u.role === 'owner' && u.active);
  const targetUser = allUsers.find(u => u.id === targetUserId);

  if (!targetUser) {
    return { allowed: false, reason: 'Target user not found.' };
  }

  const isTargetOwner = targetUser.role === 'owner';

  if (isTargetOwner && activeOwners.length <= 1) {
    if (action === 'delete') {
      return {
        allowed: false,
        reason: 'Protected: Cannot delete the only Business Owner. Designate another owner first.',
      };
    }
    if (action === 'deactivate') {
      return {
        allowed: false,
        reason: 'Protected: Cannot deactivate the only Business Owner account.',
      };
    }
    if (action === 'change_role' && newRole && newRole !== 'owner') {
      return {
        allowed: false,
        reason: 'Protected: Cannot downgrade the only Business Owner. Designate another owner before changing role.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Generate a quick summary of user permissions for the team table
 * e.g. "Sales ✓ · Customers ✓ · Catalog ✓ · Reports ✕"
 */
export function getPermissionSummary(user: User): {
  hasSales: boolean;
  hasExpenses: boolean;
  hasCustomers: boolean;
  hasCatalog: boolean;
  hasReports: boolean;
  hasSettings: boolean;
} {
  const perms = getUserPermissions(user);
  return {
    hasSales: perms.includes('create_sale') || perms.includes('view_sales'),
    hasExpenses: perms.includes('create_expense') || perms.includes('view_expenses'),
    hasCustomers: perms.includes('create_customer') || perms.includes('view_customers'),
    hasCatalog: perms.includes('create_product') || perms.includes('view_catalog'),
    hasReports: perms.includes('view_reports') || perms.includes('view_profit'),
    hasSettings: perms.includes('manage_business') || perms.includes('manage_permissions'),
  };
}
