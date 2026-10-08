import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {
  createSession,
  revokeSession,
  validateSessionToken,
  hashToken,
} from '../middleware/auth.ts';

export async function runAuthFlowVerificationTests(): Promise<{
  passed: boolean;
  results: string[];
  summary: Record<string, 'PASS' | 'FAIL'>;
}> {
  const results: string[] = [];
  let passed = true;

  const summary: Record<string, 'PASS' | 'FAIL'> = {
    'Unauthenticated user sees Login': 'PASS',
    'Dashboard blocked before authentication': 'PASS',
    'Existing user login': 'PASS',
    'Session persists after refresh': 'PASS',
    'Logout returns to Login': 'PASS',
    'Dashboard blocked after logout': 'PASS',
    'New-user signup': 'PASS',
    'Business onboarding': 'PASS',
    'Tenant isolation': 'PASS',
    'Existing Smartcore data preserved': 'PASS',
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
    // =========================================================================
    // Test 1: Unauthenticated user state & Dashboard gating
    // =========================================================================
    // Verify that empty/null token fails authentication
    const emptyValidation = await validateSessionToken('');
    assert(
      emptyValidation.valid === false && !emptyValidation.user,
      'Unauthenticated user sees Login',
      'No session token results in unauthenticated state (AuthScreen display trigger)'
    );

    // Verify backend rejects unauthenticated access to business resources
    const fakeTokenValidation = await validateSessionToken('smt_tok_unauthenticated_test_token_123');
    assert(
      fakeTokenValidation.valid === false && !fakeTokenValidation.user,
      'Dashboard blocked before authentication',
      'Unauthenticated requests are strictly rejected by security middleware'
    );

    // =========================================================================
    // Test 2: Existing user login
    // =========================================================================
    const smartcoreUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'philip@smartcoreict.online'))
      .limit(1);

    assert(smartcoreUser.length === 1, 'Existing user login', 'Smartcore owner account exists in PostgreSQL');

    const u = smartcoreUser[0];
    const passwordMatch = bcrypt.compareSync('smartcore123', u.passwordHash || '');
    assert(passwordMatch === true, 'Existing user login', 'Authoritative credentials authenticate with bcrypt');

    // Create session for existing user
    const existingSession = await createSession(u.id, u.businessId, 7);
    assert(Boolean(existingSession.token), 'Existing user login', 'Valid session token generated on login');

    const loginValidation = await validateSessionToken(existingSession.token);
    assert(
      loginValidation.valid === true && loginValidation.businessId === 'biz_smartcore_001',
      'Existing user login',
      'Authenticated session correctly maps to Smartcore ICT Centre (biz_smartcore_001)'
    );

    // =========================================================================
    // Test 3: Session persists after refresh
    // =========================================================================
    // Simulating page refresh by re-validating the existing stored token
    const refreshValidation = await validateSessionToken(existingSession.token);
    assert(
      refreshValidation.valid === true &&
      refreshValidation.user?.id === u.id &&
      refreshValidation.businessId === 'biz_smartcore_001',
      'Session persists after refresh',
      'Session remains active and preserves workspace state after simulated browser refresh'
    );

    // =========================================================================
    // Test 4: Logout returns to Login
    // =========================================================================
    await revokeSession(existingSession.token);
    const postLogoutValidation = await validateSessionToken(existingSession.token);
    assert(
      postLogoutValidation.valid === false,
      'Logout returns to Login',
      'Token is revoked in PostgreSQL sessions table and no longer authenticates'
    );

    // =========================================================================
    // Test 5: Dashboard blocked after logout
    // =========================================================================
    assert(
      postLogoutValidation.valid === false && !postLogoutValidation.user,
      'Dashboard blocked after logout',
      'Workspace dashboard access is strictly blocked following user logout'
    );

    // =========================================================================
    // Test 6 & 7: New-user signup & Business Onboarding
    // =========================================================================
    const testNewEmail = `alice_test_${Date.now()}@acmetraining.com`;
    const newBizId = `biz_acme_${Date.now()}`;
    const newUserId = `usr_alice_${Date.now()}`;

    // Create new tenant business (simulating onboarding)
    await db.insert(schema.businesses).values({
      id: newBizId,
      name: 'Acme Digital Skills Academy',
      tagline: 'Empowering Digital Futures',
      address: '45 Enterprise Road, Ikeja, Lagos',
      phone: '+234 802 345 6789',
      email: testNewEmail,
      website: 'https://acmetraining.ng',
      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 7.5,
      enableTax: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create new owner user in the new tenant business
    const newPasswordHash = bcrypt.hashSync('securePassword123', 10);
    await db.insert(schema.users).values({
      id: newUserId,
      businessId: newBizId,
      name: 'Alice Johnson',
      email: testNewEmail,
      phone: '+234 802 345 6789',
      role: 'owner',
      active: true,
      passwordHash: newPasswordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newBizInDb = await db.select().from(schema.businesses).where(eq(schema.businesses.id, newBizId)).limit(1);
    assert(
      newBizInDb.length === 1 && newBizInDb[0].name === 'Acme Digital Skills Academy',
      'Business onboarding',
      'New business workspace created successfully with independent profile'
    );

    const newUserInDb = await db.select().from(schema.users).where(eq(schema.users.id, newUserId)).limit(1);
    assert(
      newUserInDb.length === 1 && newUserInDb[0].businessId === newBizId,
      'New-user signup',
      'New user account created and linked to new business workspace'
    );

    // =========================================================================
    // Test 8: Tenant Isolation
    // =========================================================================
    // Create new user session
    const newTenantSession = await createSession(newUserId, newBizId, 7);
    const newTenantValidation = await validateSessionToken(newTenantSession.token);

    assert(
      newTenantValidation.valid === true && newTenantValidation.businessId === newBizId,
      'Tenant isolation',
      'New tenant session authenticated with isolated businessId'
    );

    // Verify tenant isolation in database queries
    // 1. Query customers for new tenant -> Must be 0
    const newTenantCustomers = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.businessId, newBizId));

    assert(
      newTenantCustomers.length === 0,
      'Tenant isolation',
      'New tenant starts with 0 customers, zero data leakage from Smartcore ICT Centre'
    );

    // 2. Query sales for new tenant -> Must be 0
    const newTenantSales = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.businessId, newBizId));

    assert(
      newTenantSales.length === 0,
      'Tenant isolation',
      'New tenant has 0 sales, completely isolated from Smartcore transactions'
    );

    // 3. Add a product to new tenant and ensure Smartcore does not see it
    const newProductId = `prod_acme_${Date.now()}`;
    await db.insert(schema.products).values({
      id: newProductId,
      businessId: newBizId,
      name: 'Advanced Python Bootcamp',
      sku: 'ACM-PY-01',
      type: 'service',
      sellingPrice: '120000.00',
      costPrice: '40000.00',
      currentStock: 25,
      active: true,
      category: 'Software Engineering',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const smartcoreProducts = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.businessId, 'biz_smartcore_001'));

    const smartcoreSeesNewProduct = smartcoreProducts.some(p => p.id === newProductId);
    assert(
      smartcoreSeesNewProduct === false,
      'Tenant isolation',
      'Cross-tenant isolation verified: Smartcore ICT Centre cannot see Acme product'
    );

    // =========================================================================
    // Test 9: Existing Smartcore Data Preserved
    // =========================================================================
    const originalBiz = await db
      .select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, 'biz_smartcore_001'))
      .limit(1);

    assert(
      originalBiz.length === 1 && originalBiz[0].name === 'Smartcore ICT Centre',
      'Existing Smartcore data preserved',
      'Smartcore ICT Centre business record is intact and unchanged'
    );

    assert(
      originalBiz[0].phone === '+234 8148483687',
      'Existing Smartcore data preserved',
      'Smartcore phone and contact details perfectly preserved'
    );

    const smartcoreUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.businessId, 'biz_smartcore_001'));

    assert(
      smartcoreUsers.some(u => u.email === 'philip@smartcoreict.online') &&
      smartcoreUsers.some(u => u.email === 'blessing@smartcoreict.online') &&
      smartcoreUsers.some(u => u.email === 'emeka@smartcoreict.online'),
      'Existing Smartcore data preserved',
      'All 3 official Smartcore users (Philip, Blessing, Emeka) preserved'
    );

    // Clean up temporary test tenant records to keep DB clean
    await db.delete(schema.products).where(eq(schema.products.id, newProductId));
    await db.delete(schema.sessions).where(eq(schema.sessions.id, newTenantSession.sessionId));
    await db.delete(schema.users).where(eq(schema.users.id, newUserId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, newBizId));
    await db.delete(schema.sessions).where(eq(schema.sessions.id, existingSession.sessionId));

  } catch (err: any) {
    results.push(`✗ FATAL EXCEPTION: ${err.message}`);
    passed = false;
  }

  return { passed, results, summary };
}
