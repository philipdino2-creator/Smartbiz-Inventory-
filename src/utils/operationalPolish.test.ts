import {
  normalizeNigerianPhone,
  generateWhatsAppReminderMessage,
  buildWhatsAppUrl,
} from './whatsappUtils';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  getUserPermissions,
  hasPermission,
  validateOwnerProtection,
} from './permissionUtils';
import { calculateSaleTotals, formatCurrency } from './calculations';
import { User, SaleItem, Sale } from '../types';

export function runOperationalPolishTests(): { passed: boolean; results: string[] } {
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

  // ========================================================
  // 1. THERMAL POS RECEIPTS (58mm & 80mm MATH & LAYOUT RULES)
  // ========================================================
  const sampleItems: SaleItem[] = [
    {
      id: 'i1',
      productId: 'p_web',
      productName: 'Web Design & Frontend Development',
      type: 'service',
      quantity: 1,
      unitPrice: 120000,
      costPrice: 15000,
      discount: 10000,
      total: 110000,
    },
    {
      id: 'i2',
      productId: 'p_flash',
      productName: 'USB 64GB Flash Drive',
      type: 'product',
      quantity: 2,
      unitPrice: 5000,
      costPrice: 3000,
      discount: 0,
      total: 10000,
    },
  ];

  // Test Totals with 7.5% VAT and ₦5,000 extra sale discount
  const totals = calculateSaleTotals(sampleItems, 5000, 7.5, true, 80000);
  // Subtotal = 120,000 + 10,000 = 130,000
  // Item discount = 10,000 + overall 5,000 = 15,000
  // Net before tax = 115,000
  // VAT = 7.5% of 115,000 = 8,625
  // Total Amount = 123,625
  // Paid = 80,000
  // Balance = 43,625
  assert(totals.subtotal === 130000, 'Thermal receipt: subtotal is ₦130,000');
  assert(totals.totalDiscount === 15000, 'Thermal receipt: total discount is ₦15,000');
  assert(totals.taxAmount === 8625, 'Thermal receipt: 7.5% VAT is ₦8,625');
  assert(totals.totalAmount === 123625, 'Thermal receipt: grand total is ₦123,625');
  assert(totals.balanceDue === 43625, 'Thermal receipt: outstanding balance is ₦43,625');
  assert(totals.paymentStatus === 'partial', 'Thermal receipt: status is partial');

  // Verify Receipt Numbering: Unique, Monotonic, and Never Reused After Deletion
  const mockSales: Sale[] = [
    { invoiceNumber: 'SMT-2026-090' } as any,
    { invoiceNumber: 'SMT-2026-101' } as any,
    { invoiceNumber: 'SMT-2026-105' } as any,
  ];
  let lastInvoiceSequence = 105;

  const getNextInvoiceSeq = (existingSales: typeof mockSales, currentSeq: number) => {
    const maxExisting = existingSales.reduce((max, s) => {
      const match = s.invoiceNumber.match(/(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return Math.max(currentSeq, maxExisting) + 1;
  };

  const nextSeq1 = getNextInvoiceSeq(mockSales, lastInvoiceSequence);
  assert(nextSeq1 === 106, 'Next sequential invoice is #106');
  lastInvoiceSequence = nextSeq1;

  // Simulate deletion of the newly created sale
  // Even if sales array shrinks, the persistent lastInvoiceSequence MUST prevent reuse
  const afterDeletionSales = mockSales.slice(0, 2); // only 090 and 101 remain
  const nextSeq2 = getNextInvoiceSeq(afterDeletionSales, lastInvoiceSequence);
  assert(nextSeq2 === 107, 'After sale deletion, sequence monotonically advances to #107 without reuse');

  // ========================================================
  // 2. GRANULAR ROLE-BASED PERMISSIONS (RBAC)
  // ========================================================
  const ownerUser: User = {
    id: 'u_owner',
    businessId: 'biz1',
    name: 'Philip Dino',
    email: 'philip@smartcoreict.online',
    role: 'owner',
    active: true,
  };

  const managerUser: User = {
    id: 'u_manager',
    businessId: 'biz1',
    name: 'Blessing Chukwuma',
    email: 'blessing@smartcoreict.online',
    role: 'manager',
    active: true,
  };

  const staffUser: User = {
    id: 'u_staff',
    businessId: 'biz1',
    name: 'Emeka Obi',
    email: 'emeka@smartcoreict.online',
    role: 'staff',
    active: true,
  };

  // Owner has full access to every permission
  const ownerPerms = getUserPermissions(ownerUser);
  assert(ownerPerms.length === ALL_PERMISSIONS.length, 'Owner has all 26 granular permissions');
  assert(hasPermission(ownerUser, 'manage_business'), 'Owner can manage business settings');
  assert(hasPermission(ownerUser, 'manage_permissions'), 'Owner can manage team permissions');
  assert(hasPermission(ownerUser, 'delete_sale'), 'Owner can delete sales');
  assert(hasPermission(ownerUser, 'view_profit'), 'Owner can view private profit/margins');

  // Manager: operational and financial, but cannot manage business core or permissions
  assert(hasPermission(managerUser, 'create_sale'), 'Manager can record sales');
  assert(hasPermission(managerUser, 'view_profit'), 'Manager can view profit & loss');
  assert(hasPermission(managerUser, 'view_reports'), 'Manager can view reports');
  assert(!hasPermission(managerUser, 'manage_business'), 'Manager CANNOT modify core business owner settings');
  assert(!hasPermission(managerUser, 'manage_permissions'), 'Manager CANNOT modify team permissions');

  // Staff: limited front-desk access
  assert(hasPermission(staffUser, 'create_sale'), 'Staff can record sales');
  assert(hasPermission(staffUser, 'view_sales'), 'Staff can view sales and print receipts');
  assert(hasPermission(staffUser, 'create_customer'), 'Staff can register customers');
  assert(!hasPermission(staffUser, 'delete_sale'), 'Staff CANNOT delete sales (blocked)');
  assert(!hasPermission(staffUser, 'delete_expense'), 'Staff CANNOT delete expenses (blocked)');
  assert(!hasPermission(staffUser, 'view_profit'), 'Staff CANNOT view private profit & margins');
  assert(!hasPermission(staffUser, 'export_financial_data'), 'Staff CANNOT export sensitive financial data');
  assert(!hasPermission(staffUser, 'manage_business'), 'Staff CANNOT access business settings');

  // Custom User Permission Override
  const staffWithReportPermission: User = {
    ...staffUser,
    permissions: ['view_sales', 'create_sale', 'view_reports'],
  };
  assert(
    hasPermission(staffWithReportPermission, 'view_reports'),
    'Staff with custom permission override can view reports'
  );
  assert(
    !hasPermission(staffWithReportPermission, 'view_profit'),
    'Staff with custom permission override still cannot view profit'
  );

  // Owner Protection Rules
  const usersList: User[] = [ownerUser, managerUser, staffUser];

  // Try to delete sole owner
  const soleOwnerDeleteAttempt = validateOwnerProtection(usersList, ownerUser.id, 'delete');
  assert(!soleOwnerDeleteAttempt.allowed, 'Owner Protection: Cannot delete the only Business Owner');

  // Try to demote sole owner to staff
  const soleOwnerDemoteAttempt = validateOwnerProtection(usersList, ownerUser.id, 'change_role', 'staff');
  assert(!soleOwnerDemoteAttempt.allowed, 'Owner Protection: Cannot demote the only Business Owner');

  // Manager deletion is allowed
  const managerDeleteAttempt = validateOwnerProtection(usersList, managerUser.id, 'delete');
  assert(managerDeleteAttempt.allowed, 'Owner Protection: Manager deletion is permitted');

  // ========================================================
  // 3. WHATSAPP DEBT REMINDERS & PHONE NORMALIZATION
  // ========================================================

  // Test 1: Standard local 11-digit Nigerian number (080...)
  const phone1 = normalizeNigerianPhone('08012345678');
  assert(phone1.isValid === true, '08012345678 is valid');
  assert(phone1.normalizedNumber === '2348012345678', '08012345678 normalized to 2348012345678');

  // Test 2: Nigerian international format with plus (+234...)
  const phone2 = normalizeNigerianPhone('+234 801 234 5678');
  assert(phone2.isValid === true, '+234 801 234 5678 is valid');
  assert(phone2.normalizedNumber === '2348012345678', '+234 801 234 5678 normalized to 2348012345678');

  // Test 3: Raw country code without plus (234...)
  const phone3 = normalizeNigerianPhone('2348012345678');
  assert(phone3.isValid === true, '2348012345678 is valid');
  assert(phone3.normalizedNumber === '2348012345678', '2348012345678 normalized to 2348012345678');

  // Test 4: Other Nigerian prefixes (070, 090, 081, 091)
  const phone4 = normalizeNigerianPhone('09087654321');
  assert(phone4.isValid === true && phone4.normalizedNumber === '2349087654321', '090 prefix normalized correctly');

  // Test 5: Empty & Invalid Phone Numbers
  const emptyPhone = normalizeNigerianPhone('');
  assert(emptyPhone.isValid === false, 'Empty phone returns isValid=false');
  assert(emptyPhone.error === 'Customer phone number is missing.', 'Empty phone returns clear missing error');

  const invalidPhone = normalizeNigerianPhone('abc123');
  assert(invalidPhone.isValid === false, 'Invalid string returns isValid=false');

  // Test 6: WhatsApp Click-to-Chat URL Generation
  const validUrl = buildWhatsAppUrl('08012345678', 'Hello John');
  assert(validUrl.isValid === true, 'WhatsApp URL generation is valid for valid phone');
  assert(
    validUrl.url === 'https://wa.me/2348012345678?text=Hello%20John',
    'WhatsApp URL correctly structured with wa.me and encoded message'
  );

  const brokenUrl = buildWhatsAppUrl('', 'Hello John');
  assert(brokenUrl.isValid === false, 'WhatsApp URL generation fails safely for empty phone');
  assert(brokenUrl.url === '', 'No broken WhatsApp URL generated when phone is missing');

  // Test 7: Professional Dynamic Message Generation with Tones & Bank Details
  const friendlyMsg = generateWhatsAppReminderMessage({
    customerName: 'Chukwuemeka Daniels',
    outstandingBalance: 40000,
    currencySymbol: '₦',
    invoiceNumber: 'INV-000125',
    businessName: 'Smartcore ICT Centre',
    businessTagline: 'Learn. Create. Innovate.',
    tone: 'friendly',
    bankDetails: {
      bankName: 'Zenith Bank',
      accountName: 'Smartcore ICT Centre',
      accountNumber: '1014848368',
      includeBankDetails: true,
    },
  });

  assert(friendlyMsg.includes('Hello Chukwuemeka'), 'Friendly reminder addresses customer by first name');
  assert(friendlyMsg.includes('Invoice: INV-000125'), 'Message includes exact invoice reference');
  assert(friendlyMsg.includes('₦40,000.00'), 'Message includes formatted currency balance');
  assert(friendlyMsg.includes('Zenith Bank') && friendlyMsg.includes('1014848368'), 'Message includes official bank details');
  assert(friendlyMsg.includes('Learn. Create. Innovate.'), 'Message includes Smartcore brand tagline');

  // Test 8: Due Notice & Overdue Tones
  const dueMsg = generateWhatsAppReminderMessage({
    customerName: 'Grace Adebayo',
    outstandingBalance: 25000,
    dueDate: '2026-10-15',
    tone: 'due',
    businessName: 'Smartcore ICT Centre',
  });
  assert(dueMsg.includes('Payment Due Date: 2026-10-15'), 'Due notice tone incorporates payment due date');

  const overdueMsg = generateWhatsAppReminderMessage({
    customerName: 'Kevin Apex',
    outstandingBalance: 90000,
    dueDate: '2026-09-30',
    tone: 'overdue',
    businessName: 'Smartcore ICT Centre',
  });
  assert(overdueMsg.includes('overdue'), 'Overdue tone conveys polite urgency');

  return { passed: allPassed, results };
}
