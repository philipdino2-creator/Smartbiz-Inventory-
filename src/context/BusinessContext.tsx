import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  DailyReconciliation,
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
  INITIAL_RECONCILIATIONS,
} from '../data/initialData';
import {
  calculateFinancialMetrics,
  calculateSaleTotals,
  getTodayDateString,
  getCurrentTimeString,
  calculateNextDueDate,
  getOccurrenceKey,
  calculateExpectedCash,
  calculateReconciliationVariance,
  roundToKobo,
} from '../utils/calculations';
import {
  hasPermission as checkPermission,
  getUserPermissions,
  validateOwnerProtection,
  DEFAULT_ROLE_PERMISSIONS,
} from '../utils/permissionUtils';
import { api } from '../services/api';

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

  reconciliations: DailyReconciliation[];
  openBusinessDay: (openingFloat: number, notes?: string) => { success: boolean; reconciliation?: DailyReconciliation; message?: string };
  closeBusinessDay: (id: string, actuals: { actualCashCounted: number; actualPosSettlement: number; actualTransferSettlement: number; cashDrop?: number; varianceReason?: string; reconciliationNotes?: string }) => { success: boolean; message?: string };
  adjustBusinessDay: (id: string, actualCashCounted: number, adjustmentReason: string) => { success: boolean; message?: string };
  getReconciliationForDate: (date: string) => DailyReconciliation | undefined;
  calculateSystemDayTotals: (date: string) => {
    systemCashSales: number;
    systemPosSales: number;
    systemTransferSales: number;
    systemDebtCashCollected: number;
    systemCashExpenses: number;
  };

  metrics: ReturnType<typeof calculateFinancialMetrics>;
  resetToDemoData: () => void;
  resetLedgerToZero: () => Promise<{ success: boolean; message?: string }>;
  exportAllDataJSON: () => string;

  // Migration & Server State
  isBackendConnected: boolean;
  migrateLegacyLocalStorageData: () => Promise<{ success: boolean; message: string; importedCount: number }>;
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
  RECONCILIATIONS: 'smt_reconciliations_v1',
};

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // In-memory / initial state loaded from localStorage with fallback to INITIAL_*
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

  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECONCILIATIONS);
      return saved ? JSON.parse(saved) : INITIAL_RECONCILIATIONS;
    } catch {
      return INITIAL_RECONCILIATIONS;
    }
  });

  // Sync to local storage for offline resiliency
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(reconciliations));
  }, [reconciliations]);

  // Sync with PostgreSQL Backend on Mount
  const fetchAllServerData = useCallback(async () => {
    try {
      // 1. Ensure token exists
      if (!api.getToken()) {
        await api.login('philip@smartcoreict.online', 'smartcore123').catch(() => {});
      }

      // 2. Fetch authoritative records
      const [
        serverBiz,
        serverUsers,
        serverCust,
        serverProd,
        serverSales,
        serverExp,
        serverPay,
        serverDebt,
        serverRecExp,
        serverRecon,
        serverAudit,
      ] = await Promise.all([
        api.getBusiness().catch(() => null),
        api.getUsers().catch(() => null),
        api.getCustomers().catch(() => null),
        api.getProducts().catch(() => null),
        api.getSales().catch(() => null),
        api.getExpenses().catch(() => null),
        api.getPayables().catch(() => null),
        api.getDebtPayments().catch(() => null),
        api.getRecurringExpenses().catch(() => null),
        api.getReconciliations().catch(() => null),
        api.getAuditLogs().catch(() => null),
      ]);

      if (serverBiz) setBusiness(serverBiz);
      if (serverUsers && serverUsers.length > 0) setUsers(serverUsers);
      if (serverCust) setCustomers(serverCust);
      if (serverProd) setProducts(serverProd);
      if (serverSales) setSales(serverSales);
      if (serverExp) setExpenses(serverExp);
      if (serverPay) setPayables(serverPay);
      if (serverDebt) setDebtPayments(serverDebt);
      if (serverRecExp) setRecurringExpenses(serverRecExp);
      if (serverRecon) setReconciliations(serverRecon);
      if (serverAudit) setAuditLogs(serverAudit);

      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend server currently syncing or offline, using cached records:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllServerData();
  }, [fetchAllServerData]);

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
    api.logClientEvent(action, entityType, entityId, details).catch(() => {});
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
    const actionText = method === 'opened_whatsapp' ? 'Dispatched' : 'Copied';
    addAuditLog(
      'generate_reminder',
      'customer',
      customerId,
      `${actionText} WhatsApp debt reminder for ${customerName} (${tone} tone)`
    );
  };

  const updateBusiness = (updated: Partial<Business>) => {
    setBusiness(prev => ({ ...prev, ...updated, updatedAt: new Date().toISOString() }));
    api.updateBusiness(updated).catch(() => {});
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserId(user.id);
  };

  const addUser = (userData: Omit<User, 'id' | 'businessId'>): { success: boolean; user?: User; message?: string } => {
    const newId = `usr_${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
      businessId: business.id,
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('create', 'user', newId, `Added team member: ${newUser.name} (${newUser.role})`);
    api.createUser(userData).catch(() => {});
    return { success: true, user: newUser };
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const uUpdated = { ...u, ...updated };
          addAuditLog('update', 'user', id, `Updated team member profile: ${u.name}`);
          return uUpdated;
        }
        return u;
      })
    );
  };

  const updateUserPermissions = (id: string, permissions: Permission[]): { success: boolean; message?: string } => {
    if (!hasPermission('manage_permissions')) {
      alert('Permission Denied: You do not have permission to manage team permissions.');
      return { success: false, message: 'Permission Denied: Missing manage_permissions permission.' };
    }
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return { success: false, message: 'User not found.' };

    if (targetUser.role === 'owner') {
      return { success: false, message: 'Owner permissions cannot be altered; Owner possesses all capabilities.' };
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          return { ...u, permissions };
        }
        return u;
      })
    );
    addAuditLog('update', 'permissions', id, `Customized granular capabilities for ${targetUser.name}`);
    api.updateUserPermissions(id, permissions).catch(() => {});
    return { success: true };
  };

  const changeUserRole = (id: string, newRole: UserRole): { success: boolean; message?: string } => {
    if (!hasPermission('manage_users')) {
      alert('Permission Denied: You do not have permission to change user roles.');
      return { success: false, message: 'Permission Denied: Missing manage_users permission.' };
    }

    const validation = validateOwnerProtection(users, id, 'change_role', newRole);
    if (!validation.allowed) {
      return { success: false, message: validation.reason };
    }

    const target = users.find(u => u.id === id);
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          return { ...u, role: newRole, permissions: DEFAULT_ROLE_PERMISSIONS[newRole] };
        }
        return u;
      })
    );
    addAuditLog('update', 'user', id, `Changed role of ${target?.name} to ${newRole.toUpperCase()}`);
    api.updateUserRole(id, newRole).catch(() => {});
    return { success: true };
  };

  const deleteUser = (id: string): { success: boolean; message?: string } => {
    if (!hasPermission('manage_users')) {
      alert('Permission Denied: You do not have permission to remove team members.');
      return { success: false, message: 'Permission Denied: Missing manage_users permission.' };
    }

    const validation = validateOwnerProtection(users, id, 'delete');
    if (!validation.allowed) {
      return { success: false, message: validation.reason };
    }

    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    addAuditLog('delete', 'user', id, `Removed team member ${target?.name}`);
    api.deleteUser(id).catch(() => {});
    return { success: true };
  };

  // SALES MANAGEMENT WITH CLOSED-DAY CHECK & SERVER INVOICE SYNC
  const addSale = (saleData: any) => {
    if (!hasPermission('create_sale')) {
      alert('Permission Denied: You do not have permission to record new sales (create_sale).');
      return null as any;
    }

    const saleDate = saleData.date || getTodayDateString();

    // Check closed day locally as well
    const closed = reconciliations.find(r => r.date === saleDate && r.status === 'closed');
    if (closed) {
      alert(`Business day for ${saleDate} has been closed and balanced. Modifying or adding sales to a closed day is prohibited without an authorized adjustment.`);
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

    setBusiness(prev => ({
      ...prev,
      lastInvoiceSequence: nextSeq,
      updatedAt: now.toISOString(),
    }));

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
      date: saleDate,
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

    // Stock decrement
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

    // Customer balance update
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

    // Asynchronously synchronize with PostgreSQL
    api.createSale(saleData).then(serverRes => {
      if (serverRes?.invoiceNumber) {
        setSales(prev => prev.map(s => s.id === newSale.id ? { ...s, invoiceNumber: serverRes.invoiceNumber } : s));
      }
    }).catch(err => {
      console.warn('Server sale sync:', err.message);
    });

    return newSale;
  };

  const updateSale = (id: string, saleData: Partial<Sale>) => {
    if (!hasPermission('edit_sale')) {
      alert('Permission Denied: You do not have permission to edit sales records (edit_sale).');
      return;
    }

    const sale = sales.find(s => s.id === id);
    if (sale) {
      const closed = reconciliations.find(r => r.date === sale.date && r.status === 'closed');
      if (closed) {
        alert(`Cannot edit sale from ${sale.date}: Register for that day has been closed and locked.`);
        return;
      }
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

    api.updateSale(id, saleData).then(res => {
      if (res?.sale) {
        setSales(prev => prev.map(s => s.id === id ? { ...s, ...res.sale } : s));
      }
    }).catch(err => {
      alert(`Server Notice: ${err.message || 'Failed to update sale on server'}`);
      fetchAllServerData();
    });
  };

  const deleteSale = (id: string): boolean => {
    if (!hasPermission('delete_sale')) {
      alert('Permission Denied: You do not have permission to delete sales records (delete_sale). Please contact your manager or business owner.');
      return false;
    }
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return false;

    // Closed-day protection
    const closed = reconciliations.find(r => r.date === saleToDelete.date && r.status === 'closed');
    if (closed) {
      alert(`Cannot delete sale from ${saleToDelete.date}: That business day has already been balanced, closed, and locked. Use an adjustment workflow instead.`);
      return false;
    }

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

    // Send to backend
    api.deleteSale(id).catch(err => {
      alert(`Server Notice: ${err.message}`);
    });

    return true;
  };

  // EXPENSES MANAGEMENT WITH CLOSED-DAY CHECK
  const addExpense = (expenseData: any) => {
    if (!hasPermission('create_expense')) {
      alert('Permission Denied: You do not have permission to record expenses (create_expense).');
      return null as any;
    }

    const expDate = expenseData.date || getTodayDateString();
    const closed = reconciliations.find(r => r.date === expDate && r.status === 'closed');
    if (closed) {
      alert(`Register for ${expDate} has been closed and locked. Cannot add retroactive expenses without an authorized adjustment.`);
      return null as any;
    }

    const now = new Date();
    const newExpense: Expense = {
      ...expenseData,
      amount: Math.max(0, Number(expenseData.amount) || 0),
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId: business.id,
      date: expDate,
      time: expenseData.time || getCurrentTimeString(),
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
    addAuditLog('create', 'expense', newExpense.id, `Recorded expense of ${business.currencySymbol}${newExpense.amount.toLocaleString()} for ${newExpense.category}: ${newExpense.description}`);

    api.createExpense(expenseData).catch(err => {
      console.warn('Server expense sync:', err.message);
    });

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

    api.updateExpense(id, expenseData).catch(err => {
      alert(`Server Notice: ${err.message || 'Failed to update expense on server'}`);
      fetchAllServerData();
    });
  };

  const deleteExpense = (id: string): boolean => {
    if (!hasPermission('delete_expense')) {
      alert('Permission Denied: You do not have permission to delete expenses (delete_expense).');
      return false;
    }
    const exp = expenses.find(e => e.id === id);
    if (!exp) return false;

    const closed = reconciliations.find(r => r.date === exp.date && r.status === 'closed');
    if (closed) {
      alert(`Cannot delete expense from ${exp.date}: Register for that day has been closed and locked.`);
      return false;
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
    addAuditLog('delete', 'expense', id, `Deleted expense: ${exp.description}`);

    api.deleteExpense(id).catch(err => {
      alert(`Server Notice: ${err.message}`);
    });

    return true;
  };

  // RECURRING EXPENSES
  const addRecurringExpense = (data: any): RecurringExpense => {
    const now = new Date();
    const newRec: RecurringExpense = {
      ...data,
      id: `rec_${Date.now()}`,
      businessId: business.id,
      status: 'active',
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

  const recordRecurringExpenseOccurrence = (id: string, customDate?: string): Expense | null => {
    const rec = recurringExpenses.find(r => r.id === id);
    if (!rec) return null;

    const occurrenceDate = customDate || rec.nextDueDate;
    const occKey = getOccurrenceKey(rec.id, occurrenceDate);

    const alreadyExists = expenses.some(e => e.occurrenceKey === occKey);
    if (alreadyExists) {
      alert(`Occurrence for ${rec.description} on ${occurrenceDate} has already been recorded.`);
      return null;
    }

    const newExpense = addExpense({
      date: occurrenceDate,
      time: getCurrentTimeString(),
      category: rec.category,
      description: `${rec.description} (${rec.frequency} recurring)`,
      amount: rec.amount,
      paymentMethod: rec.paymentMethod,
      vendorName: rec.vendorName,
      referenceNumber: `REC-${rec.id.slice(-4)}`,
      notes: rec.notes ? `Template note: ${rec.notes}` : undefined,
      recurringExpenseId: rec.id,
      occurrenceKey: occKey,
    });

    const nextDue = calculateNextDueDate(occurrenceDate, rec.frequency);
    updateRecurringExpense(rec.id, {
      nextDueDate: nextDue,
      lastGeneratedDate: occurrenceDate,
      generatedExpenseIds: [...(rec.generatedExpenseIds || []), newExpense.id],
    });

    return newExpense;
  };

  const skipRecurringExpenseOccurrence = (id: string) => {
    const rec = recurringExpenses.find(r => r.id === id);
    if (!rec) return;

    const currentDue = rec.nextDueDate;
    const nextDue = calculateNextDueDate(currentDue, rec.frequency);

    updateRecurringExpense(rec.id, {
      nextDueDate: nextDue,
    });

    addAuditLog(
      'update',
      'expense',
      rec.id,
      `Skipped recurring expense schedule occurrence for ${rec.description} (was due ${currentDue}, next due ${nextDue})`
    );
  };

  const recordAllDueRecurringExpenses = (): { count: number; totalAmount: number } => {
    const today = getTodayDateString();
    let count = 0;
    let totalAmount = 0;

    recurringExpenses.forEach(r => {
      if (r.status === 'active' && r.nextDueDate <= today) {
        const occKey = getOccurrenceKey(r.id, r.nextDueDate);
        const alreadyExists = expenses.some(e => e.occurrenceKey === occKey);
        if (!alreadyExists) {
          const exp = recordRecurringExpenseOccurrence(r.id, r.nextDueDate);
          if (exp) {
            count++;
            totalAmount += exp.amount;
          }
        }
      }
    });

    return { count, totalAmount };
  };

  // CUSTOMERS
  const addCustomer = (customerData: any): Customer => {
    const newCust: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      businessId: business.id,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingDebt: 0,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString(),
    };
    setCustomers(prev => [newCust, ...prev]);
    addAuditLog('create', 'customer', newCust.id, `Registered customer: ${newCust.name}`);
    api.createCustomer(customerData).catch(() => {});
    return newCust;
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...customerData, updatedAt: getTodayDateString() };
          addAuditLog('update', 'customer', id, `Updated customer: ${c.name}`);
          return updated;
        }
        return c;
      })
    );
    api.updateCustomer(id, customerData).catch(() => {});
  };

  const deleteCustomer = (id: string): boolean => {
    const cust = customers.find(c => c.id === id);
    if (!cust) return false;
    setCustomers(prev => prev.filter(c => c.id !== id));
    addAuditLog('delete', 'customer', id, `Deleted customer: ${cust.name}`);
    api.deleteCustomer(id).catch(() => {});
    return true;
  };

  const recordCustomerDebtPayment = (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    reference?: string,
    notes?: string
  ): boolean => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return false;

    const safeAmount = Math.max(0, amount);
    if (safeAmount <= 0) return false;

    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          const newDebt = Math.max(0, c.outstandingDebt - safeAmount);
          const newPaid = c.totalPaid + safeAmount;
          return {
            ...c,
            outstandingDebt: newDebt,
            totalPaid: newPaid,
            updatedAt: getTodayDateString(),
          };
        }
        return c;
      })
    );

    const paymentRecord: DebtPayment = {
      id: `pay_${Date.now()}`,
      businessId: business.id,
      targetType: 'customer',
      targetId: customerId,
      targetName: customer.name,
      amount: safeAmount,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      paymentMethod,
      reference,
      notes,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    setDebtPayments(prev => [paymentRecord, ...prev]);

    addAuditLog(
      'debt_settled',
      'customer',
      customerId,
      `Recorded debt settlement of ${business.currencySymbol}${safeAmount.toLocaleString()} from ${customer.name} via ${paymentMethod}`
    );

    api.createDebtPayment({
      targetType: 'customer',
      targetId: customerId,
      targetName: customer.name,
      amount: safeAmount,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      paymentMethod,
      reference,
      notes,
    }).catch(() => {});

    return true;
  };

  // PAYABLES
  const addPayable = (payableData: any): Payable => {
    const totalAmount = payableData.totalAmount || 0;
    const initialDeposit = payableData.initialDeposit || 0;
    const balanceDue = Math.max(0, totalAmount - initialDeposit);
    const status = balanceDue === 0 ? 'paid' : initialDeposit > 0 ? 'partial' : 'unpaid';

    const newPayable: Payable = {
      ...payableData,
      id: `py_${Date.now()}`,
      businessId: business.id,
      totalAmount,
      amountPaid: initialDeposit,
      balanceDue,
      status,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString(),
    };
    setPayables(prev => [newPayable, ...prev]);
    addAuditLog(
      'create',
      'expense',
      newPayable.id,
      `Recorded supplier payable for ${newPayable.vendorName}: ${business.currencySymbol}${newPayable.totalAmount.toLocaleString()}`
    );

    api.createPayable(payableData).catch(() => {});
    return newPayable;
  };

  const updatePayable = (id: string, payableData: Partial<Payable>) => {
    setPayables(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...payableData, updatedAt: getTodayDateString() };
          addAuditLog('update', 'expense', id, `Updated supplier payable for ${p.vendorName}`);
          return updated;
        }
        return p;
      })
    );
  };

  const deletePayable = (id: string): boolean => {
    const p = payables.find(item => item.id === id);
    if (!p) return false;
    setPayables(prev => prev.filter(item => item.id !== id));
    addAuditLog('delete', 'expense', id, `Deleted supplier payable for ${p.vendorName}`);
    return true;
  };

  const recordPayableDebtPayment = (
    payableId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    reference?: string,
    notes?: string
  ): boolean => {
    const payable = payables.find(p => p.id === payableId);
    if (!payable) return false;

    const safeAmount = Math.max(0, amount);
    if (safeAmount <= 0) return false;

    setPayables(prev =>
      prev.map(p => {
        if (p.id === payableId) {
          const newBalance = Math.max(0, p.balanceDue - safeAmount);
          const newPaid = p.amountPaid + safeAmount;
          const newStatus = newBalance === 0 ? 'paid' : 'partial';
          return {
            ...p,
            balanceDue: newBalance,
            amountPaid: newPaid,
            status: newStatus,
            updatedAt: getTodayDateString(),
          };
        }
        return p;
      })
    );

    const paymentRecord: DebtPayment = {
      id: `pay_${Date.now()}`,
      businessId: business.id,
      targetType: 'payable',
      targetId: payableId,
      targetName: payable.vendorName,
      amount: safeAmount,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      paymentMethod,
      reference,
      notes,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    setDebtPayments(prev => [paymentRecord, ...prev]);

    addAuditLog(
      'payment_collected',
      'expense',
      payableId,
      `Paid ${business.currencySymbol}${safeAmount.toLocaleString()} to supplier ${payable.vendorName} via ${paymentMethod}`
    );

    api.createDebtPayment({
      targetType: 'payable',
      targetId: payableId,
      targetName: payable.vendorName,
      amount: safeAmount,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      paymentMethod,
      reference,
      notes,
    }).catch(() => {});

    return true;
  };

  // PRODUCTS
  const addProduct = (productData: any): ProductService => {
    const newProd: ProductService = {
      ...productData,
      id: `prod_${Date.now()}`,
      businessId: business.id,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString(),
    };
    setProducts(prev => [newProd, ...prev]);
    addAuditLog('create', 'catalog', newProd.id, `Created ${newProd.type}: ${newProd.name}`);
    api.createProduct(productData).catch(() => {});
    return newProd;
  };

  const updateProduct = (id: string, productData: Partial<ProductService>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...productData, updatedAt: getTodayDateString() };
          addAuditLog('update', 'catalog', id, `Updated ${p.type}: ${p.name}`);
          return updated;
        }
        return p;
      })
    );
    api.updateProduct(id, productData).catch(() => {});
  };

  const deleteProduct = (id: string): boolean => {
    const p = products.find(prod => prod.id === id);
    if (!p) return false;
    setProducts(prev => prev.filter(prod => prod.id !== id));
    addAuditLog('delete', 'catalog', id, `Deleted ${p.type}: ${p.name}`);
    api.deleteProduct(id).catch(() => {});
    return true;
  };

  const addExpenseCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (trimmed && !expenseCategories.includes(trimmed)) {
      setExpenseCategories(prev => [...prev, trimmed]);
    }
  };

  // DAILY BUSINESS RECONCILIATION
  const calculateSystemDayTotals = (date: string) => {
    const daySales = sales.filter(s => s.date === date);
    const systemCashSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );
    const systemPosSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'POS' || s.paymentMethod === 'Card').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );
    const systemTransferSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'Bank Transfer').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );

    const systemDebtCashCollected = roundToKobo(
      debtPayments
        .filter(p => p.date === date && p.targetType === 'customer' && p.paymentMethod === 'Cash')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    const systemCashExpenses = roundToKobo(
      expenses
        .filter(e => e.date === date && e.paymentMethod === 'Cash')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    );

    return {
      systemCashSales,
      systemPosSales,
      systemTransferSales,
      systemDebtCashCollected,
      systemCashExpenses,
    };
  };

  const getReconciliationForDate = (date: string): DailyReconciliation | undefined => {
    return reconciliations.find(r => r.date === date);
  };

  const openBusinessDay = (
    openingFloat: number,
    notes?: string
  ): { success: boolean; reconciliation?: DailyReconciliation; message?: string } => {
    if (!hasPermission('manage_reconciliation')) {
      alert('Permission Denied: You do not have permission to open business registers (manage_reconciliation).');
      return { success: false, message: 'Permission Denied: Missing manage_reconciliation permission.' };
    }

    const todayDate = getTodayDateString();
    const existing = reconciliations.find(r => r.date === todayDate);
    if (existing) {
      if (existing.status === 'open') {
        return { success: false, reconciliation: existing, message: `Register for ${todayDate} is already open.` };
      } else {
        return { success: false, reconciliation: existing, message: `Register for ${todayDate} has already been closed.` };
      }
    }

    const safeFloat = Math.max(0, roundToKobo(Number(openingFloat) || 0));
    const totals = calculateSystemDayTotals(todayDate);
    const expected = calculateExpectedCash(
      safeFloat,
      totals.systemCashSales,
      totals.systemDebtCashCollected,
      totals.systemCashExpenses,
      0
    );

    const now = new Date();
    const newRecon: DailyReconciliation = {
      id: `recon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: business.id,
      date: todayDate,
      openedAt: now.toISOString(),
      openedByUserId: currentUser.id,
      openedByUserName: currentUser.name,
      status: 'open',
      openingFloat: safeFloat,
      cashDrop: 0,
      systemCashSales: totals.systemCashSales,
      systemPosSales: totals.systemPosSales,
      systemTransferSales: totals.systemTransferSales,
      systemDebtCashCollected: totals.systemDebtCashCollected,
      systemCashExpenses: totals.systemCashExpenses,
      expectedCashInHand: expected,
      actualCashCounted: 0,
      actualPosSettlement: 0,
      actualTransferSettlement: 0,
      cashVariance: roundToKobo(0 - expected),
      reconciliationNotes: notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setReconciliations(prev => [newRecon, ...prev]);
    addAuditLog(
      'open_day',
      'reconciliation',
      newRecon.id,
      `Opened daily register for ${todayDate} with opening float of ${business.currencySymbol}${safeFloat.toLocaleString()}`
    );

    api.openRegister(safeFloat, notes).catch(err => {
      console.warn('Server open register:', err.message);
    });

    return { success: true, reconciliation: newRecon };
  };

  const closeBusinessDay = (
    id: string,
    actuals: {
      actualCashCounted: number;
      actualPosSettlement: number;
      actualTransferSettlement: number;
      cashDrop?: number;
      varianceReason?: string;
      reconciliationNotes?: string;
    }
  ): { success: boolean; message?: string } => {
    if (!hasPermission('manage_reconciliation')) {
      alert('Permission Denied: You do not have permission to close business registers (manage_reconciliation).');
      return { success: false, message: 'Permission Denied: Missing manage_reconciliation permission.' };
    }

    const rec = reconciliations.find(r => r.id === id);
    if (!rec) {
      return { success: false, message: 'Reconciliation record not found.' };
    }
    if (rec.status !== 'open') {
      return { success: false, message: `Register is already marked as ${rec.status}.` };
    }

    const totals = calculateSystemDayTotals(rec.date);
    const safeDrop = Math.max(0, roundToKobo(Number(actuals.cashDrop) || 0));
    const safeCounted = Math.max(0, roundToKobo(Number(actuals.actualCashCounted) || 0));
    const expected = calculateExpectedCash(
      rec.openingFloat,
      totals.systemCashSales,
      totals.systemDebtCashCollected,
      totals.systemCashExpenses,
      safeDrop
    );

    const varianceResult = calculateReconciliationVariance(safeCounted, expected);

    if (!varianceResult.isBalanced && (!actuals.varianceReason || !actuals.varianceReason.trim())) {
      alert(`Variance of ${business.currencySymbol}${Math.abs(varianceResult.variance).toLocaleString()} detected. A variance explanation reason is mandatory before closing the business day.`);
      return { success: false, message: 'Variance detected. Explanation reason is mandatory before closing.' };
    }

    const now = new Date();
    setReconciliations(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            ...totals,
            expectedCashInHand: expected,
            actualCashCounted: safeCounted,
            actualPosSettlement: roundToKobo(Number(actuals.actualPosSettlement) || 0),
            actualTransferSettlement: roundToKobo(Number(actuals.actualTransferSettlement) || 0),
            cashDrop: safeDrop,
            cashVariance: varianceResult.variance,
            varianceReason: actuals.varianceReason?.trim(),
            reconciliationNotes: actuals.reconciliationNotes?.trim(),
            status: 'closed',
            closedAt: now.toISOString(),
            closedByUserId: currentUser.id,
            closedByUserName: currentUser.name,
            updatedAt: now.toISOString(),
          };
        }
        return r;
      })
    );

    const varianceStr = varianceResult.variance === 0
      ? 'Balanced (₦0.00)'
      : varianceResult.variance > 0
      ? `+${business.currencySymbol}${varianceResult.variance.toLocaleString()} Surplus`
      : `-${business.currencySymbol}${Math.abs(varianceResult.variance).toLocaleString()} Shortage`;

    addAuditLog(
      'close_day',
      'reconciliation',
      rec.id,
      `Closed business day register for ${rec.date}: Expected ${business.currencySymbol}${expected.toLocaleString()}, Counted ${business.currencySymbol}${safeCounted.toLocaleString()}, Variance: ${varianceStr}${actuals.varianceReason ? ` (Reason: ${actuals.varianceReason})` : ''}`
    );

    api.closeRegister(id, actuals).catch(err => {
      alert(`Server close error: ${err.message}`);
    });

    return { success: true };
  };

  const adjustBusinessDay = (
    id: string,
    actualCashCounted: number,
    adjustmentReason: string
  ): { success: boolean; message?: string } => {
    if (!hasPermission('manage_reconciliation')) {
      alert('Permission Denied: Missing manage_reconciliation capability.');
      return { success: false, message: 'Permission Denied' };
    }
    if (!adjustmentReason.trim()) {
      alert('An authorized adjustment reason is mandatory when modifying a closed register.');
      return { success: false, message: 'Adjustment reason required' };
    }

    const rec = reconciliations.find(r => r.id === id);
    if (!rec) return { success: false, message: 'Record not found' };

    const safeCounted = Math.max(0, roundToKobo(Number(actualCashCounted) || 0));
    const varianceResult = calculateReconciliationVariance(safeCounted, rec.expectedCashInHand);

    setReconciliations(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            actualCashCounted: safeCounted,
            cashVariance: varianceResult.variance,
            varianceReason: `[Adjusted] ${adjustmentReason.trim()}`,
            status: 'adjusted',
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    addAuditLog(
      'adjust_day',
      'reconciliation',
      id,
      `Adjusted closed register for ${rec.date}: New Counted ₦${safeCounted.toLocaleString()}, Reason: ${adjustmentReason}`
    );

    api.adjustRegister(id, safeCounted, adjustmentReason).catch(err => {
      alert(`Server adjustment error: ${err.message}`);
    });

    return { success: true };
  };

  // Metrics
  const metrics = calculateFinancialMetrics(sales, expenses, customers, payables);

  // Demo reset (guarded for owner)
  const resetToDemoData = () => {
    if (!hasPermission('manage_business')) {
      alert('Permission Denied: System data restore is restricted to the Business Owner.');
      return;
    }
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
      setReconciliations(INITIAL_RECONCILIATIONS);
      localStorage.clear();
      fetchAllServerData();
    }
  };

  // Reset all ledger transactions to zero for live usage (guarded for owner)
  const resetLedgerToZero = async (): Promise<{ success: boolean; message?: string }> => {
    if (!hasPermission('manage_business')) {
      alert('Permission Denied: Resetting ledger entries is restricted to the Business Owner.');
      return { success: false, message: 'Permission Denied' };
    }
    try {
      await api.resetLedger();
    } catch (err: any) {
      console.warn('Server reset notice:', err.message);
    }
    setSales([]);
    setExpenses([]);
    setPayables([]);
    setDebtPayments([]);
    setAuditLogs([]);
    setReconciliations([]);
    setCustomers(prev => prev.map(c => ({
      ...c,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingDebt: 0,
    })));
    setProducts(prev => prev.map(p => ({
      ...p,
      currentStock: p.openingStock || p.currentStock,
    })));
    setBusiness(prev => ({
      ...prev,
      lastInvoiceSequence: 100,
    }));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYABLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEBT_PAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    await fetchAllServerData();
    return { success: true, message: 'Dashboard and ledger entries reset to zero successfully.' };
  };

  // Export full backup with strict permission check
  const exportAllDataJSON = () => {
    if (!hasPermission('manage_business') && !hasPermission('export_financial_data')) {
      alert('Permission Denied: Full database backups are restricted to Business Owners and authorized Managers.');
      return '';
    }

    const data = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      business,
      users,
      customers,
      products,
      sales,
      expenses,
      payables,
      debtPayments,
      expenseCategories,
      recurringExpenses,
      reconciliations,
      auditLogs,
    };
    addAuditLog('export_data', 'system', business.id, 'Exported complete database JSON backup');
    return JSON.stringify(data, null, 2);
  };

  // LocalStorage Migration to PostgreSQL
  const migrateLegacyLocalStorageData = async () => {
    try {
      const payload = {
        customers,
        products,
        sales,
        expenses,
      };
      const res = await api.importLocalStorageData(payload);
      await fetchAllServerData();
      return res;
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to migrate records', importedCount: 0 };
    }
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

        reconciliations,
        openBusinessDay,
        closeBusinessDay,
        adjustBusinessDay,
        getReconciliationForDate,
        calculateSystemDayTotals,

        metrics,
        resetToDemoData,
        resetLedgerToZero,
        exportAllDataJSON,

        isBackendConnected,
        migrateLegacyLocalStorageData,
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
