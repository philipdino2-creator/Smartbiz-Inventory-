import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Business,
  User,
  UserRole,
  Permission,
  Customer,
  ProductService,
  Sale,
  Expense,
  Payable,
  AuditLog,
  DebtPayment,
  PaymentMethod,
  RecurringExpense,
  ReceiptFormat,
} from '../types';
import {
  INITIAL_BUSINESS,
  INITIAL_USERS,
  INITIAL_PRODUCTS_SERVICES,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_PAYABLES,
  INITIAL_AUDIT_LOGS,
  DEFAULT_EXPENSE_CATEGORIES,
  INITIAL_RECURRING_EXPENSES,
} from '../data/initialData';
import {
  calculateFinancialMetrics,
  calculateSaleTotals,
  getTodayDateString,
  getCurrentTimeString,
  calculateNextDueDate,
  getOccurrenceKey,
} from '../utils/calculations';
import {
  hasPermission as checkPermission,
  getUserPermissions,
  validateOwnerProtection,
  DEFAULT_ROLE_PERMISSIONS,
} from '../utils/permissionUtils';

interface BusinessContextType {
  business: Business;
  updateBusiness: (updated: Partial<Business>) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'businessId'>) => { success: boolean; user?: User; message?: string };
  updateUser: (id: string, updated: Partial<User>) => void;
  updateUserPermissions: (id: string, permissions: Permission[]) => { success: boolean; message?: string };
  changeUserRole: (id: string, newRole: UserRole) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };
  hasPermission: (permission: Permission) => boolean;

  sales: Sale[];
  addSale: (saleData: Omit<Sale, 'id' | 'businessId' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'recordedByUserId' | 'recordedByUserName'> & { customerId?: string }) => Sale;
  updateSale: (id: string, saleData: Partial<Sale>) => void;
  deleteSale: (id: string) => boolean;

  expenses: Expense[];
  addExpense: (expenseData: Omit<Expense, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'recordedByUserId' | 'recordedByUserName'>) => Expense;
  updateExpense: (id: string, expenseData: Partial<Expense>) => void;
  deleteExpense: (id: string) => boolean;

  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (data: Omit<RecurringExpense, 'id' | 'businessId' | 'generatedExpenseIds' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'createdByUserName'>) => RecurringExpense;
  updateRecurringExpense: (id: string, data: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => boolean;
  recordRecurringExpenseOccurrence: (id: string, customDate?: string) => Expense | null;
  skipRecurringExpenseOccurrence: (id: string) => void;
  recordAllDueRecurringExpenses: () => { count: number; totalAmount: number };

  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'businessId' | 'totalPurchases' | 'totalPaid' | 'outstandingDebt' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => boolean;
  recordCustomerDebtPayment: (customerId: string, amount: number, paymentMethod: PaymentMethod, reference?: string, notes?: string) => boolean;

  payables: Payable[];
  addPayable: (payableData: Omit<Payable, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'amountPaid' | 'balanceDue' | 'status'> & { initialDeposit?: number }) => Payable;
  updatePayable: (id: string, payableData: Partial<Payable>) => void;
  deletePayable: (id: string) => boolean;
  recordPayableDebtPayment: (payableId: string, amount: number, paymentMethod: PaymentMethod, reference?: string, notes?: string) => boolean;

  products: ProductService[];
  addProduct: (productData: Omit<ProductService, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>) => ProductService;
  updateProduct: (id: string, productData: Partial<ProductService>) => void;
  deleteProduct: (id: string) => boolean;

  auditLogs: AuditLog[];
  logReceiptPrint: (saleId: string, invoiceNumber: string, format: ReceiptFormat) => void;
  logWhatsAppReminder: (customerId: string, customerName: string, tone: string, method: 'opened_whatsapp' | 'copied') => void;

  debtPayments: DebtPayment[];
  expenseCategories: string[];
  addExpenseCategory: (categoryName: string) => void;

  metrics: ReturnType<typeof calculateFinancialMetrics>;
  resetToDemoData: () => void;
  exportAllDataJSON: () => string;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BUSINESS: 'smt_business_v1',
  USERS: 'smt_users_v1',
  CURRENT_USER_ID: 'smt_current_user_id_v1',
  CUSTOMERS: 'smt_customers_v1',
  PRODUCTS: 'smt_products_v1',
  SALES: 'smt_sales_v1',
  EXPENSES: 'smt_expenses_v1',
  PAYABLES: 'smt_payables_v1',
  AUDIT_LOGS: 'smt_audit_logs_v1',
  DEBT_PAYMENTS: 'smt_debt_payments_v1',
  EXPENSE_CATEGORIES: 'smt_expense_categories_v1',
  RECURRING_EXPENSES: 'smt_recurring_expenses_v1',
};

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from local storage or fall back to INITIAL_*
  const [business, setBusiness] = useState<Business>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS);
      return saved ? JSON.parse(saved) : INITIAL_BUSINESS;
    } catch {
      return INITIAL_BUSINESS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      return saved || INITIAL_USERS[0].id;
    } catch {
      return INITIAL_USERS[0].id;
    }
  });

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [products, setProducts] = useState<ProductService[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS_SERVICES;
    } catch {
      return INITIAL_PRODUCTS_SERVICES;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [payables, setPayables] = useState<Payable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYABLES);
      return saved ? JSON.parse(saved) : INITIAL_PAYABLES;
    } catch {
      return INITIAL_PAYABLES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEBT_PAYMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES);
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES;
    }
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECURRING_EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_RECURRING_EXPENSES;
    } catch {
      return INITIAL_RECURRING_EXPENSES;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(business));
  }, [business]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYABLES, JSON.stringify(payables));
  }, [payables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEBT_PAYMENTS, JSON.stringify(debtPayments));
  }, [debtPayments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECURRING_EXPENSES, JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  // Log audit helper
  const addAuditLog = (
    action: AuditLog['action'],
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string
  ) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: business.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Permission checker for current user
  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(currentUser, permission);
  };

  // Receipt & Reminder audit helpers
  const logReceiptPrint = (saleId: string, invoiceNumber: string, format: ReceiptFormat) => {
    const formatName = format === '58mm' ? '58mm Thermal POS' : format === '80mm' ? '80mm Thermal POS' : 'A4 Standard Invoice';
    addAuditLog('print_receipt', 'sale', saleId, `Printed ${formatName} receipt for invoice ${invoiceNumber}`);
  };

  const logWhatsAppReminder = (
    customerId: string,
    customerName: string,
    tone: string,
    method: 'opened_whatsapp' | 'copied'
  ) => {
    const actionDesc = method === 'opened_whatsapp' ? 'Initiated WhatsApp reminder chat' : 'Copied WhatsApp reminder text';
    addAuditLog(
      'generate_reminder',
      'customer',
      customerId,
      `${actionDesc} for ${customerName} (Tone: ${tone})`
    );
  };

  // Business settings
  const updateBusiness = (updated: Partial<Business>) => {
    if (!hasPermission('manage_business')) {
      alert('Permission Denied: You do not have permission to modify business settings (manage_business).');
      return;
    }
    setBusiness(prev => {
      const next = { ...prev, ...updated, updatedAt: new Date().toISOString() };
      addAuditLog('update', 'settings', next.id, `Updated business settings: ${Object.keys(updated).join(', ')}`);
      return next;
    });
  };

  // User management
  const setCurrentUser = (user: User) => {
    setCurrentUserId(user.id);
  };

  const addUser = (userData: Omit<User, 'id' | 'businessId'>) => {
    if (!hasPermission('manage_users')) {
      alert('Permission Denied: You do not have permission to add new team members (manage_users).');
      return { success: false, message: 'Permission Denied: Missing manage_users permission.' };
    }
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      businessId: business.id,
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('create', 'user', newUser.id, `Added team member: ${newUser.name} (${newUser.role})`);
    return { success: true, user: newUser };
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    if (!hasPermission('manage_users')) {
      alert('Permission Denied: You do not have permission to update team member profiles (manage_users).');
      return;
    }
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
    addAuditLog('update', 'user', id, `Updated team member profile`);
  };

  const updateUserPermissions = (id: string, permissions: Permission[]): { success: boolean; message?: string } => {
    if (!hasPermission('manage_permissions')) {
      alert('Permission Denied: Only Business Owners can customize team permissions (manage_permissions).');
      return { success: false, message: 'Permission Denied: Missing manage_permissions permission.' };
    }
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return { success: false, message: 'User not found.' };

    const validation = validateOwnerProtection(users, id, 'modify_permissions');
    if (!validation.allowed) {
      alert(validation.reason);
      return { success: false, message: validation.reason };
    }

    setUsers(prev => prev.map(u => (u.id === id ? { ...u, permissions } : u)));
    addAuditLog('update_permissions', 'user', id, `Customized permissions for ${targetUser.name} (${permissions.length} active permissions)`);
    return { success: true };
  };

  const changeUserRole = (id: string, newRole: UserRole): { success: boolean; message?: string } => {
    if (currentUser.role !== 'owner') {
      alert('Permission Denied: Only Business Owners can reassign user roles.');
      return { success: false, message: 'Permission Denied: Only Business Owners can reassign user roles.' };
    }
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return { success: false, message: 'User not found.' };

    const validation = validateOwnerProtection(users, id, 'change_role', newRole);
    if (!validation.allowed) {
      alert(validation.reason);
      return { success: false, message: validation.reason };
    }

    setUsers(prev =>
      prev.map(u =>
        u.id === id
          ? {
              ...u,
              role: newRole,
              permissions: undefined, // reset custom permissions to new role defaults
            }
          : u
      )
    );
    addAuditLog('update', 'user', id, `Changed role of ${targetUser.name} from ${targetUser.role} to ${newRole}`);
    return { success: true };
  };

  const deleteUser = (id: string): { success: boolean; message?: string } => {
    if (!hasPermission('manage_users')) {
      alert('Permission Denied: You do not have permission to remove team members.');
      return { success: false, message: 'Permission Denied: Missing manage_users permission.' };
    }
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return { success: false, message: 'User not found.' };

    const validation = validateOwnerProtection(users, id, 'delete');
    if (!validation.allowed) {
      alert(validation.reason);
      return { success: false, message: validation.reason };
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    addAuditLog('delete', 'user', id, `Removed team member: ${targetUser.name} (${targetUser.role})`);
    return { success: true };
  };

  // SALES MANAGEMENT
  const addSale = (saleData: any) => {
    if (!hasPermission('create_sale')) {
      alert('Permission Denied: You do not have permission to record new sales (create_sale).');
      return null as any;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const invoicePrefix = business.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4) || 'SMT';

    // Monotonically increasing sequence that guarantees unique references and never reuses numbers upon deletion
    const maxExistingSeq = sales.reduce((max, s) => {
      const match = s.invoiceNumber.match(/(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        return isNaN(val) ? max : Math.max(max, val);
      }
      return max;
    }, 0);

    const baseSeq = Math.max(business.lastInvoiceSequence || 100, maxExistingSeq);
    const nextSeq = baseSeq + 1;
    const invoiceNumber = `${invoicePrefix}-${currentYear}-${String(nextSeq).padStart(3, '0')}`;

    // Update business sequence so deleted invoices NEVER have their sequence reused
    setBusiness(prev => ({
      ...prev,
      lastInvoiceSequence: nextSeq,
      updatedAt: now.toISOString(),
    }));

    // Calculate totals reliably
    const calculated = calculateSaleTotals(
      saleData.items,
      saleData.discount || 0,
      business.taxRate,
      business.enableTax,
      saleData.amountPaid || 0
    );

    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId: business.id,
      invoiceNumber,
      date: saleData.date || getTodayDateString(),
      time: saleData.time || getCurrentTimeString(),
      subtotal: calculated.subtotal,
      discount: calculated.totalDiscount,
      taxAmount: calculated.taxAmount,
      totalAmount: calculated.totalAmount,
      balanceDue: calculated.balanceDue,
      paymentStatus: calculated.paymentStatus,
      amountPaid: Math.min(saleData.amountPaid || 0, calculated.totalAmount),
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setSales(prev => [newSale, ...prev]);

    // If product has inventory, decrement stock
    setProducts(prev =>
      prev.map(p => {
        const item = newSale.items.find(i => i.productId === p.id);
        if (item && p.type === 'product' && typeof p.currentStock === 'number') {
          return {
            ...p,
            currentStock: Math.max(0, p.currentStock - item.quantity),
            updatedAt: now.toISOString(),
          };
        }
        return p;
      })
    );

    // If customer selected or entered, update or create customer records
    if (newSale.customerId) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === newSale.customerId) {
            return {
              ...c,
              totalPurchases: c.totalPurchases + newSale.totalAmount,
              totalPaid: c.totalPaid + newSale.amountPaid,
              outstandingDebt: c.outstandingDebt + newSale.balanceDue,
              updatedAt: now.toISOString(),
            };
          }
          return c;
        })
      );
    } else if (newSale.customerName && newSale.customerName.trim().length > 0 && newSale.balanceDue > 0) {
      // Auto-create customer if owing money but no customer ID was linked
      const autoCustomer: Customer = {
        id: `cust_${Date.now()}`,
        businessId: business.id,
        name: newSale.customerName.trim(),
        phone: newSale.customerPhone || '',
        notes: `Created from sale ${invoiceNumber}`,
        totalPurchases: newSale.totalAmount,
        totalPaid: newSale.amountPaid,
        outstandingDebt: newSale.balanceDue,
        createdAt: getTodayDateString(),
        updatedAt: getTodayDateString(),
      };
      setCustomers(prev => [autoCustomer, ...prev]);
    }

    addAuditLog('create', 'sale', newSale.id, `Recorded Sale ${invoiceNumber} for ${newSale.customerName} (${business.currencySymbol}${newSale.totalAmount.toLocaleString()})`);
    return newSale;
  };

  const updateSale = (id: string, saleData: Partial<Sale>) => {
    if (!hasPermission('edit_sale')) {
      alert('Permission Denied: You do not have permission to edit sales records (edit_sale).');
      return;
    }
    setSales(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updated = { ...s, ...saleData, updatedAt: new Date().toISOString() };
          addAuditLog('update', 'sale', id, `Updated sale ${s.invoiceNumber}`);
          return updated;
        }
        return s;
      })
    );
  };

  const deleteSale = (id: string): boolean => {
    // Granular permission check: delete_sale
    if (!hasPermission('delete_sale')) {
      alert('Permission Denied: You do not have permission to delete sales records (delete_sale). Please contact your manager or business owner.');
      return false;
    }
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return false;

    // Reverse customer balance if linked
    if (saleToDelete.customerId) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === saleToDelete.customerId) {
            return {
              ...c,
              totalPurchases: Math.max(0, c.totalPurchases - saleToDelete.totalAmount),
              totalPaid: Math.max(0, c.totalPaid - saleToDelete.amountPaid),
              outstandingDebt: Math.max(0, c.outstandingDebt - saleToDelete.balanceDue),
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
    }

    setSales(prev => prev.filter(s => s.id !== id));
    addAuditLog('delete', 'sale', id, `Deleted sale ${saleToDelete.invoiceNumber} (${saleToDelete.customerName})`);
    return true;
  };

  // EXPENSES MANAGEMENT
  const addExpense = (expenseData: any) => {
    if (!hasPermission('create_expense')) {
      alert('Permission Denied: You do not have permission to record expenses (create_expense).');
      return null as any;
    }
    const now = new Date();
    const newExpense: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId: business.id,
      date: expenseData.date || getTodayDateString(),
      time: expenseData.time || getCurrentTimeString(),
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
    addAuditLog('create', 'expense', newExpense.id, `Recorded expense of ${business.currencySymbol}${newExpense.amount.toLocaleString()} for ${newExpense.category}: ${newExpense.description}`);
    return newExpense;
  };

  const updateExpense = (id: string, expenseData: Partial<Expense>) => {
    if (!hasPermission('edit_expense')) {
      alert('Permission Denied: You do not have permission to edit expenses (edit_expense).');
      return;
    }
    setExpenses(prev =>
      prev.map(e => {
        if (e.id === id) {
          const updated = { ...e, ...expenseData, updatedAt: new Date().toISOString() };
          addAuditLog('update', 'expense', id, `Updated expense: ${e.description}`);
          return updated;
        }
        return e;
      })
    );
  };

  const deleteExpense = (id: string): boolean => {
    if (!hasPermission('delete_expense')) {
      alert('Permission Denied: You do not have permission to delete recorded expenses (delete_expense).');
      return false;
    }
    const exp = expenses.find(e => e.id === id);
    if (!exp) return false;
    setExpenses(prev => prev.filter(e => e.id !== id));
    addAuditLog('delete', 'expense', id, `Deleted expense: ${exp.category} - ${exp.description}`);
    return true;
  };

  // RECURRING EXPENSES MANAGEMENT
  const addRecurringExpense = (data: any) => {
    const now = new Date();
    const newRec: RecurringExpense = {
      ...data,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: business.id,
      generatedExpenseIds: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdByUserId: currentUser.id,
      createdByUserName: currentUser.name,
    };
    setRecurringExpenses(prev => [newRec, ...prev]);
    addAuditLog(
      'create',
      'expense',
      newRec.id,
      `Created recurring expense template: ${newRec.description} (${business.currencySymbol}${newRec.amount.toLocaleString()} ${newRec.frequency})`
    );
    return newRec;
  };

  const updateRecurringExpense = (id: string, data: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updated = { ...r, ...data, updatedAt: new Date().toISOString() };
          addAuditLog('update', 'expense', id, `Updated recurring expense: ${r.description}`);
          return updated;
        }
        return r;
      })
    );
  };

  const deleteRecurringExpense = (id: string): boolean => {
    if (currentUser.role === 'staff') {
      alert('Permission Denied: Staff members cannot delete recurring expense schedules.');
      return false;
    }
    const rec = recurringExpenses.find(r => r.id === id);
    if (!rec) return false;
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
    addAuditLog('delete', 'expense', id, `Deleted recurring schedule: ${rec.description}`);
    return true;
  };

  // Record an actual expense occurrence from the recurring template with strict duplicate protection
  const recordRecurringExpenseOccurrence = (id: string, customDate?: string): Expense | null => {
    const rec = recurringExpenses.find(r => r.id === id);
    if (!rec) return null;

    const occurrenceDate = customDate || rec.nextDueDate;
    const occurrenceKey = getOccurrenceKey(rec.id, occurrenceDate);

    // Duplicate check: Verify that this occurrence has not already been created
    const existing = expenses.find(e => e.occurrenceKey === occurrenceKey);
    if (existing) {
      console.warn(`Occurrence ${occurrenceKey} already recorded on ${existing.date}`);
      return null;
    }

    const now = new Date();
    // 1. Generate real expense record
    const newExpense: Expense = {
      id: `exp_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: business.id,
      date: occurrenceDate,
      time: getCurrentTimeString(),
      category: rec.category,
      description: `${rec.description} (${rec.frequency} recurring)`,
      amount: rec.amount,
      paymentMethod: rec.paymentMethod,
      vendorName: rec.vendorName,
      referenceNumber: `REC-${rec.frequency.slice(0, 3).toUpperCase()}-${occurrenceDate.replace(/-/g, '')}`,
      notes: rec.notes || `Auto-recorded from recurring expense schedule`,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      recurringExpenseId: rec.id,
      occurrenceKey,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setExpenses(prev => [newExpense, ...prev]);

    // 2. Advance the recurring template to next due date
    const nextDue = calculateNextDueDate(rec.nextDueDate, rec.frequency);
    const isCompleted = rec.endDate && nextDue > rec.endDate;

    setRecurringExpenses(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            nextDueDate: nextDue,
            status: isCompleted ? 'completed' : r.status,
            lastGeneratedDate: occurrenceDate,
            generatedExpenseIds: [newExpense.id, ...(r.generatedExpenseIds || [])],
            updatedAt: now.toISOString(),
          };
        }
        return r;
      })
    );

    addAuditLog(
      'create',
      'expense',
      newExpense.id,
      `Recorded recurring expense occurrence: ${rec.description} (${business.currencySymbol}${rec.amount.toLocaleString()} due ${occurrenceDate})`
    );

    return newExpense;
  };

  // Advance next due date without creating a financial transaction
  const skipRecurringExpenseOccurrence = (id: string) => {
    const rec = recurringExpenses.find(r => r.id === id);
    if (!rec) return;

    const nextDue = calculateNextDueDate(rec.nextDueDate, rec.frequency);
    const isCompleted = rec.endDate && nextDue > rec.endDate;

    setRecurringExpenses(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            nextDueDate: nextDue,
            status: isCompleted ? 'completed' : r.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    addAuditLog('update', 'expense', id, `Skipped recurring occurrence for ${rec.description} (advanced to ${nextDue})`);
  };

  // 1-Click batch record of all due recurring expenses
  const recordAllDueRecurringExpenses = () => {
    const today = getTodayDateString();
    const dueTemplates = recurringExpenses.filter(r => r.status === 'active' && r.nextDueDate <= today);

    let count = 0;
    let totalAmount = 0;

    dueTemplates.forEach(rec => {
      const exp = recordRecurringExpenseOccurrence(rec.id);
      if (exp) {
        count++;
        totalAmount += exp.amount;
      }
    });

    return { count, totalAmount };
  };

  // CUSTOMERS & DEBT MANAGEMENT
  const addCustomer = (customerData: any) => {
    if (!hasPermission('create_customer')) {
      alert('Permission Denied: You do not have permission to create customer records (create_customer).');
      return null as any;
    }
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      businessId: business.id,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingDebt: 0,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    addAuditLog('create', 'customer', newCustomer.id, `Added customer: ${newCustomer.name}`);
    return newCustomer;
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    if (!hasPermission('edit_customer')) {
      alert('Permission Denied: You do not have permission to edit customer records (edit_customer).');
      return;
    }
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...customerData, updatedAt: new Date().toISOString() };
          addAuditLog('update', 'customer', id, `Updated customer: ${c.name}`);
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCustomer = (id: string): boolean => {
    if (!hasPermission('delete_customer')) {
      alert('Permission Denied: You do not have permission to delete customer profiles (delete_customer).');
      return false;
    }
    const cust = customers.find(c => c.id === id);
    if (!cust) return false;
    setCustomers(prev => prev.filter(c => c.id !== id));
    addAuditLog('delete', 'customer', id, `Deleted customer profile: ${cust.name}`);
    return true;
  };

  const recordCustomerDebtPayment = (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    reference?: string,
    notes?: string
  ): boolean => {
    if (amount <= 0) return false;
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return false;

    const actualAmount = Math.min(amount, cust.outstandingDebt);
    const now = new Date();

    // 1. Update customer record
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            totalPaid: c.totalPaid + actualAmount,
            outstandingDebt: Math.max(0, c.outstandingDebt - actualAmount),
            updatedAt: now.toISOString(),
          };
        }
        return c;
      })
    );

    // 2. Also reconcile oldest unpaid/partial sales for this customer
    let remainingToReconcile = actualAmount;
    setSales(prev =>
      prev.map(sale => {
        if (sale.customerId === customerId && sale.balanceDue > 0 && remainingToReconcile > 0) {
          const applyToSale = Math.min(sale.balanceDue, remainingToReconcile);
          remainingToReconcile -= applyToSale;
          const newAmountPaid = sale.amountPaid + applyToSale;
          const newBalanceDue = Math.max(0, sale.balanceDue - applyToSale);
          return {
            ...sale,
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            paymentStatus: newBalanceDue <= 0 ? 'paid' : 'partial',
            updatedAt: now.toISOString(),
          };
        }
        return sale;
      })
    );

    // 3. Record debt payment receipt
    const paymentRecord: DebtPayment = {
      id: `pmt_${Date.now()}`,
      businessId: business.id,
      targetType: 'customer',
      targetId: customerId,
      targetName: cust.name,
      amount: actualAmount,
      paymentMethod,
      reference,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      notes,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: now.toISOString(),
    };
    setDebtPayments(prev => [paymentRecord, ...prev]);

    addAuditLog(
      'payment_collected',
      'customer',
      customerId,
      `Collected debt payment of ${business.currencySymbol}${actualAmount.toLocaleString()} from ${cust.name} via ${paymentMethod}`
    );
    return true;
  };

  // PAYABLES (MONEY WE OWE) MANAGEMENT
  const addPayable = (payableData: any) => {
    const deposit = Math.max(0, payableData.initialDeposit || 0);
    const totalAmount = Math.max(0, payableData.totalAmount || 0);
    const balanceDue = Math.max(0, totalAmount - deposit);
    const status = balanceDue <= 0 ? 'paid' : deposit > 0 ? 'partial' : 'unpaid';

    const newPayable: Payable = {
      ...payableData,
      id: `pay_${Date.now()}`,
      businessId: business.id,
      amountPaid: deposit,
      balanceDue,
      status,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString(),
    };

    setPayables(prev => [newPayable, ...prev]);

    // If there was an initial deposit, record it as an expense immediately
    if (deposit > 0) {
      addExpense({
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        category: 'Stock/Purchases',
        description: `Deposit payment to supplier: ${newPayable.vendorName} (${newPayable.description})`,
        amount: deposit,
        paymentMethod: 'Bank Transfer',
        vendorName: newPayable.vendorName,
        notes: `Initial deposit for payable ${newPayable.id}`,
      });
    }

    addAuditLog('create', 'payable', newPayable.id, `Recorded supplier debt owed to ${newPayable.vendorName} (${business.currencySymbol}${newPayable.totalAmount.toLocaleString()})`);
    return newPayable;
  };

  const updatePayable = (id: string, payableData: Partial<Payable>) => {
    setPayables(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...payableData, updatedAt: new Date().toISOString() };
          addAuditLog('update', 'payable', id, `Updated supplier debt: ${p.vendorName}`);
          return updated;
        }
        return p;
      })
    );
  };

  const deletePayable = (id: string): boolean => {
    if (currentUser.role === 'staff') {
      alert('Permission Denied: Staff members cannot delete supplier debt records.');
      return false;
    }
    const pay = payables.find(p => p.id === id);
    if (!pay) return false;
    setPayables(prev => prev.filter(p => p.id !== id));
    addAuditLog('delete', 'payable', id, `Deleted payable record for: ${pay.vendorName}`);
    return true;
  };

  const recordPayableDebtPayment = (
    payableId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    reference?: string,
    notes?: string
  ): boolean => {
    if (amount <= 0) return false;
    const pay = payables.find(p => p.id === payableId);
    if (!pay) return false;

    const actualAmount = Math.min(amount, pay.balanceDue);
    const now = new Date();
    const newAmountPaid = pay.amountPaid + actualAmount;
    const newBalanceDue = Math.max(0, pay.balanceDue - actualAmount);
    const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

    // 1. Update payable
    setPayables(prev =>
      prev.map(p => {
        if (p.id === payableId) {
          return {
            ...p,
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus,
            updatedAt: now.toISOString(),
          };
        }
        return p;
      })
    );

    // 2. Debt payment to supplier represents an outgoing cash expense
    addExpense({
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      category: 'Stock/Purchases',
      description: `Debt settlement to supplier: ${pay.vendorName} (${pay.description})`,
      amount: actualAmount,
      paymentMethod,
      vendorName: pay.vendorName,
      referenceNumber: reference,
      notes: notes || `Settled ${business.currencySymbol}${actualAmount.toLocaleString()} against outstanding invoice`,
    });

    // 3. Record debt payment log
    const paymentRecord: DebtPayment = {
      id: `pmt_${Date.now()}`,
      businessId: business.id,
      targetType: 'payable',
      targetId: payableId,
      targetName: pay.vendorName,
      amount: actualAmount,
      paymentMethod,
      reference,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      notes,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: now.toISOString(),
    };
    setDebtPayments(prev => [paymentRecord, ...prev]);

    addAuditLog(
      'debt_settled',
      'payable',
      payableId,
      `Paid ${business.currencySymbol}${actualAmount.toLocaleString()} to supplier ${pay.vendorName} via ${paymentMethod}`
    );
    return true;
  };

  // PRODUCTS & SERVICES
  const addProduct = (productData: any) => {
    if (!hasPermission('create_product')) {
      alert('Permission Denied: You do not have permission to add catalog items (create_product).');
      return null as any;
    }
    const newProduct: ProductService = {
      ...productData,
      id: `prod_${Date.now()}`,
      businessId: business.id,
      currentStock: productData.type === 'product' ? (productData.openingStock || 0) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
    addAuditLog('create', 'product', newProduct.id, `Created ${newProduct.type}: ${newProduct.name}`);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<ProductService>) => {
    if (!hasPermission('edit_product')) {
      alert('Permission Denied: You do not have permission to edit catalog items (edit_product).');
      return;
    }
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...productData, updatedAt: new Date().toISOString() };
          addAuditLog('update', 'product', id, `Updated item: ${p.name}`);
          return updated;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string): boolean => {
    if (!hasPermission('delete_product')) {
      alert('Permission Denied: You do not have permission to delete catalog items (delete_product).');
      return false;
    }
    const prod = products.find(p => p.id === id);
    if (!prod) return false;
    setProducts(prev => prev.filter(p => p.id !== id));
    addAuditLog('delete', 'product', id, `Deleted item: ${prod.name}`);
    return true;
  };

  // Custom Categories
  const addExpenseCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (trimmed && !expenseCategories.includes(trimmed)) {
      setExpenseCategories(prev => [...prev, trimmed]);
    }
  };

  // Metrics
  const metrics = calculateFinancialMetrics(sales, expenses, customers, payables);

  // Demo reset
  const resetToDemoData = () => {
    if (window.confirm('Reset all data to official Smartcore ICT Centre demo records? Any custom additions will be restored.')) {
      setBusiness(INITIAL_BUSINESS);
      setUsers(INITIAL_USERS);
      setCurrentUserId(INITIAL_USERS[0].id);
      setCustomers(INITIAL_CUSTOMERS);
      setProducts(INITIAL_PRODUCTS_SERVICES);
      setSales(INITIAL_SALES);
      setExpenses(INITIAL_EXPENSES);
      setPayables(INITIAL_PAYABLES);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setDebtPayments([]);
      setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
      setRecurringExpenses(INITIAL_RECURRING_EXPENSES);
      localStorage.clear();
    }
  };

  const exportAllDataJSON = () => {
    const dump = {
      business,
      users,
      customers,
      products,
      sales,
      expenses,
      recurringExpenses,
      payables,
      debtPayments,
      auditLogs,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(dump, null, 2);
  };

  return (
    <BusinessContext.Provider
      value={{
        business,
        updateBusiness,
        currentUser,
        setCurrentUser,
        users,
        addUser,
        updateUser,
        updateUserPermissions,
        changeUserRole,
        deleteUser,
        hasPermission,
        sales,
        addSale,
        updateSale,
        deleteSale,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        recurringExpenses,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        recordRecurringExpenseOccurrence,
        skipRecurringExpenseOccurrence,
        recordAllDueRecurringExpenses,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerDebtPayment,
        payables,
        addPayable,
        updatePayable,
        deletePayable,
        recordPayableDebtPayment,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        auditLogs,
        logReceiptPrint,
        logWhatsAppReminder,
        debtPayments,
        expenseCategories,
        addExpenseCategory,
        metrics,
        resetToDemoData,
        exportAllDataJSON,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
