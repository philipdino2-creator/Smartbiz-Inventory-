import { Business, User, Customer, ProductService, Sale, Expense, Payable, DebtPayment, RecurringExpense, DailyReconciliation, AuditLog, Permission, UserRole } from '../types/index.ts';

const TOKEN_KEY = 'smt_auth_token_v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      this.setToken(null);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // AUTH
  async login(email: string, password?: string): Promise<{ token: string; user: User; business: Business }> {
    const res = await this.request<{ token: string; user: User; business: Business }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async register(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: UserRole;
    businessName?: string;
    businessCategory?: string;
    businessPhone?: string;
    businessEmail?: string;
    businessAddress?: string;
    businessCurrency?: string;
    businessCurrencySymbol?: string;
    businessTaxRate?: number;
    businessLogoUrl?: string;
  }): Promise<{ token: string; user: User; business: Business }> {
    const res = await this.request<{ token: string; user: User; business: Business }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  async loginWithFirebase(idToken?: string, profile?: { email?: string; name?: string; uid?: string }): Promise<{ token: string; user: User; business: Business }> {
    const res = await this.request<{ token: string; user: User; business: Business }>('/api/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify({ idToken, ...profile }),
    });
    this.setToken(res.token);
    return res;
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; token?: string }> {
    return this.request<{ success: boolean; message: string; token?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async getMe(): Promise<{ user: User; business: Business }> {
    return this.request<{ user: User; business: Business }>('/api/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    this.setToken(null);
  }

  // BUSINESS
  async getBusiness(): Promise<Business> {
    return this.request<Business>('/api/business');
  }

  async updateBusiness(data: Partial<Business>): Promise<Business> {
    return this.request<Business>('/api/business', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resetLedger(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/business/reset-ledger', {
      method: 'POST',
    });
  }

  // USERS & RBAC
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  async createUser(data: { name: string; email: string; phone?: string; role: UserRole; password?: string }): Promise<{ success: boolean; id: string }> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUserRole(id: string, role: UserRole): Promise<{ success: boolean }> {
    return this.request(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async updateUserPermissions(id: string, permissions: Permission[]): Promise<{ success: boolean }> {
    return this.request(`/api/users/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/api/customers');
  }

  async createCustomer(data: Partial<Customer>): Promise<{ success: boolean; id: string }> {
    return this.request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<{ success: boolean }> {
    return this.request(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // PRODUCTS
  async getProducts(): Promise<ProductService[]> {
    return this.request<ProductService[]>('/api/products');
  }

  async createProduct(data: Partial<ProductService>): Promise<{ success: boolean; id: string }> {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: Partial<ProductService>): Promise<{ success: boolean }> {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // SALES
  async getSales(): Promise<Sale[]> {
    return this.request<Sale[]>('/api/sales');
  }

  async createSale(saleData: any): Promise<{ success: boolean; saleId: string; invoiceNumber: string; calculated: any }> {
    return this.request('/api/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async updateSale(id: string, saleData: any): Promise<{ success: boolean; sale?: Sale }> {
    return this.request(`/api/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  async deleteSale(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/sales/${id}`, {
      method: 'DELETE',
    });
  }

  // EXPENSES
  async getExpenses(): Promise<Expense[]> {
    return this.request<Expense[]>('/api/expenses');
  }

  async createExpense(expenseData: any): Promise<{ success: boolean; id: string }> {
    return this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(id: string, expenseData: any): Promise<{ success: boolean }> {
    return this.request(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // PAYABLES & DEBT PAYMENTS
  async getPayables(): Promise<Payable[]> {
    return this.request<Payable[]>('/api/payables');
  }

  async createPayable(data: any): Promise<{ success: boolean; id: string }> {
    return this.request('/api/payables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDebtPayments(): Promise<DebtPayment[]> {
    return this.request<DebtPayment[]>('/api/debt-payments');
  }

  async createDebtPayment(data: any): Promise<{ success: boolean; id: string }> {
    return this.request('/api/debt-payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // RECURRING
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return this.request<RecurringExpense[]>('/api/recurring-expenses');
  }

  async createRecurringExpense(data: Partial<RecurringExpense>): Promise<{ success: boolean; id?: string; recurringExpense?: RecurringExpense }> {
    return this.request('/api/recurring-expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecurringExpense(id: string, data: Partial<RecurringExpense>): Promise<{ success: boolean }> {
    return this.request(`/api/recurring-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecurringExpense(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/recurring-expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // RECONCILIATION
  async getReconciliations(): Promise<DailyReconciliation[]> {
    return this.request<DailyReconciliation[]>('/api/reconciliation');
  }

  async getSystemDayTotals(date: string): Promise<{
    systemCashSales: number;
    systemPosSales: number;
    systemTransferSales: number;
    systemDebtCashCollected: number;
    systemCashExpenses: number;
  }> {
    return this.request(`/api/reconciliation/system-totals?date=${encodeURIComponent(date)}`);
  }

  async openRegister(openingFloat: number, notes?: string): Promise<{ success: boolean; id: string }> {
    return this.request('/api/reconciliation/open', {
      method: 'POST',
      body: JSON.stringify({ openingFloat, notes }),
    });
  }

  async closeRegister(id: string, actuals: any): Promise<{ success: boolean; variance: number }> {
    return this.request(`/api/reconciliation/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(actuals),
    });
  }

  async adjustRegister(id: string, actualCashCounted: number, adjustmentReason: string): Promise<{ success: boolean; variance: number }> {
    return this.request(`/api/reconciliation/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ actualCashCounted, adjustmentReason }),
    });
  }

  // AUDIT LOGS
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/api/audit-logs');
  }

  async logClientEvent(action: string, entity: string, entityId: string, details: string, metadata?: any): Promise<void> {
    try {
      await this.request('/api/audit-logs', {
        method: 'POST',
        body: JSON.stringify({ action, entity, entityId, details, metadata }),
      });
    } catch {
      // Non-blocking
    }
  }

  // SUBSCRIPTION & PLANS
  async getPlans(): Promise<{ currency: string; currencySymbol: string; plans: any[] }> {
    return this.request('/api/plans');
  }

  async getSubscription(): Promise<any> {
    return this.request('/api/subscription');
  }

  async changePlan(planId: string, interval: 'monthly' | 'annual'): Promise<any> {
    return this.request('/api/subscription/change-plan', {
      method: 'POST',
      body: JSON.stringify({ planId, interval }),
    });
  }

  // MIGRATION
  async importLocalStorageData(payload: { customers?: any[]; products?: any[]; sales?: any[]; expenses?: any[]; recurringExpenses?: any[] }): Promise<{ success: boolean; importedCount: number; message: string }> {
    return this.request('/api/migrate/import-localstorage', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService();
