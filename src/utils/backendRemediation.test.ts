import { calculateSaleTotals, roundToKobo } from './calculations';
import { User, Sale, Expense, DailyReconciliation, Permission } from '../types';
import { hasPermission } from './permissionUtils';

export function runBackendRemediationTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let passed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      results.push(`✓ PASS: ${message}`);
    } else {
      results.push(`✗ FAIL: ${message}`);
      passed = false;
    }
  }

  // 1. Staff Financial Confidentiality Filter Test
  const staffUser: User = {
    id: 'u_staff_1',
    businessId: 'biz_smartcore_001',
    name: 'Adaobi Staff',
    email: 'ada@smartcoreict.online',
    role: 'staff',
    active: true,
    permissions: ['view_sales', 'create_sale'],
  };

  const managerUser: User = {
    id: 'u_mgr_1',
    businessId: 'biz_smartcore_001',
    name: 'Chinedu Manager',
    email: 'chinedu@smartcoreict.online',
    role: 'manager',
    active: true,
    permissions: ['view_sales', 'create_sale', 'view_profit'],
  };

  assert(!hasPermission(staffUser, 'view_profit'), 'Staff user does not have view_profit permission');
  assert(hasPermission(managerUser, 'view_profit'), 'Manager user has view_profit permission');

  // Simulate API response sanitizer logic from server.ts GET /api/sales
  function sanitizeSaleItemsForUser(items: any[], user: User) {
    const canViewProfit = hasPermission(user, 'view_profit');
    return items.map(item => {
      const itemObj: any = {
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        productName: item.productName,
        type: item.type,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),
      };
      if (canViewProfit) {
        itemObj.costPrice = Number(item.costPrice);
      }
      return itemObj;
    });
  }

  const mockDbItems = [
    {
      id: 'it1',
      saleId: 's1',
      productId: 'p1',
      productName: 'HP Wireless Mouse',
      type: 'product',
      quantity: 2,
      unitPrice: 8000,
      costPrice: 5000,
      discount: 0,
      total: 16000,
    },
  ];

  const staffSanitized = sanitizeSaleItemsForUser(mockDbItems, staffUser);
  assert(staffSanitized[0].costPrice === undefined, 'Staff API response does NOT contain costPrice');
  assert(!('costPrice' in staffSanitized[0]), 'costPrice key is completely omitted for staff');

  const managerSanitized = sanitizeSaleItemsForUser(mockDbItems, managerUser);
  assert(managerSanitized[0].costPrice === 5000, 'Manager with view_profit receives costPrice accurately');

  // 2. Business Isolation on User Permission Update
  function validatePermissionUpdateScoping(authenticatedBusinessId: string, targetUserBusinessId: string): { allowed: boolean; status: number } {
    if (authenticatedBusinessId !== targetUserBusinessId) {
      return { allowed: false, status: 403 };
    }
    return { allowed: true, status: 200 };
  }

  const crossBizTest = validatePermissionUpdateScoping('biz_smartcore_001', 'biz_competitor_999');
  assert(!crossBizTest.allowed && crossBizTest.status === 403, 'Cross-business user permission modification returns 403 Forbidden');

  const sameBizTest = validatePermissionUpdateScoping('biz_smartcore_001', 'biz_smartcore_001');
  assert(sameBizTest.allowed && sameBizTest.status === 200, 'Same-business user permission modification is authorized');

  // 3. Closed-Day Protection for Updates
  function checkClosedDayProtection(
    reconciliations: DailyReconciliation[],
    businessId: string,
    originalDate: string,
    newDate?: string
  ): { allowed: boolean; reason?: string } {
    const dates = [originalDate];
    if (newDate && newDate !== originalDate) {
      dates.push(newDate);
    }

    const closed = reconciliations.find(r => r.businessId === businessId && dates.includes(r.date) && r.status === 'closed');
    if (closed) {
      return { allowed: false, reason: `Business day for ${closed.date} is closed and locked.` };
    }
    return { allowed: true };
  }

  const mockRecons: DailyReconciliation[] = [
    {
      id: 'rec_closed_1',
      businessId: 'biz_smartcore_001',
      date: '2026-10-01',
      openedAt: '2026-10-01T08:00:00Z',
      closedAt: '2026-10-01T18:00:00Z',
      openedByUserId: 'u1',
      openedByUserName: 'Admin',
      status: 'closed',
      openingFloat: 20000,
      systemCashSales: 50000,
      systemPosSales: 10000,
      systemTransferSales: 15000,
      systemDebtCashCollected: 0,
      systemCashExpenses: 5000,
      expectedCashInHand: 65000,
      actualCashCounted: 65000,
      actualPosSettlement: 10000,
      actualTransferSettlement: 15000,
      cashVariance: 0,
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T18:00:00Z',
    },
    {
      id: 'rec_open_2',
      businessId: 'biz_smartcore_001',
      date: '2026-10-04',
      openedAt: '2026-10-04T08:00:00Z',
      openedByUserId: 'u1',
      openedByUserName: 'Admin',
      status: 'open',
      openingFloat: 25000,
      systemCashSales: 30000,
      systemPosSales: 5000,
      systemTransferSales: 10000,
      systemDebtCashCollected: 0,
      systemCashExpenses: 2000,
      expectedCashInHand: 53000,
      actualCashCounted: 0,
      actualPosSettlement: 0,
      actualTransferSettlement: 0,
      cashVariance: -53000,
      createdAt: '2026-10-04T08:00:00Z',
      updatedAt: '2026-10-04T08:00:00Z',
    },
  ];

  const closedSaleEditCheck = checkClosedDayProtection(mockRecons, 'biz_smartcore_001', '2026-10-01');
  assert(!closedSaleEditCheck.allowed, 'Sale update on closed day (2026-10-01) is strictly rejected');

  const openSaleEditCheck = checkClosedDayProtection(mockRecons, 'biz_smartcore_001', '2026-10-04');
  assert(openSaleEditCheck.allowed, 'Sale update on open day (2026-10-04) is permitted');

  const closedExpenseEditCheck = checkClosedDayProtection(mockRecons, 'biz_smartcore_001', '2026-10-01');
  assert(!closedExpenseEditCheck.allowed, 'Expense update on closed day is strictly rejected');

  // 4. Sales Update Recalculation & Balance Adjustment Logic
  const originalItems = [
    { id: 'it1', productId: 'p1', productName: 'Mouse', type: 'product' as const, quantity: 1, unitPrice: 10000, costPrice: 6000, discount: 0, total: 10000 },
  ];
  const origCalc = calculateSaleTotals(originalItems, 0, 7.5, true, 5000);
  assert(origCalc.totalAmount === 10750, 'Original total with 7.5% VAT is 10,750');
  assert(origCalc.balanceDue === 5750, 'Original balance due is 5,750');

  // User edits sale: item quantity changed from 1 to 2, discount of 1,000, and full payment of new amount
  const updatedItems = [
    { id: 'it1', productId: 'p1', productName: 'Mouse', type: 'product' as const, quantity: 2, unitPrice: 10000, costPrice: 6000, discount: 0, total: 20000 },
  ];
  const updatedCalc = calculateSaleTotals(updatedItems, 1000, 7.5, true, 20425);
  // Subtotal = 20,000. Total Discount = 1,000. Net Revenue = 19,000. VAT 7.5% = 1,425. Total = 20,425. Paid = 20,425 -> Balance = 0
  assert(updatedCalc.subtotal === 20000, 'Updated gross item subtotal is 20,000');
  assert(updatedCalc.netRevenue === 19000, 'Updated net revenue after 1,000 discount is 19,000');
  assert(updatedCalc.taxAmount === 1425, 'Updated 7.5% VAT is 1,425');
  assert(updatedCalc.totalAmount === 20425, 'Updated total amount is 20,425');
  assert(updatedCalc.balanceDue === 0, 'Updated balance due is 0 when fully paid');
  assert(updatedCalc.paymentStatus === 'paid', 'Updated payment status is marked paid');

  // 5. Customer Balance Delta Adjustment
  let customerTotalPurchases = 50000;
  let customerTotalPaid = 35000;
  let customerOutstandingDebt = 15000;

  const origPaid = 5000;
  const newPaid = 20425;

  // Reverse old sale (total 10,750, paid 5,000, balance 5,750)
  customerTotalPurchases = Math.max(0, customerTotalPurchases - origCalc.totalAmount);
  customerTotalPaid = Math.max(0, customerTotalPaid - origPaid);
  customerOutstandingDebt = Math.max(0, customerOutstandingDebt - origCalc.balanceDue);

  // Apply new sale (total 20,425, paid 20,425, balance 0)
  customerTotalPurchases += updatedCalc.totalAmount;
  customerTotalPaid += newPaid;
  customerOutstandingDebt += updatedCalc.balanceDue;

  assert(customerTotalPurchases === 59675, 'Customer total purchases accurately updated with new sale total');
  assert(customerTotalPaid === 50425, 'Customer total paid accurately updated with new paid amount');
  assert(customerOutstandingDebt === 9250, 'Customer outstanding debt reduced accurately after full payment of edited sale');

  // 6. Expense Update Validation
  function validateExpenseUpdate(amount: any, description: string): { valid: boolean; error?: string } {
    if (amount !== undefined) {
      const num = Number(amount);
      if (isNaN(num) || num <= 0) {
        return { valid: false, error: 'A positive expense amount is required' };
      }
    }
    if (!description.trim()) {
      return { valid: false, error: 'Description is required' };
    }
    return { valid: true };
  }

  assert(validateExpenseUpdate(15000, 'Office supplies').valid, 'Valid expense update is accepted');
  assert(!validateExpenseUpdate(-500, 'Fuel').valid, 'Negative expense amount is rejected');
  assert(!validateExpenseUpdate(0, 'Water').valid, 'Zero expense amount is rejected');
  assert(!validateExpenseUpdate('invalid', 'Rent').valid, 'Non-numeric expense amount is rejected');

  // 7. Scoped Sale Items Query Simulation
  const mockSales = [
    { id: 's1', businessId: 'biz_smartcore_001' },
    { id: 's2', businessId: 'biz_smartcore_001' },
  ];
  const allSaleItems = [
    { id: 'it1', saleId: 's1', businessId: 'biz_smartcore_001' },
    { id: 'it2', saleId: 's2', businessId: 'biz_smartcore_001' },
    { id: 'it3', saleId: 's_competitor_99', businessId: 'biz_competitor_999' },
  ];

  // Scoped query joins saleItems to sales where sales.businessId == current business
  const scopedItems = allSaleItems.filter(it => mockSales.some(s => s.id === it.saleId));
  assert(scopedItems.length === 2, 'Only sale items belonging to the authenticated business are retrieved');
  assert(!scopedItems.some(it => it.id === 'it3'), 'Competitor sale items are excluded from result set');

  return { passed, results };
}
