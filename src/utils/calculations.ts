import { Sale, Expense, SaleItem, Customer, Payable } from '../types';

/**
 * Currency formatter with Nigerian Naira default
 */
export function formatCurrency(amount: number, currencySymbol: string = '₦'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currencySymbol}0.00`;
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${currencySymbol}${formatted}`;
}

/**
 * Format date nicely for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get current date string in YYYY-MM-DD (Africa/Lagos timezone)
 */
export function getTodayDateString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Get current time string in HH:mm (Africa/Lagos timezone)
 */
export function getCurrentTimeString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }
}

/**
 * Round a monetary value to exactly 2 decimal places using integer kobo conversion
 */
export function roundToKobo(amount: number): number {
  if (isNaN(amount) || amount === null || amount === undefined) return 0;
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate single sale item total: (unitPrice * quantity) - discount
 */
export function calculateSaleItemTotal(quantity: number, unitPrice: number, discount: number = 0): number {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safePrice = Math.max(0, Number(unitPrice) || 0);
  const safeDiscount = Math.max(0, Number(discount) || 0);
  const subtotal = roundToKobo(safeQty * safePrice);
  return Math.max(0, roundToKobo(subtotal - safeDiscount));
}

/**
 * Calculate full sale totals with strict VAT & net revenue separation and kobo rounding
 */
export function calculateSaleTotals(
  items: SaleItem[],
  overallDiscount: number = 0,
  taxRate: number = 0,
  enableTax: boolean = false,
  amountPaid: number = 0
): {
  subtotal: number;
  totalDiscount: number;
  netRevenue: number; // Subtotal after discount, before tax
  taxAmount: number; // Statutory VAT liability
  totalAmount: number; // Gross Invoice Total = netRevenue + taxAmount
  balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  totalCogs: number;
} {
  const safeOverallDiscount = Math.max(0, Number(overallDiscount) || 0);
  const safeTaxRate = Math.max(0, Number(taxRate) || 0);
  const safeAmountPaid = Math.max(0, Number(amountPaid) || 0);

  const itemsSubtotal = roundToKobo(
    items.reduce((acc, item) => acc + (Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0)), 0)
  );
  const itemsDiscounts = roundToKobo(
    items.reduce((acc, item) => acc + Math.max(0, Number(item.discount) || 0), 0)
  );
  const totalDiscount = roundToKobo(itemsDiscounts + safeOverallDiscount);

  // Net Operating Revenue = Subtotal less all discounts
  const netRevenue = Math.max(0, roundToKobo(itemsSubtotal - totalDiscount));

  // VAT is calculated on net revenue (tax liability to FIRS, not operating revenue)
  const taxAmount = enableTax ? roundToKobo(netRevenue * (safeTaxRate / 100)) : 0;

  // Gross Invoice Total billed to customer
  const totalAmount = roundToKobo(netRevenue + taxAmount);

  // Clamped valid amount paid: cannot exceed totalAmount
  const validAmountPaid = Math.max(0, Math.min(safeAmountPaid, totalAmount));
  const balanceDue = Math.max(0, roundToKobo(totalAmount - validAmountPaid));

  let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  if (balanceDue <= 0.001) {
    paymentStatus = 'paid';
  } else if (validAmountPaid > 0) {
    paymentStatus = 'partial';
  }

  // Cost of goods sold for inventory/products
  const totalCogs = roundToKobo(
    items.reduce((acc, item) => {
      return acc + (Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.costPrice) || 0));
    }, 0)
  );

  return {
    subtotal: itemsSubtotal,
    totalDiscount,
    netRevenue,
    taxAmount,
    totalAmount,
    balanceDue,
    paymentStatus,
    totalCogs,
  };
}

/**
 * Check if a date string falls in the current month
 */
export function isCurrentMonth(dateString: string): boolean {
  if (!dateString) return false;
  const today = getTodayDateString();
  return dateString.slice(0, 7) === today.slice(0, 7);
}

/**
 * Calculate financial metrics for dashboard & reports with VAT strictly separated from revenue
 */
