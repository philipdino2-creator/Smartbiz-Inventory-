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
 * Get current date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time string in HH:mm
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

/**
 * Calculate single sale item total: (unitPrice * quantity) - discount
 */
export function calculateSaleItemTotal(quantity: number, unitPrice: number, discount: number = 0): number {
  const subtotal = Math.max(0, quantity) * Math.max(0, unitPrice);
  return Math.max(0, subtotal - Math.max(0, discount));
}

/**
 * Calculate full sale totals
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
  taxAmount: number;
  totalAmount: number;
  balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  totalCogs: number;
} {
  const itemsSubtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const itemsDiscounts = items.reduce((acc, item) => acc + (item.discount || 0), 0);
  const totalDiscount = itemsDiscounts + Math.max(0, overallDiscount);

  const subtotalAfterDiscount = Math.max(0, itemsSubtotal - totalDiscount);
  const taxAmount = enableTax ? (subtotalAfterDiscount * (Math.max(0, taxRate) / 100)) : 0;
  const totalAmount = subtotalAfterDiscount + taxAmount;

  const validAmountPaid = Math.max(0, Math.min(amountPaid, totalAmount));
  const balanceDue = Math.max(0, totalAmount - validAmountPaid);

  let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  if (balanceDue <= 0.001) {
    paymentStatus = 'paid';
  } else if (validAmountPaid > 0) {
    paymentStatus = 'partial';
  }

  // Cost of goods sold for items
  const totalCogs = items.reduce((acc, item) => {
    return acc + (item.quantity * (item.costPrice || 0));
  }, 0);

  return {
    subtotal: itemsSubtotal,
    totalDiscount,
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    balanceDue: Number(balanceDue.toFixed(2)),
    paymentStatus,
    totalCogs: Number(totalCogs.toFixed(2)),
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
 * Calculate financial metrics for dashboard & reports
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

  const todaySales = todaySalesList.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayCashCollected = todaySalesList.reduce((acc, s) => acc + s.amountPaid, 0);
  const todayExpenses = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);
  const todayCogs = todaySalesList.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);
  }, 0);
  const todayProfit = todaySales - todayCogs - todayExpenses;

  // Month
  const monthSalesList = sales.filter(s => s.date.startsWith(currentMonthPrefix));
  const monthExpensesList = expenses.filter(e => e.date.startsWith(currentMonthPrefix));

  const monthSales = monthSalesList.reduce((acc, s) => acc + s.totalAmount, 0);
  const monthCashCollected = monthSalesList.reduce((acc, s) => acc + s.amountPaid, 0);
  const monthExpenses = monthExpensesList.reduce((acc, e) => acc + e.amount, 0);
  const monthCogs = monthSalesList.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);
  }, 0);
  const monthGrossProfit = monthSales - monthCogs;
  const monthProfit = monthGrossProfit - monthExpenses;

  // Receivables (what customers owe)
  const totalReceivables = customers.reduce((acc, c) => acc + (c.outstandingDebt || 0), 0);

  // Payables (what we owe suppliers)
  const totalPayables = payables.reduce((acc, p) => acc + (p.balanceDue || 0), 0);

  return {
    todaySales,
    todayExpenses,
    todayProfit,
    todayCashCollected,
    monthSales,
    monthExpenses,
    monthGrossProfit,
    monthProfit,
    monthCashCollected,
    totalReceivables,
    totalPayables,
    monthCogs,
  };
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

