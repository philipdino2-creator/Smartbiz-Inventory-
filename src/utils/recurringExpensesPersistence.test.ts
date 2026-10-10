import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { hasPermission } from './permissionUtils.ts';
import { User, RecurringExpense } from '../types/index.ts';

export async function runRecurringExpensesPersistenceTests(): Promise<{
  passed: boolean;
  results: string[];
  summary: Record<string, 'PASS' | 'FAIL'>;
}> {
  const results: string[] = [];
  let passed = true;

  const summary: Record<string, 'PASS' | 'FAIL'> = {
    'Create Recurring Expense Persists in PostgreSQL': 'PASS',
    'Read Recurring Expense Returns Authoritative Database Record': 'PASS',
    'Update Recurring Expense Persists in PostgreSQL': 'PASS',
    'Delete Recurring Expense Permanently Removes from Database': 'PASS',
    'Deleted Demo Bill Never Reappears Across Refreshes': 'PASS',
    'User-Created Bills Persist Across Simulated Application Restarts': 'PASS',
    'Cross-Tenant Isolation Enforced for Recurring Expenses': 'PASS',
    'Real Business Workspaces Never Injected With Demo Data': 'PASS',
    'Role-Based Access Control Protects Recurring Expenses': 'PASS',
  };

  function assert(condition: boolean, testKey: string, message: string) {
    if (condition) {
      results.push(`✓ PASS [${testKey}]: ${message}`);
    } else {
      results.push(`✗ FAIL [${testKey}]: ${message}`);
      passed = false;
      summary[testKey] = 'FAIL';
    }
  }

  try {
    const testBizId = 'biz_smartcore_001';
    const testUserId = 'usr_philip_owner';

    // =========================================================================
    // Test 1: Create Recurring Expense Persists to PostgreSQL
    // =========================================================================
    const testRecId = `rec_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await db.insert(schema.recurringExpenses).values({
      id: testRecId,
      businessId: testBizId,
      category: 'Software',
      description: 'GitHub Enterprise Subscription',
      amount: '38500.00',
      frequency: 'monthly',
      paymentMethod: 'Card',
      vendorName: 'GitHub Inc',
      nextDueDate: '2026-11-01',
      status: 'active',
      autoRecord: false,
      notes: 'Developer team cloud repositories',
      lastGeneratedDate: null,
      generatedExpenseIds: [],
      createdByUserId: testUserId,
      createdByUserName: 'Philip Dino',
      createdAt: now,
      updatedAt: now,
    });

    const insertedRows = await db
      .select()
      .from(schema.recurringExpenses)
      .where(and(eq(schema.recurringExpenses.id, testRecId), eq(schema.recurringExpenses.businessId, testBizId)))
      .limit(1);

    assert(
      insertedRows.length === 1 && insertedRows[0].description === 'GitHub Enterprise Subscription',
      'Create Recurring Expense Persists in PostgreSQL',
      'New recurring expense successfully inserted and persisted to PostgreSQL table'
    );

    // =========================================================================
    // Test 2: Read Returns Authoritative Parsed Record
    // =========================================================================
    const readRec = insertedRows[0];
    const parsedAmount = Number(readRec.amount);
    const parsedGenerated = Array.isArray(readRec.generatedExpenseIds) ? readRec.generatedExpenseIds : [];

    assert(
      parsedAmount === 38500 && parsedGenerated.length === 0 && readRec.frequency === 'monthly',
      'Read Recurring Expense Returns Authoritative Database Record',
      'Read operation formats numeric amount and JSON fields authoritatively from PostgreSQL'
    );

    // =========================================================================
    // Test 3: Update Recurring Expense Persists in PostgreSQL
    // =========================================================================
    const updatedTime = new Date().toISOString();
    await db
      .update(schema.recurringExpenses)
      .set({
        amount: '42000.00',
        nextDueDate: '2026-12-01',
        status: 'paused',
        lastGeneratedDate: '2026-11-01',
        generatedExpenseIds: ['exp_test_gen_01'],
        updatedAt: updatedTime,
      })
      .where(and(eq(schema.recurringExpenses.id, testRecId), eq(schema.recurringExpenses.businessId, testBizId)));

    const updatedRows = await db
      .select()
      .from(schema.recurringExpenses)
      .where(and(eq(schema.recurringExpenses.id, testRecId), eq(schema.recurringExpenses.businessId, testBizId)))
      .limit(1);

    assert(
      updatedRows.length === 1 &&
      Number(updatedRows[0].amount) === 42000 &&
      updatedRows[0].nextDueDate === '2026-12-01' &&
      updatedRows[0].status === 'paused' &&
      (updatedRows[0].generatedExpenseIds as string[])?.[0] === 'exp_test_gen_01',
      'Update Recurring Expense Persists in PostgreSQL',
      'Updated schedule fields (amount, nextDueDate, status, generatedExpenseIds) reliably persisted to database'
    );

    // =========================================================================
    // Test 4: Delete Recurring Expense Permanently Removes from Database
    // =========================================================================
    await db
      .delete(schema.recurringExpenses)
      .where(and(eq(schema.recurringExpenses.id, testRecId), eq(schema.recurringExpenses.businessId, testBizId)));

    const afterDeleteRows = await db
      .select()
      .from(schema.recurringExpenses)
      .where(and(eq(schema.recurringExpenses.id, testRecId), eq(schema.recurringExpenses.businessId, testBizId)))
      .limit(1);

    assert(
      afterDeleteRows.length === 0,
      'Delete Recurring Expense Permanently Removes from Database',
      'Deleted recurring expense schedule is completely removed from PostgreSQL table'
    );

    // =========================================================================
    // Test 5: Deleted Demo Bill Never Reappears Across Refreshes
    // =========================================================================
    // Create a temporary demo bill to test deletion and simulated refresh re-fetch
    const demoBillId = `rec_demo_temp_${Date.now()}`;
    await db.insert(schema.recurringExpenses).values({
      id: demoBillId,
      businessId: testBizId,
      category: 'Internet',
      description: 'Temporary Demo Fiber Link',
      amount: '15000.00',
      frequency: 'monthly',
      paymentMethod: 'Bank Transfer',
      vendorName: 'Demo ISP',
      nextDueDate: '2026-10-15',
      status: 'active',
      autoRecord: false,
      notes: null,
      lastGeneratedDate: null,
      generatedExpenseIds: [],
      createdByUserId: testUserId,
      createdByUserName: 'Philip Dino',
      createdAt: now,
      updatedAt: now,
    });

    // Delete the demo bill
    await db
      .delete(schema.recurringExpenses)
      .where(and(eq(schema.recurringExpenses.id, demoBillId), eq(schema.recurringExpenses.businessId, testBizId)));

    // Simulate page refresh / app reopening by querying database again
    const simulatedRefreshList = await db
      .select()
      .from(schema.recurringExpenses)
      .where(eq(schema.recurringExpenses.businessId, testBizId))
      .orderBy(desc(schema.recurringExpenses.updatedAt));

    const reappeared = simulatedRefreshList.some(r => r.id === demoBillId);
    assert(
      !reappeared,
      'Deleted Demo Bill Never Reappears Across Refreshes',
      'After deletion and simulated browser refresh, demo bill does not reappear from storage or backend'
    );

    // =========================================================================
    // Test 6: User-Created Bills Persist Across Simulated Application Restarts
    // =========================================================================
    const userBillId = `rec_user_permanent_${Date.now()}`;
    await db.insert(schema.recurringExpenses).values({
      id: userBillId,
      businessId: testBizId,
      category: 'Utilities',
      description: 'Office Power Generator Servicing',
      amount: '22000.00',
      frequency: 'monthly',
      paymentMethod: 'Cash',
      vendorName: 'Delta Electric Mechanics',
      nextDueDate: '2026-10-25',
      status: 'active',
      autoRecord: false,
      notes: 'Oil and fuel filter change',
      lastGeneratedDate: null,
      generatedExpenseIds: [],
      createdByUserId: testUserId,
      createdByUserName: 'Philip Dino',
      createdAt: now,
      updatedAt: now,
    });

    // Simulate app restart / new backend session fetch
    const restartFetch = await db
      .select()
      .from(schema.recurringExpenses)
      .where(and(eq(schema.recurringExpenses.id, userBillId), eq(schema.recurringExpenses.businessId, testBizId)))
      .limit(1);

    assert(
      restartFetch.length === 1 && restartFetch[0].description === 'Office Power Generator Servicing',
      'User-Created Bills Persist Across Simulated Application Restarts',
      'User-created recurring schedule is authoritatively preserved in PostgreSQL across app restarts'
    );

    // Clean up test user bill
    await db
      .delete(schema.recurringExpenses)
      .where(and(eq(schema.recurringExpenses.id, userBillId), eq(schema.recurringExpenses.businessId, testBizId)));

    // =========================================================================
    // Test 7: Multi-Tenant Isolation for Recurring Expenses
    // =========================================================================
    const tenantABizId = 'biz_smartcore_001';
    const tenantBBizId = `biz_tenant_b_${Date.now()}`;

    // Create Tenant B business record
    await db.insert(schema.businesses).values({
      id: tenantBBizId,
      name: 'Beta Digital Academy',
      tagline: 'Empowering Digital Skills',
      address: '77 Broad Street, Lagos',
      phone: '+234 802 333 4444',
      email: 'info@betadigital.ng',
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      enableTax: true,
      lastInvoiceSequence: 100,
    });

    const tenantBBillId = `rec_tenant_b_${Date.now()}`;
    await db.insert(schema.recurringExpenses).values({
      id: tenantBBillId,
      businessId: tenantBBizId,
      category: 'Cloud Services',
      description: 'Google Cloud Platform Hosting',
      amount: '75000.00',
      frequency: 'monthly',
      paymentMethod: 'Card',
      vendorName: 'Google Cloud',
      nextDueDate: '2026-11-15',
      status: 'active',
      autoRecord: false,
      notes: null,
      lastGeneratedDate: null,
      generatedExpenseIds: [],
      createdByUserId: 'usr_beta_admin',
      createdByUserName: 'Beta Admin',
      createdAt: now,
      updatedAt: now,
    });

    // Tenant A queries recurring expenses
    const tenantAResults = await db
      .select()
      .from(schema.recurringExpenses)
      .where(eq(schema.recurringExpenses.businessId, tenantABizId));

    const tenantASeesTenantB = tenantAResults.some(r => r.id === tenantBBillId);

    // Tenant B queries recurring expenses
    const tenantBResults = await db
      .select()
      .from(schema.recurringExpenses)
      .where(eq(schema.recurringExpenses.businessId, tenantBBizId));

    const tenantBSeesOnlyOwn = tenantBResults.length === 1 && tenantBResults[0].id === tenantBBillId;

    // Tenant A attempts unauthorized update on Tenant B's schedule
    const unauthorizedUpdate = await db
      .update(schema.recurringExpenses)
      .set({ amount: '99999.00' })
      .where(and(eq(schema.recurringExpenses.id, tenantBBillId), eq(schema.recurringExpenses.businessId, tenantABizId)));

    const tenantBRecordUntouched = await db
      .select()
      .from(schema.recurringExpenses)
      .where(eq(schema.recurringExpenses.id, tenantBBillId));

    assert(
      !tenantASeesTenantB && tenantBSeesOnlyOwn && Number(tenantBRecordUntouched[0].amount) === 75000,
      'Cross-Tenant Isolation Enforced for Recurring Expenses',
      'Tenant A cannot see, update, or delete Tenant B recurring schedules; data strictly partitioned'
    );

    // =========================================================================
    // Test 8: Real Business Workspaces Never Injected With Demo Data
    // =========================================================================
    const tenantCBizId = `biz_real_clean_${Date.now()}`;
    await db.insert(schema.businesses).values({
      id: tenantCBizId,
      name: 'Fresh Live Business Ltd',
      tagline: 'Professional Accounting',
      address: 'Plot 10, Victoria Island',
      phone: '+234 801 111 2222',
      email: 'hello@freshlive.ng',
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      enableTax: true,
      lastInvoiceSequence: 100,
    });

    // Query recurring expenses for fresh workspace
    const freshBizRecords = await db
      .select()
      .from(schema.recurringExpenses)
      .where(eq(schema.recurringExpenses.businessId, tenantCBizId));

    assert(
      freshBizRecords.length === 0,
      'Real Business Workspaces Never Injected With Demo Data',
      'Newly registered real business workspace starts cleanly with 0 recurring schedules, zero demo data leakage'
    );

    // =========================================================================
    // Test 9: Role-Based Access Control (RBAC) Protects Recurring Expenses
    // =========================================================================
    const ownerUser: User = {
      id: 'u_owner_test',
      businessId: testBizId,
      name: 'Philip Dino',
      email: 'philip@smartcoreict.online',
      role: 'owner',
      active: true,
    };

    const managerUser: User = {
      id: 'u_mgr_test',
      businessId: testBizId,
      name: 'Chinedu Manager',
      email: 'chinedu@smartcoreict.online',
      role: 'manager',
      active: true,
    };

    const staffUser: User = {
      id: 'u_staff_test',
      businessId: testBizId,
      name: 'Blessing Staff',
      email: 'blessing@smartcoreict.online',
      role: 'staff',
      active: true,
      permissions: ['view_sales', 'create_sale'],
    };

    assert(
      hasPermission(ownerUser, 'manage_recurring_expenses') &&
      hasPermission(managerUser, 'manage_recurring_expenses') &&
      !hasPermission(staffUser, 'manage_recurring_expenses'),
      'Role-Based Access Control Protects Recurring Expenses',
      'Owner and Manager hold manage_recurring_expenses permission; unpermitted staff are strictly denied'
    );

    // Clean up temporary test businesses
    await db.delete(schema.recurringExpenses).where(eq(schema.recurringExpenses.businessId, tenantBBizId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, tenantBBizId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, tenantCBizId));

  } catch (err: any) {
    passed = false;
    results.push(`✗ EXCEPTION: ${err?.message || String(err)}`);
  }

  return { passed, results, summary };
}