export function calculateFinancialMetrics(
  sales: Sale[],
  expenses: Expense[],
  customers: Customer[],
  payables: Payable[],
  today: string = getTodayDateString()
) {
  const currentMonthPrefix = today.slice(0, 7);

  // Today
  const todaySalesList = sales.filter(s => s.date === today);
  const todayExpensesList = expenses.filter(e => e.date === today);

  // Gross Invoiced: Total value of customer bills issued
  const todayGrossInvoiced = roundToKobo(todaySalesList.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0));
  // VAT Collected: Tax liability payable to government, excluded from turnover
  const todayVatCollected = roundToKobo(todaySalesList.reduce((acc, s) => acc + (Number(s.taxAmount) || 0), 0));
  // Net Operating Revenue: True business turnover
  const todayOperatingRevenue = Math.max(0, roundToKobo(todayGrossInvoiced - todayVatCollected));
  const todayCashCollected = roundToKobo(todaySalesList.reduce((acc, s) => acc + (Number(s.amountPaid) || 0), 0));
  const todayExpenses = roundToKobo(todayExpensesList.reduce((acc, e) => acc + (Number(e.amount) || 0), 0));
  const todayCogs = roundToKobo(
    todaySalesList.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + (Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.costPrice) || 0)), 0);
    }, 0)
  );
  // Gross Profit = Operating Revenue - COGS
  const todayGrossProfit = roundToKobo(todayOperatingRevenue - todayCogs);
  // Net Profit = Gross Profit - Operating Expenses (VAT is NOT included as profit!)
  const todayProfit = roundToKobo(todayGrossProfit - todayExpenses);

  // Month
  const monthSalesList = sales.filter(s => s.date.startsWith(currentMonthPrefix));
  const monthExpensesList = expenses.filter(e => e.date.startsWith(currentMonthPrefix));

  const monthGrossInvoiced = roundToKobo(monthSalesList.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0));
  const monthVatCollected = roundToKobo(monthSalesList.reduce((acc, s) => acc + (Number(s.taxAmount) || 0), 0));
  const monthOperatingRevenue = Math.max(0, roundToKobo(monthGrossInvoiced - monthVatCollected));
  const monthCashCollected = roundToKobo(monthSalesList.reduce((acc, s) => acc + (Number(s.amountPaid) || 0), 0));
  const monthExpenses = roundToKobo(monthExpensesList.reduce((acc, e) => acc + (Number(e.amount) || 0), 0));
  const monthCogs = roundToKobo(
    monthSalesList.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + (Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.costPrice) || 0)), 0);
    }, 0)
  );
  const monthGrossProfit = roundToKobo(monthOperatingRevenue - monthCogs);
  const monthProfit = roundToKobo(monthGrossProfit - monthExpenses);

  // Receivables (what customers owe)
  const totalReceivables = roundToKobo(customers.reduce((acc, c) => acc + Math.max(0, Number(c.outstandingDebt) || 0), 0));

  // Payables (what we owe suppliers)
  const totalPayables = roundToKobo(payables.reduce((acc, p) => acc + Math.max(0, Number(p.balanceDue) || 0), 0));

  return {
    todaySales: todayGrossInvoiced, // Backward-compatible alias
    todayGrossInvoiced,
    todayVatCollected,
    todayOperatingRevenue,
    todayExpenses,
    todayProfit,
    todayGrossProfit,
    todayCashCollected,
    todayCogs,
    todaySalesCount: todaySalesList.length,
    monthSales: monthGrossInvoiced, // Backward-compatible alias
    monthGrossInvoiced,
    monthVatCollected,
    monthOperatingRevenue,
    monthExpenses,
    monthGrossProfit,
    monthProfit,
    monthCashCollected,
    monthCogs,
    totalReceivables,
    totalPayables,
  };
}

/**
 * Expected Cash formula for daily cash register reconciliation:
 * Expected Cash = Opening Float + Cash Sales + Cash Debt Collections - Cash Expenses - Cash Drops
 */
export function calculateExpectedCash(
  openingFloat: number,
  systemCashSales: number,
  systemDebtCashCollected: number,
  systemCashExpenses: number,
  cashDrop: number = 0
): number {
  const floatVal = Math.max(0, Number(openingFloat) || 0);
  const salesVal = Math.max(0, Number(systemCashSales) || 0);
  const debtVal = Math.max(0, Number(systemDebtCashCollected) || 0);
  const expVal = Math.max(0, Number(systemCashExpenses) || 0);
  const dropVal = Math.max(0, Number(cashDrop) || 0);

  return roundToKobo(floatVal + salesVal + debtVal - expVal - dropVal);
}

/**
 * Calculate cash variance and status
 * Variance = Actual Cash Counted - Expected Cash In Hand
 */
export function calculateReconciliationVariance(
  actualCash: number,
  expectedCash: number
): {
  variance: number;
  isBalanced: boolean;
  status: 'balanced' | 'surplus' | 'shortage';
} {
  const safeActual = Math.max(0, Number(actualCash) || 0);
  const safeExpected = Math.max(0, Number(expectedCash) || 0);
  const variance = roundToKobo(safeActual - safeExpected);

  if (Math.abs(variance) <= 0.001) {
    return { variance: 0, isBalanced: true, status: 'balanced' };
  } else if (variance > 0) {
    return { variance, isBalanced: false, status: 'surplus' };
  } else {
    return { variance, isBalanced: false, status: 'shortage' };
  }
}

/**
 * Calculate the next due date based on frequency
 */
export function calculateNextDueDate(
  currentDateString: string,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
): string {
  if (!currentDateString) return getTodayDateString();
  const [year, month, day] = currentDateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly': {
      const targetMonth = date.getMonth() + 1;
      date.setMonth(targetMonth);
      break;
    }
    case 'quarterly': {
      const targetMonth = date.getMonth() + 3;
      date.setMonth(targetMonth);
      break;
    }
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get recurrence status based on nextDueDate compared to today
 */
export function getRecurringDueStatus(
  nextDueDate: string,
  today: string = getTodayDateString()
): 'overdue' | 'due_today' | 'due_soon' | 'upcoming' {
  if (!nextDueDate) return 'upcoming';
  if (nextDueDate < today) {
    return 'overdue';
  }
  if (nextDueDate === today) {
    return 'due_today';
  }

  // Calculate day difference
  const [y1, m1, d1] = today.split('-').map(Number);
  const [y2, m2, d2] = nextDueDate.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1).getTime();
  const date2 = new Date(y2, m2 - 1, d2).getTime();
  const diffDays = Math.ceil((date2 - date1) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) {
    return 'due_soon';
  }
  return 'upcoming';
}

/**
 * Generate unique occurrence key for duplicate prevention
 */
export function getOccurrenceKey(recurringId: string, dueDate: string): string {
  return `REC-${recurringId}-${dueDate}`;
}

/**
 * Normalize text for fast, whitespace-tolerant, case-insensitive searching
 */
export function normalizeSearchQuery(text: string): string {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

