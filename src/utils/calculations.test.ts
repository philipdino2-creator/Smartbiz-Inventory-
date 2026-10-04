import {
  calculateSaleItemTotal,
  calculateSaleTotals,
  calculateFinancialMetrics,
  calculateExpectedCash,
  calculateReconciliationVariance,
  formatCurrency,
} from './calculations';
import { Sale, Expense, Customer, Payable, SaleItem } from '../types';

export function runCalculationTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      results.push(`✓ PASS: ${testName}`);
    } else {
      results.push(`✗ FAIL: ${testName}`);
      allPassed = false;
    }
  }

  // Test 1: Line Item Calculation
  const itemTotal1 = calculateSaleItemTotal(3, 15000, 2000);
  assert(itemTotal1 === 43000, 'Line item subtotal with item discount (3 * 15,000 - 2,000 = 43,000)');

  // Test 2: Sale Totals with Multiple Items and Overall Discount
  const items: SaleItem[] = [
    {
      id: 'i1',
      productId: 'p1',
      productName: 'Web Development Training',
      type: 'service',
      quantity: 1,
      unitPrice: 120000,
      costPrice: 0,
      discount: 10000,
      total: 110000,
    },
    {
      id: 'i2',
      productId: 'p2',
      productName: 'Smartcore Flash Drive 64GB',
      type: 'product',
      quantity: 2,
      unitPrice: 7500,
      costPrice: 4000,
      discount: 0,
      total: 15000,
    },
  ];

  const overallDiscount = 5000;
  const taxRate = 7.5; // 7.5% VAT
  const saleTotalsWithTax = calculateSaleTotals(items, overallDiscount, taxRate, true, 80000);

  // Subtotal = 120,000 + 15,000 = 135,000
  // Total discounts = 10,000 (item) + 5,000 (overall) = 15,000
  // Subtotal after discount = 120,000
  // Tax (7.5% of 120,000) = 9,000
  // Total amount = 129,000
  // Amount paid = 80,000
  // Balance due = 49,000
  assert(saleTotalsWithTax.subtotal === 135000, 'Sale subtotal calculation is 135,000');
  assert(saleTotalsWithTax.totalDiscount === 15000, 'Sale total discount is 15,000');
  assert(saleTotalsWithTax.taxAmount === 9000, '7.5% VAT calculation is 9,000');
  assert(saleTotalsWithTax.totalAmount === 129000, 'Grand total is 129,000');
  assert(saleTotalsWithTax.balanceDue === 49000, 'Balance due is 49,000');
  assert(saleTotalsWithTax.paymentStatus === 'partial', 'Partial payment status is correct');
  assert(saleTotalsWithTax.totalCogs === 8000, 'COGS for products (2 * 4,000 = 8,000) is accurate');

  // Test 3: Full Payment Status
  const fullPaymentSale = calculateSaleTotals(items, 0, 0, false, 125000);
  assert(fullPaymentSale.paymentStatus === 'paid', 'Full payment marks status as paid');
  assert(fullPaymentSale.balanceDue === 0, 'Full payment results in 0 balance');

  // Test 4: Unpaid / Credit Sale Status
  const unpaidSale = calculateSaleTotals(items, 0, 0, false, 0);
  assert(unpaidSale.paymentStatus === 'unpaid', 'Zero paid marks status as unpaid');
  assert(unpaidSale.balanceDue === unpaidSale.totalAmount, 'Zero paid leaves entire total as balance due');

  // Test 5: Profit & Loss Math
  const mockSales: Sale[] = [
    {
      id: 's1',
      businessId: 'biz1',
      invoiceNumber: 'INV-001',
      date: '2026-10-03',
      time: '10:00',
      customerName: 'Chidi Okafor',
      items: [
        {
          id: 'si1',
          productId: 'p2',
          productName: 'Computer Course',
          type: 'service',
          quantity: 1,
          unitPrice: 50000,
          costPrice: 5000,
          discount: 0,
          total: 50000,
        },
      ],
      subtotal: 50000,
      discount: 0,
      taxAmount: 0,
      totalAmount: 50000,
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'paid',
      amountPaid: 50000,
      balanceDue: 0,
      recordedByUserId: 'u1',
      recordedByUserName: 'Admin',
      createdAt: '2026-10-03T10:00:00',
      updatedAt: '2026-10-03T10:00:00',
    },
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'e1',
      businessId: 'biz1',
      date: '2026-10-03',
      time: '11:00',
      category: 'Generator Fuel',
      description: 'Diesel for training lab generator',
      amount: 15000,
      paymentMethod: 'Cash',
      vendorName: 'TotalEnergies Okpanam',
      recordedByUserId: 'u1',
      recordedByUserName: 'Admin',
      createdAt: '2026-10-03T11:00:00',
      updatedAt: '2026-10-03T11:00:00',
    },
  ];

  const mockCustomers: Customer[] = [
    {
      id: 'c1',
      businessId: 'biz1',
      name: 'Amaka Eze',
      phone: '+234 803 123 4567',
      totalPurchases: 70000,
      totalPaid: 45000,
      outstandingDebt: 25000,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    },
  ];

  const mockPayables: Payable[] = [
    {
      id: 'py1',
      businessId: 'biz1',
      vendorName: 'Stationery Wholesale Asaba',
      description: 'Exam answer sheets and certificate folders',
      totalAmount: 40000,
      amountPaid: 20000,
      balanceDue: 20000,
      status: 'partial',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    },
  ];

  const metrics = calculateFinancialMetrics(mockSales, mockExpenses, mockCustomers, mockPayables, '2026-10-03');
  // Revenue = 50,000
  // COGS = 5,000
  // Expenses = 15,000
  // Profit = 50,000 - 5,000 - 15,000 = 30,000
  assert(metrics.todaySales === 50000, 'Today sales metrics = 50,000');
  assert(metrics.todayExpenses === 15000, 'Today expenses metrics = 15,000');
  assert(metrics.todayProfit === 30000, 'Today net profit = 30,000 (Revenue - COGS - Expenses)');
  assert(metrics.totalReceivables === 25000, 'Customer receivables debt = 25,000');
  assert(metrics.totalPayables === 20000, 'Supplier payables debt = 20,000');

  // Test 6: Currency Formatter
  assert(formatCurrency(150000, '₦') === '₦150,000.00', 'Currency format 150000 formatted as ₦150,000.00');
  assert(formatCurrency(-2500, '₦') === '-₦2,500.00', 'Negative currency format handled properly');

  // Test 7: Strict VAT Separation from Operating Revenue & Profit
  const vatSales: Sale[] = [
    {
      id: 's_vat_1',
      businessId: 'biz1',
      invoiceNumber: 'INV-VAT-01',
      date: '2026-10-04',
      time: '12:00',
      customerName: 'Obinna Okoye',
      items: [
        {
          id: 'si_v1',
          productId: 'p_course_1',
          productName: 'Full-Stack Web Development Course',
          type: 'service',
          quantity: 1,
          unitPrice: 100000,
          costPrice: 10000,
          discount: 0,
          total: 100000,
        },
      ],
      subtotal: 100000,
      discount: 0,
      taxAmount: 7500, // 7.5% VAT
      totalAmount: 107500, // Gross Invoiced Total
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'paid',
      amountPaid: 107500,
      balanceDue: 0,
      recordedByUserId: 'u1',
      recordedByUserName: 'Admin',
      createdAt: '2026-10-04T12:00:00',
      updatedAt: '2026-10-04T12:00:00',
    },
  ];

  const vatExpenses: Expense[] = [
    {
      id: 'e_vat_1',
      businessId: 'biz1',
      date: '2026-10-04',
      time: '14:00',
      category: 'Office Internet',
      description: 'Monthly Fibre Internet Subscription',
      amount: 25000,
      paymentMethod: 'Bank Transfer',
      vendorName: 'MainOne Technologies',
      recordedByUserId: 'u1',
      recordedByUserName: 'Admin',
      createdAt: '2026-10-04T14:00:00',
      updatedAt: '2026-10-04T14:00:00',
    },
  ];

  const vatMetrics = calculateFinancialMetrics(vatSales, vatExpenses, [], [], '2026-10-04');
  // Gross Invoiced = 107,500
  // VAT Collected = 7,500
  // Net Operating Revenue = 100,000 (excluding VAT)
  // COGS = 10,000
  // Gross Profit = 100,000 - 10,000 = 90,000
  // Operating Expenses = 25,000
  // Net Profit = 90,000 - 25,000 = 65,000 (Does NOT treat VAT as revenue/profit!)
  assert(vatMetrics.todayGrossInvoiced === 107500, 'VAT separation: Gross invoice total is ₦107,500');
  assert(vatMetrics.todayVatCollected === 7500, 'VAT separation: VAT collected liability is ₦7,500');
  assert(vatMetrics.todayOperatingRevenue === 100000, 'VAT separation: Net Operating Revenue is ₦100,000 (excluding VAT)');
  assert(vatMetrics.todayGrossProfit === 90000, 'VAT separation: Gross Profit is ₦90,000 (Operating Revenue - COGS)');
  assert(vatMetrics.todayProfit === 65000, 'VAT separation: Net Profit is ₦65,000 (excludes VAT tax liability)');

  // Test 8: Daily Cash Reconciliation Formulas
  // Expected Cash = Float (20,000) + Cash Sales (50,000) + Debt Collections (10,000) - Cash Expenses (15,000) - Cash Drop (5,000) = 60,000
  const expectedCash1 = calculateExpectedCash(20000, 50000, 10000, 15000, 5000);
  assert(expectedCash1 === 60000, 'Reconciliation: Expected cash calculated correctly as ₦60,000');

  // Exact Match Variance
  const balancedResult = calculateReconciliationVariance(60000, 60000);
  assert(balancedResult.variance === 0 && balancedResult.isBalanced === true && balancedResult.status === 'balanced', 'Reconciliation: Exact cash match variance is 0 and balanced');

  // Cash Shortage Variance (Actual 58,000 vs Expected 60,000 = -2,000 shortage)
  const shortageResult = calculateReconciliationVariance(58000, 60000);
  assert(shortageResult.variance === -2000 && shortageResult.isBalanced === false && shortageResult.status === 'shortage', 'Reconciliation: Cash shortage detected (-₦2,000)');

  // Cash Surplus Variance (Actual 63,500 vs Expected 60,000 = +3,500 surplus)
  const surplusResult = calculateReconciliationVariance(63500, 60000);
  assert(surplusResult.variance === 3500 && surplusResult.isBalanced === false && surplusResult.status === 'surplus', 'Reconciliation: Cash surplus detected (+₦3,500)');

  return { passed: allPassed, results };
}
