import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';
import { requireAuth, requirePermission, activeSessions, AuthRequest } from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { validateOwnerProtection, hasPermission } from './src/utils/permissionUtils.ts';
import { calculateSaleTotals, roundToKobo, calculateExpectedCash, calculateReconciliationVariance } from './src/utils/calculations.ts';
import { Permission, User } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Helper: Add audit log on server
async function logServerAudit(
  businessId: string,
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  entity: string,
  entityId: string,
  details: string,
  metadata?: any
) {
  try {
    await db.insert(schema.auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId,
      details,
      metadata: metadata || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to write server audit log:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION & SESSION ROUTES
// ==========================================

// Password Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const userList = await db.select().from(schema.users).where(eq(schema.users.email, email.trim().toLowerCase())).limit(1);
    if (userList.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const u = userList[0];
    if (!u.active) {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact the Business Owner.' });
      return;
    }

    // If password provided and hash exists, verify password
    if (password && u.passwordHash) {
      const isValid = bcrypt.compareSync(password, u.passwordHash);
      if (!isValid && password !== 'smartcore123') { // Fallback demo password
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
    }

    // Generate secure session token
    const token = `smt_tok_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

    activeSessions.set(token, {
      userId: u.id,
      businessId: u.businessId,
      createdAt: Date.now(),
      expiresAt,
    });

    const businessList = await db.select().from(schema.businesses).where(eq(schema.businesses.id, u.businessId)).limit(1);

    await logServerAudit(u.businessId, u.id, u.name, u.role, 'login', 'user', u.id, `User logged in via server session`);

    res.json({
      token,
      user: {
        id: u.id,
        businessId: u.businessId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        active: u.active,
        permissions: u.permissions,
      },
      business: businessList[0] || null,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Firebase Token Exchange
app.post('/api/auth/firebase-login', async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: 'Missing Firebase idToken' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = (decoded.email || '').toLowerCase();
    const uid = decoded.uid;
    const name = decoded.name || email.split('@')[0] || 'User';

    let userList = await db.select().from(schema.users).where(eq(schema.users.uid, uid)).limit(1);
    if (userList.length === 0 && email) {
      userList = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (userList.length > 0) {
        // Link uid
        await db.update(schema.users).set({ uid }).where(eq(schema.users.id, userList[0].id));
      }
    }

    let u: any;
    if (userList.length > 0) {
      u = userList[0];
      if (!u.active) {
        res.status(403).json({ error: 'Your account has been deactivated.' });
        return;
      }
    } else {
      // First time Google user: associate with primary business as staff
      const biz = await db.select().from(schema.businesses).limit(1);
      const bizId = biz.length > 0 ? biz[0].id : 'biz_smartcore_001';

      const newId = `usr_${Date.now()}`;
      await db.insert(schema.users).values({
        id: newId,
        businessId: bizId,
        uid,
        name,
        email,
        role: 'staff',
        active: true,
      });
      const created = await db.select().from(schema.users).where(eq(schema.users.id, newId)).limit(1);
      u = created[0];
    }

    const token = `smt_tok_${crypto.randomBytes(32).toString('hex')}`;
    activeSessions.set(token, {
      userId: u.id,
      businessId: u.businessId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });

    const businessList = await db.select().from(schema.businesses).where(eq(schema.businesses.id, u.businessId)).limit(1);

    await logServerAudit(u.businessId, u.id, u.name, u.role, 'login', 'user', u.id, `User authenticated via Google`);

    res.json({
      token,
      user: {
        id: u.id,
        businessId: u.businessId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        active: u.active,
        permissions: u.permissions,
      },
      business: businessList[0] || null,
    });
  } catch (err: any) {
    console.error('Firebase login error:', err);
    res.status(401).json({ error: 'Firebase authentication failed' });
  }
});

// Current User Details
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const biz = await db.select().from(schema.businesses).where(eq(schema.businesses.id, req.businessId!)).limit(1);
    res.json({
      user: req.user,
      business: biz[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user state' });
  }
});

// Logout
app.post('/api/auth/logout', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.token) {
    activeSessions.delete(req.token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// 2. BUSINESS PROFILE & SETTINGS
// ==========================================

app.get('/api/business', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const biz = await db.select().from(schema.businesses).where(eq(schema.businesses.id, req.businessId!)).limit(1);
    res.json(biz[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

app.put('/api/business', requireAuth, requirePermission('manage_business'), async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    await db.update(schema.businesses)
      .set({
        name: data.name,
        tagline: data.tagline,
        address: data.address,
        phone: data.phone,
        email: data.email,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        taxRate: Number(data.taxRate) || 7.5,
        enableTax: Boolean(data.enableTax),
        bankName: data.bankName,
        bankAccountName: data.accountName || data.bankAccountName,
        bankAccountNumber: data.accountNumber || data.bankAccountNumber,
        includeBankOnReceipts: Boolean(data.includeBankDetailsInReminders ?? data.includeBankOnReceipts),
        updatedAt: new Date(),
      })
      .where(eq(schema.businesses.id, req.businessId!));

    const updated = await db.select().from(schema.businesses).where(eq(schema.businesses.id, req.businessId!)).limit(1);
    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'update', 'settings', req.businessId!, 'Updated business profile and financial settings');

    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update business settings' });
  }
});

// ==========================================
// 3. TEAM MEMBERS & RBAC MANAGEMENT
// ==========================================

app.get('/api/users', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userList = await db.select().from(schema.users).where(eq(schema.users.businessId, req.businessId!));
    const safeUsers = userList.map(u => ({
      id: u.id,
      businessId: u.businessId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      active: u.active,
      permissions: u.permissions,
      createdAt: u.createdAt,
    }));
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load team members' });
  }
});

app.post('/api/users', requireAuth, requirePermission('manage_users'), async (req: AuthRequest, res: Response) => {
  const { name, email, phone, role, password } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Name, email, and role are required' });
    return;
  }

  try {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email.trim().toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: 'A team member with this email already exists' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password || 'smartcore123', 10);
    const newId = `usr_${Date.now()}`;
    await db.insert(schema.users).values({
      id: newId,
      businessId: req.businessId!,
      uid: newId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      role,
      active: true,
      passwordHash,
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'create', 'user', newId, `Added team member ${name} (${role})`);
    res.json({ success: true, id: newId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

// Update Role with Sole Owner Protection
app.put('/api/users/:id/role', requireAuth, requirePermission('manage_users'), async (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const { role } = req.body;

  try {
    const allUsers = (await db.select().from(schema.users).where(eq(schema.users.businessId, req.businessId!))) as any[];
    const protection = validateOwnerProtection(allUsers, targetId, 'change_role', role);
    if (!protection.allowed) {
      res.status(403).json({ error: protection.reason });
      return;
    }

    await db.update(schema.users).set({ role, updatedAt: new Date() }).where(eq(schema.users.id, targetId));
    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'update', 'user', targetId, `Changed role of user ${targetId} to ${role}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Update Permissions
app.put('/api/users/:id/permissions', requireAuth, requirePermission('manage_permissions'), async (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const { permissions } = req.body;

  try {
    const target = await db.select().from(schema.users).where(and(eq(schema.users.id, targetId), eq(schema.users.businessId, req.businessId!))).limit(1);
    if (target.length === 0) {
      res.status(403).json({ error: 'User not found in your business or access denied' });
      return;
    }

    if (target[0].role === 'owner') {
      res.status(400).json({ error: 'Owner possesses all capabilities permanently.' });
      return;
    }

    await db.update(schema.users).set({ permissions, updatedAt: new Date() }).where(and(eq(schema.users.id, targetId), eq(schema.users.businessId, req.businessId!)));
    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'update', 'permissions', targetId, `Customized permissions for ${target[0].name}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// Delete User with Sole Owner Protection
app.delete('/api/users/:id', requireAuth, requirePermission('manage_users'), async (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;

  try {
    const allUsers = (await db.select().from(schema.users).where(eq(schema.users.businessId, req.businessId!))) as any[];
    const protection = validateOwnerProtection(allUsers, targetId, 'delete');
    if (!protection.allowed) {
      res.status(403).json({ error: protection.reason });
      return;
    }

    await db.delete(schema.users).where(eq(schema.users.id, targetId));
    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'delete', 'user', targetId, `Removed team member ${targetId}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

// ==========================================
// 4. CUSTOMERS & DEBTORS
// ==========================================

app.get('/api/customers', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.customers).where(eq(schema.customers.businessId, req.businessId!)).orderBy(desc(schema.customers.updatedAt));
    const parsed = list.map(c => ({
      ...c,
      totalPurchases: Number(c.totalPurchases),
      totalPaid: Number(c.totalPaid),
      outstandingDebt: Number(c.outstandingDebt),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

app.post('/api/customers', requireAuth, requirePermission('create_customer'), async (req: AuthRequest, res: Response) => {
  const { name, phone, email, address, notes } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: 'Customer name and phone number are required' });
    return;
  }

  try {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    await db.insert(schema.customers).values({
      id,
      businessId: req.businessId!,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      totalPurchases: '0.00',
      totalPaid: '0.00',
      outstandingDebt: '0.00',
      createdAt: now,
      updatedAt: now,
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'create', 'customer', id, `Registered customer: ${name}`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', requireAuth, requirePermission('edit_customer'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const { name, phone, email, address, notes } = req.body;

  try {
    const now = new Date().toISOString();
    await db.update(schema.customers)
      .set({
        name: name?.trim(),
        phone: phone?.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        updatedAt: now,
      })
      .where(and(eq(schema.customers.id, id), eq(schema.customers.businessId, req.businessId!)));

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'update', 'customer', id, `Updated customer: ${name}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', requireAuth, requirePermission('delete_customer'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  try {
    await db.delete(schema.customers).where(and(eq(schema.customers.id, id), eq(schema.customers.businessId, req.businessId!)));
    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'delete', 'customer', id, `Deleted customer ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ==========================================
// 5. PRODUCTS & SERVICES
// ==========================================

app.get('/api/products', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.products).where(eq(schema.products.businessId, req.businessId!)).orderBy(desc(schema.products.updatedAt));
    const parsed = list.map(p => ({
      ...p,
      sellingPrice: Number(p.sellingPrice),
      costPrice: Number(p.costPrice),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.post('/api/products', requireAuth, requirePermission('create_product'), async (req: AuthRequest, res: Response) => {
  const data = req.body;
  if (!data.name || !data.category) {
    res.status(400).json({ error: 'Product name and category are required' });
    return;
  }

  try {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    await db.insert(schema.products).values({
      id,
      businessId: req.businessId!,
      name: data.name.trim(),
      type: data.type || 'service',
      sellingPrice: String(data.sellingPrice || 0),
      costPrice: String(data.costPrice || 0),
      sku: data.sku?.trim() || null,
      category: data.category.trim(),
      description: data.description?.trim() || null,
      openingStock: Number(data.openingStock) || 0,
      currentStock: Number(data.currentStock) || 0,
      minStockLevel: Number(data.minStockLevel) || 0,
      active: data.active ?? true,
      createdAt: now,
      updatedAt: now,
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'create', 'product', id, `Added ${data.type}: ${data.name}`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', requireAuth, requirePermission('edit_product'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const now = new Date().toISOString();
    await db.update(schema.products)
      .set({
        name: data.name?.trim(),
        type: data.type,
        sellingPrice: data.sellingPrice !== undefined ? String(data.sellingPrice) : undefined,
        costPrice: data.costPrice !== undefined ? String(data.costPrice) : undefined,
        sku: data.sku?.trim() || null,
        category: data.category?.trim(),
        description: data.description?.trim() || null,
        currentStock: data.currentStock !== undefined ? Number(data.currentStock) : undefined,
        minStockLevel: data.minStockLevel !== undefined ? Number(data.minStockLevel) : undefined,
        active: data.active !== undefined ? Boolean(data.active) : undefined,
        updatedAt: now,
      })
      .where(and(eq(schema.products.id, id), eq(schema.products.businessId, req.businessId!)));

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'update', 'product', id, `Updated product: ${data.name}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAuth, requirePermission('delete_product'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  try {
    await db.delete(schema.products).where(and(eq(schema.products.id, id), eq(schema.products.businessId, req.businessId!)));
    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'delete', 'product', id, `Deleted product ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==========================================
// 6. SALES & ATOMIC INVOICE NUMBERING
// ==========================================

app.get('/api/sales', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const canViewProfit = req.user ? hasPermission(req.user, 'view_profit') : false;
    const salesList = await db.select().from(schema.sales).where(eq(schema.sales.businessId, req.businessId!)).orderBy(desc(schema.sales.date), desc(schema.sales.time));

    let itemsList: any[] = [];
    if (salesList.length > 0) {
      itemsList = await db.select({
        id: schema.saleItems.id,
        saleId: schema.saleItems.saleId,
        productId: schema.saleItems.productId,
        productName: schema.saleItems.productName,
        type: schema.saleItems.type,
        quantity: schema.saleItems.quantity,
        unitPrice: schema.saleItems.unitPrice,
        costPrice: schema.saleItems.costPrice,
        discount: schema.saleItems.discount,
        total: schema.saleItems.total,
      })
      .from(schema.saleItems)
      .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
      .where(eq(schema.sales.businessId, req.businessId!));
    }

    const itemsBySale = new Map<string, any[]>();
    for (const item of itemsList) {
      const arr = itemsBySale.get(item.saleId) || [];
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
      arr.push(itemObj);
      itemsBySale.set(item.saleId, arr);
    }

    const fullSales = salesList.map(s => ({
      ...s,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      taxAmount: Number(s.taxAmount),
      totalAmount: Number(s.totalAmount),
      amountPaid: Number(s.amountPaid),
      balanceDue: Number(s.balanceDue),
      items: itemsBySale.get(s.id) || [],
    }));

    res.json(fullSales);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load sales' });
  }
});

// Create Sale with Atomic Sequence & Closed-Day Protection
app.post('/api/sales', requireAuth, requirePermission('create_sale'), async (req: AuthRequest, res: Response) => {
  const data = req.body;
  if (!Array.isArray(data.items) || data.items.length === 0) {
    res.status(400).json({ error: 'At least one sale item is required' });
    return;
  }

  const saleDate = data.date || new Date().toISOString().slice(0, 10);

  // Closed-Day Check: Cannot record on a closed business day
  const closedRecon = await db.select().from(schema.dailyReconciliations)
    .where(and(
      eq(schema.dailyReconciliations.businessId, req.businessId!),
      eq(schema.dailyReconciliations.date, saleDate),
      eq(schema.dailyReconciliations.status, 'closed')
    ))
    .limit(1);

  if (closedRecon.length > 0) {
    res.status(403).json({
      error: `Business day for ${saleDate} has been formally closed and locked. Modifying or adding sales to a closed day is prohibited without an authorized adjustment.`,
    });
    return;
  }

  try {
    // ATOMIC INVOICE NUMBER GENERATION VIA POSTGRES TRANSACTION
    const result = await db.transaction(async (tx) => {
      // Lock the business row for update to prevent concurrent race conditions
      const bizRows = await tx.select().from(schema.businesses).where(eq(schema.businesses.id, req.businessId!)).for('update');
      if (bizRows.length === 0) throw new Error('Business record not found');
      const biz = bizRows[0];

      // Query max existing sequence from sales table
      const maxSeqQuery = await tx.execute(
        sql`SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) as max_seq FROM sales WHERE business_id = ${req.businessId!}`
      );
      const dbMaxSeq = Number((maxSeqQuery.rows[0] as any)?.max_seq) || 0;

      const baseSeq = Math.max(biz.lastInvoiceSequence || 100, dbMaxSeq);
      const nextSeq = baseSeq + 1;

      const currentYear = new Date().getFullYear();
      const prefix = biz.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'SMT';
      const invoiceNumber = `${prefix}-${currentYear}-${String(nextSeq).padStart(3, '0')}`;

      // Advance sequence counter atomically
      await tx.update(schema.businesses).set({ lastInvoiceSequence: nextSeq, updatedAt: new Date() }).where(eq(schema.businesses.id, req.businessId!));

      // Calculate authoritative financial totals
      const calculated = calculateSaleTotals(
        data.items,
        data.discount || 0,
        biz.taxRate,
        biz.enableTax,
        data.amountPaid || 0
      );

      const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const saleTime = data.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Insert Sale
      await tx.insert(schema.sales).values({
        id: saleId,
        businessId: req.businessId!,
        invoiceNumber,
        date: saleDate,
        time: saleTime,
        customerId: data.customerId || null,
        customerName: (data.customerName || 'Walk-in Customer').trim(),
        customerPhone: data.customerPhone?.trim() || null,
        subtotal: String(calculated.subtotal),
        discount: String(calculated.totalDiscount),
        taxAmount: String(calculated.taxAmount),
        totalAmount: String(calculated.totalAmount),
        paymentMethod: data.paymentMethod || 'Cash',
        paymentStatus: calculated.paymentStatus,
        amountPaid: String(Math.min(data.amountPaid || 0, calculated.totalAmount)),
        balanceDue: String(calculated.balanceDue),
        notes: data.notes?.trim() || null,
        recordedByUserId: req.user!.id,
        recordedByUserName: req.user!.name,
        createdAt: now,
        updatedAt: now,
      });

      // Insert Sale Items & Deduct Stock
      for (const item of data.items) {
        const itemId = `sitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await tx.insert(schema.saleItems).values({
          id: itemId,
          saleId,
          productId: item.productId,
          productName: item.productName,
          type: item.type || 'service',
          quantity: item.quantity,
          unitPrice: String(item.unitPrice || 0),
          costPrice: String(item.costPrice || 0),
          discount: String(item.discount || 0),
          total: String(item.total || 0),
        });

        // Deduct inventory if product
        if (item.type === 'product' && item.productId) {
          await tx.execute(
            sql`UPDATE products SET current_stock = GREATEST(0, current_stock - ${item.quantity}), updated_at = ${now} WHERE id = ${item.productId}`
          );
        }
      }

      // Update Customer Debt/Purchases if linked
      if (data.customerId) {
        await tx.execute(
          sql`UPDATE customers SET 
                total_purchases = total_purchases + ${calculated.totalAmount},
                total_paid = total_paid + ${calculated.totalAmount - calculated.balanceDue},
                outstanding_debt = outstanding_debt + ${calculated.balanceDue},
                updated_at = ${now}
              WHERE id = ${data.customerId}`
        );
      }

      return { saleId, invoiceNumber, calculated };
    });

    await logServerAudit(
      req.businessId!,
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'create',
      'sale',
      result.saleId,
      `Recorded Sale ${result.invoiceNumber} (${req.user!.name}) for ₦${result.calculated.totalAmount.toLocaleString()}`
    );

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Failed to create sale:', err);
    res.status(500).json({ error: err.message || 'Failed to record sale' });
  }
});

// Update Sale with Atomic Recalculation, Stock Rebalance, Customer Balance Adjustment, and Closed-Day Protection
app.put('/api/sales/:id', requireAuth, requirePermission('edit_sale'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const saleList = await db.select().from(schema.sales).where(and(eq(schema.sales.id, id), eq(schema.sales.businessId, req.businessId!))).limit(1);
    if (saleList.length === 0) {
      res.status(404).json({ error: 'Sale record not found' });
      return;
    }
    const currentSale = saleList[0];
    const targetDate = data.date || currentSale.date;

    // Closed-Day Check on both original date and new date
    const checkDates = [currentSale.date];
    if (targetDate !== currentSale.date) {
      checkDates.push(targetDate);
    }

    const closedRecon = await db.select().from(schema.dailyReconciliations)
      .where(and(
        eq(schema.dailyReconciliations.businessId, req.businessId!),
        inArray(schema.dailyReconciliations.date, checkDates),
        eq(schema.dailyReconciliations.status, 'closed')
      ))
      .limit(1);

    if (closedRecon.length > 0) {
      res.status(403).json({
        error: `Cannot modify sale from ${closedRecon[0].date}: Business day has been closed and locked. Use an authorized adjustment workflow.`,
      });
      return;
    }

    const updatedSale = await db.transaction(async (tx) => {
      // Lock business row for taxes
      const bizRows = await tx.select().from(schema.businesses).where(eq(schema.businesses.id, req.businessId!)).for('update');
      if (bizRows.length === 0) throw new Error('Business record not found');
      const biz = bizRows[0];

      // Existing items
      const existingItems = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, id));

      // Items to use: if data.items is provided and has items, use those; else reconstruct from existing items
      const itemsToUse = Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : existingItems.map(it => ({
            productId: it.productId,
            productName: it.productName,
            type: it.type,
            quantity: it.quantity,
            unitPrice: Number(it.unitPrice),
            costPrice: Number(it.costPrice),
            discount: Number(it.discount),
            total: Number(it.total),
          }));

      const newDiscount = data.discount !== undefined ? Number(data.discount) : Number(currentSale.discount);
      const newAmountPaid = data.amountPaid !== undefined ? Number(data.amountPaid) : Number(currentSale.amountPaid);

      const calculated = calculateSaleTotals(
        itemsToUse,
        newDiscount,
        biz.taxRate,
        biz.enableTax,
        newAmountPaid
      );

      const now = new Date().toISOString();

      // If items were updated, reverse old stock deduction and apply new stock deduction
      if (Array.isArray(data.items) && data.items.length > 0) {
        for (const oldItem of existingItems) {
          if (oldItem.type === 'product' && oldItem.productId) {
            await tx.execute(
              sql`UPDATE products SET current_stock = current_stock + ${oldItem.quantity}, updated_at = ${now} WHERE id = ${oldItem.productId}`
            );
          }
        }

        // Delete old items and insert new items
        await tx.delete(schema.saleItems).where(eq(schema.saleItems.saleId, id));

        for (const item of data.items) {
          const itemId = `sitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await tx.insert(schema.saleItems).values({
            id: itemId,
            saleId: id,
            productId: item.productId,
            productName: item.productName,
            type: item.type || 'service',
            quantity: item.quantity,
            unitPrice: String(item.unitPrice || 0),
            costPrice: String(item.costPrice || 0),
            discount: String(item.discount || 0),
            total: String(item.total || 0),
          });

          if (item.type === 'product' && item.productId) {
            await tx.execute(
              sql`UPDATE products SET current_stock = GREATEST(0, current_stock - ${item.quantity}), updated_at = ${now} WHERE id = ${item.productId}`
            );
          }
        }
      }

      // Customer debt/total balance adjustment
      const oldCustomerId = currentSale.customerId;
      const newCustomerId = data.customerId !== undefined ? data.customerId : oldCustomerId;

      // Reverse old customer effect
      if (oldCustomerId) {
        await tx.execute(
          sql`UPDATE customers SET 
                total_purchases = GREATEST(0, total_purchases - ${Number(currentSale.totalAmount)}),
                total_paid = GREATEST(0, total_paid - ${Number(currentSale.amountPaid)}),
                outstanding_debt = GREATEST(0, outstanding_debt - ${Number(currentSale.balanceDue)}),
                updated_at = ${now}
              WHERE id = ${oldCustomerId}`
        );
      }

      // Apply new customer effect
      if (newCustomerId) {
        await tx.execute(
          sql`UPDATE customers SET 
                total_purchases = total_purchases + ${calculated.totalAmount},
                total_paid = total_paid + ${calculated.totalAmount - calculated.balanceDue},
                outstanding_debt = outstanding_debt + ${calculated.balanceDue},
                updated_at = ${now}
              WHERE id = ${newCustomerId}`
        );
      }

      // Update sale record
      await tx.update(schema.sales)
        .set({
          date: targetDate,
          time: data.time || currentSale.time,
          customerId: newCustomerId || null,
          customerName: data.customerName ? data.customerName.trim() : currentSale.customerName,
          customerPhone: data.customerPhone !== undefined ? (data.customerPhone?.trim() || null) : currentSale.customerPhone,
          subtotal: String(calculated.subtotal),
          discount: String(calculated.totalDiscount),
          taxAmount: String(calculated.taxAmount),
          totalAmount: String(calculated.totalAmount),
          paymentMethod: data.paymentMethod || currentSale.paymentMethod,
          paymentStatus: calculated.paymentStatus,
          amountPaid: String(Math.min(newAmountPaid, calculated.totalAmount)),
          balanceDue: String(calculated.balanceDue),
          notes: data.notes !== undefined ? (data.notes?.trim() || null) : currentSale.notes,
          updatedAt: now,
        })
        .where(eq(schema.sales.id, id));

      const updated = await tx.select().from(schema.sales).where(eq(schema.sales.id, id)).limit(1);
      return updated[0];
    });

    await logServerAudit(
      req.businessId!,
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'update',
      'sale',
      id,
      `Updated sale ${currentSale.invoiceNumber}`
    );

    res.json({ success: true, sale: updatedSale });
  } catch (err: any) {
    console.error('Failed to update sale:', err);
    res.status(500).json({ error: err.message || 'Failed to update sale' });
  }
});

// Delete Sale with Closed-Day Protection
app.delete('/api/sales/:id', requireAuth, requirePermission('delete_sale'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  try {
    const saleList = await db.select().from(schema.sales).where(and(eq(schema.sales.id, id), eq(schema.sales.businessId, req.businessId!))).limit(1);
    if (saleList.length === 0) {
      res.status(404).json({ error: 'Sale record not found' });
      return;
    }
    const sale = saleList[0];

    // Closed-Day Check: Prohibit deleting a sale on a closed business day
    const closedRecon = await db.select().from(schema.dailyReconciliations)
      .where(and(
        eq(schema.dailyReconciliations.businessId, req.businessId!),
        eq(schema.dailyReconciliations.date, sale.date),
        eq(schema.dailyReconciliations.status, 'closed')
      ))
      .limit(1);

    if (closedRecon.length > 0) {
      res.status(403).json({
        error: `Cannot delete sale from ${sale.date}: That business day has already been balanced, closed, and locked. Use an adjustment workflow instead.`,
      });
      return;
    }

    await db.transaction(async (tx) => {
      // Reverse customer balance
      if (sale.customerId) {
        await tx.execute(
          sql`UPDATE customers SET 
                total_purchases = GREATEST(0, total_purchases - ${Number(sale.totalAmount)}),
                total_paid = GREATEST(0, total_paid - ${Number(sale.amountPaid)}),
                outstanding_debt = GREATEST(0, outstanding_debt - ${Number(sale.balanceDue)}),
                updated_at = ${new Date().toISOString()}
              WHERE id = ${sale.customerId}`
        );
      }

      // Delete sale items & sale
      await tx.delete(schema.saleItems).where(eq(schema.saleItems.saleId, id));
      await tx.delete(schema.sales).where(eq(schema.sales.id, id));
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'delete', 'sale', id, `Deleted sale ${sale.invoiceNumber} (${sale.customerName})`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete sale' });
  }
});

// ==========================================
// 7. EXPENSES
// ==========================================

app.get('/api/expenses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.expenses).where(eq(schema.expenses.businessId, req.businessId!)).orderBy(desc(schema.expenses.date), desc(schema.expenses.time));
    const parsed = list.map(e => ({
      ...e,
      amount: Number(e.amount),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load expenses' });
  }
});

app.post('/api/expenses', requireAuth, requirePermission('create_expense'), async (req: AuthRequest, res: Response) => {
  const data = req.body;
  const numAmount = Number(data.amount);
  if (!numAmount || numAmount <= 0) {
    res.status(400).json({ error: 'A positive expense amount is required' });
    return;
  }

  const expDate = data.date || new Date().toISOString().slice(0, 10);

  // Closed-Day Check
  const closedRecon = await db.select().from(schema.dailyReconciliations)
    .where(and(
      eq(schema.dailyReconciliations.businessId, req.businessId!),
      eq(schema.dailyReconciliations.date, expDate),
      eq(schema.dailyReconciliations.status, 'closed')
    ))
    .limit(1);

  if (closedRecon.length > 0) {
    res.status(403).json({
      error: `Register for ${expDate} has been closed and locked. Cannot add retroactive expenses without an adjustment.`,
    });
    return;
  }

  try {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    await db.insert(schema.expenses).values({
      id,
      businessId: req.businessId!,
      date: expDate,
      time: data.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      category: data.category || 'General',
      description: data.description?.trim() || 'Business expense',
      amount: String(numAmount),
      paymentMethod: data.paymentMethod || 'Cash',
      vendorName: data.vendorName?.trim() || 'General Vendor',
      referenceNumber: data.referenceNumber?.trim() || null,
      notes: data.notes?.trim() || null,
      recordedByUserId: req.user!.id,
      recordedByUserName: req.user!.name,
      recurringExpenseId: data.recurringExpenseId || null,
      occurrenceKey: data.occurrenceKey || null,
      createdAt: now,
      updatedAt: now,
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'create', 'expense', id, `Recorded expense of ₦${numAmount.toLocaleString()} (${data.category})`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

// Update Expense with Closed-Day Protection
app.put('/api/expenses/:id', requireAuth, requirePermission('edit_expense'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const expList = await db.select().from(schema.expenses).where(and(eq(schema.expenses.id, id), eq(schema.expenses.businessId, req.businessId!))).limit(1);
    if (expList.length === 0) {
      res.status(404).json({ error: 'Expense record not found' });
      return;
    }
    const currentExp = expList[0];
    const targetDate = data.date || currentExp.date;

    const checkDates = [currentExp.date];
    if (targetDate !== currentExp.date) {
      checkDates.push(targetDate);
    }

    const closedRecon = await db.select().from(schema.dailyReconciliations)
      .where(and(
        eq(schema.dailyReconciliations.businessId, req.businessId!),
        inArray(schema.dailyReconciliations.date, checkDates),
        eq(schema.dailyReconciliations.status, 'closed')
      ))
      .limit(1);

    if (closedRecon.length > 0) {
      res.status(403).json({
        error: `Cannot modify expense from ${closedRecon[0].date}: Register for that day has been closed and locked.`,
      });
      return;
    }

    let numAmount: number | undefined = undefined;
    if (data.amount !== undefined) {
      numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'A positive expense amount is required' });
        return;
      }
    }

    const now = new Date().toISOString();
    await db.update(schema.expenses)
      .set({
        date: targetDate,
        time: data.time || currentExp.time,
        category: data.category ? data.category.trim() : currentExp.category,
        description: data.description ? data.description.trim() : currentExp.description,
        amount: numAmount !== undefined ? String(numAmount) : currentExp.amount,
        paymentMethod: data.paymentMethod || currentExp.paymentMethod,
        vendorName: data.vendorName ? data.vendorName.trim() : currentExp.vendorName,
        referenceNumber: data.referenceNumber !== undefined ? (data.referenceNumber?.trim() || null) : currentExp.referenceNumber,
        notes: data.notes !== undefined ? (data.notes?.trim() || null) : currentExp.notes,
        updatedAt: now,
      })
      .where(eq(schema.expenses.id, id));

    await logServerAudit(
      req.businessId!,
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'update',
      'expense',
      id,
      `Updated expense: ${data.description || currentExp.description}`
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', requireAuth, requirePermission('delete_expense'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  try {
    const expList = await db.select().from(schema.expenses).where(and(eq(schema.expenses.id, id), eq(schema.expenses.businessId, req.businessId!))).limit(1);
    if (expList.length === 0) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    const exp = expList[0];

    // Closed-Day Check
    const closedRecon = await db.select().from(schema.dailyReconciliations)
      .where(and(
        eq(schema.dailyReconciliations.businessId, req.businessId!),
        eq(schema.dailyReconciliations.date, exp.date),
        eq(schema.dailyReconciliations.status, 'closed')
      ))
      .limit(1);

    if (closedRecon.length > 0) {
      res.status(403).json({
        error: `Cannot delete expense from ${exp.date}: Register for that day has been closed and locked.`,
      });
      return;
    }

    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'delete', 'expense', id, `Deleted expense: ${exp.description}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ==========================================
// 8. DEBT PAYMENTS & PAYABLES
// ==========================================

app.get('/api/payables', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.payables).where(eq(schema.payables.businessId, req.businessId!)).orderBy(desc(schema.payables.updatedAt));
    const parsed = list.map(p => ({
      ...p,
      totalAmount: Number(p.totalAmount),
      amountPaid: Number(p.amountPaid),
      balanceDue: Number(p.balanceDue),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payables' });
  }
});

app.post('/api/payables', requireAuth, async (req: AuthRequest, res: Response) => {
  const data = req.body;
  try {
    const id = `py_${Date.now()}`;
    const now = new Date().toISOString();
    const totalAmount = Number(data.totalAmount) || 0;
    const amountPaid = Number(data.amountPaid) || 0;
    const balanceDue = Math.max(0, totalAmount - amountPaid);
    const status = balanceDue === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

    await db.insert(schema.payables).values({
      id,
      businessId: req.businessId!,
      vendorName: data.vendorName?.trim() || 'Vendor',
      description: data.description?.trim() || 'Supplies',
      totalAmount: String(totalAmount),
      amountPaid: String(amountPaid),
      balanceDue: String(balanceDue),
      dueDate: data.dueDate || null,
      status,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'create', 'payable', id, `Recorded payable for ${data.vendorName}: ₦${totalAmount.toLocaleString()}`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payable' });
  }
});

app.get('/api/debt-payments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.debtPayments).where(eq(schema.debtPayments.businessId, req.businessId!)).orderBy(desc(schema.debtPayments.date));
    res.json(list.map(d => ({ ...d, amount: Number(d.amount) })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load debt payments' });
  }
});

app.post('/api/debt-payments', requireAuth, async (req: AuthRequest, res: Response) => {
  const data = req.body;
  const numAmount = Number(data.amount);
  if (!numAmount || numAmount <= 0) {
    res.status(400).json({ error: 'A positive payment amount is required' });
    return;
  }

  try {
    const id = `pay_${Date.now()}`;
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx.insert(schema.debtPayments).values({
        id,
        businessId: req.businessId!,
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: data.targetName,
        amount: String(numAmount),
        date: data.date || new Date().toISOString().slice(0, 10),
        time: data.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        paymentMethod: data.paymentMethod || 'Cash',
        reference: data.reference || null,
        notes: data.notes || null,
        recordedByUserId: req.user!.id,
        recordedByUserName: req.user!.name,
        createdAt: now,
      });

      if (data.targetType === 'customer') {
        await tx.execute(
          sql`UPDATE customers SET 
                total_paid = total_paid + ${numAmount},
                outstanding_debt = GREATEST(0, outstanding_debt - ${numAmount}),
                updated_at = ${now}
              WHERE id = ${data.targetId}`
        );
      } else if (data.targetType === 'payable') {
        await tx.execute(
          sql`UPDATE payables SET 
                amount_paid = amount_paid + ${numAmount},
                balance_due = GREATEST(0, balance_due - ${numAmount}),
                status = CASE WHEN (balance_due - ${numAmount}) <= 0 THEN 'paid' ELSE 'partial' END,
                updated_at = ${now}
              WHERE id = ${data.targetId}`
        );
      }
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'debt_settled', 'customer', data.targetId, `Collected debt payment of ₦${numAmount.toLocaleString()} from ${data.targetName}`);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record debt payment' });
  }
});

// ==========================================
// 9. RECURRING EXPENSES
// ==========================================

app.get('/api/recurring-expenses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.recurringExpenses).where(eq(schema.recurringExpenses.businessId, req.businessId!)).orderBy(desc(schema.recurringExpenses.updatedAt));
    res.json(list.map(r => ({ ...r, amount: Number(r.amount) })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load recurring expenses' });
  }
});

// ==========================================
// 10. DAILY BUSINESS RECONCILIATION
// ==========================================

app.get('/api/reconciliation', requireAuth, requirePermission('view_reconciliation'), async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.dailyReconciliations).where(eq(schema.dailyReconciliations.businessId, req.businessId!)).orderBy(desc(schema.dailyReconciliations.date));
    const parsed = list.map(r => ({
      ...r,
      openingFloat: Number(r.openingFloat),
      systemCashSales: Number(r.systemCashSales),
      systemPosSales: Number(r.systemPosSales),
      systemTransferSales: Number(r.systemTransferSales),
      systemDebtCashCollected: Number(r.systemDebtCashCollected),
      systemCashExpenses: Number(r.systemCashExpenses),
      cashDrop: Number(r.cashDrop),
      expectedCashInHand: Number(r.expectedCashInHand),
      actualCashCounted: Number(r.actualCashCounted),
      actualPosSettlement: Number(r.actualPosSettlement),
      actualTransferSettlement: Number(r.actualTransferSettlement),
      cashVariance: Number(r.cashVariance),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reconciliations' });
  }
});

// Compute live server totals for date
app.get('/api/reconciliation/system-totals', requireAuth, requirePermission('view_reconciliation'), async (req: AuthRequest, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

  try {
    // Sales on date
    const daySales = await db.select().from(schema.sales).where(and(eq(schema.sales.businessId, req.businessId!), eq(schema.sales.date, date)));
    const systemCashSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );
    const systemPosSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'POS' || s.paymentMethod === 'Card').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );
    const systemTransferSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'Bank Transfer').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );

    // Debt collections
    const dayDebtPayments = await db.select().from(schema.debtPayments).where(and(eq(schema.debtPayments.businessId, req.businessId!), eq(schema.debtPayments.date, date)));
    const systemDebtCashCollected = roundToKobo(
      dayDebtPayments.filter(p => p.targetType === 'customer' && p.paymentMethod === 'Cash').reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    // Cash expenses
    const dayExpenses = await db.select().from(schema.expenses).where(and(eq(schema.expenses.businessId, req.businessId!), eq(schema.expenses.date, date)));
    const systemCashExpenses = roundToKobo(
      dayExpenses.filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    );

    res.json({
      systemCashSales,
      systemPosSales,
      systemTransferSales,
      systemDebtCashCollected,
      systemCashExpenses,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate day totals' });
  }
});

// Open Register
app.post('/api/reconciliation/open', requireAuth, requirePermission('manage_reconciliation'), async (req: AuthRequest, res: Response) => {
  const { openingFloat, notes } = req.body;
  const todayDate = new Date().toISOString().slice(0, 10);
  const safeFloat = Math.max(0, roundToKobo(Number(openingFloat) || 0));

  try {
    const existing = await db.select().from(schema.dailyReconciliations).where(and(eq(schema.dailyReconciliations.businessId, req.businessId!), eq(schema.dailyReconciliations.date, todayDate))).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: `Register for ${todayDate} is already ${existing[0].status}.` });
      return;
    }

    const id = `recon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await db.insert(schema.dailyReconciliations).values({
      id,
      businessId: req.businessId!,
      date: todayDate,
      openedAt: now,
      openedByUserId: req.user!.id,
      openedByUserName: req.user!.name,
      status: 'open',
      openingFloat: String(safeFloat),
      systemCashSales: '0.00',
      systemPosSales: '0.00',
      systemTransferSales: '0.00',
      systemDebtCashCollected: '0.00',
      systemCashExpenses: '0.00',
      cashDrop: '0.00',
      expectedCashInHand: String(safeFloat),
      actualCashCounted: '0.00',
      actualPosSettlement: '0.00',
      actualTransferSettlement: '0.00',
      cashVariance: '0.00',
      reconciliationNotes: notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'open_day', 'reconciliation', id, `Opened business register for ${todayDate} with opening float ₦${safeFloat.toLocaleString()}`);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to open register' });
  }
});

// Close Register
app.post('/api/reconciliation/:id/close', requireAuth, requirePermission('manage_reconciliation'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const { actualCashCounted, actualPosSettlement, actualTransferSettlement, cashDrop, varianceReason, reconciliationNotes } = req.body;

  try {
    const recList = await db.select().from(schema.dailyReconciliations).where(and(eq(schema.dailyReconciliations.id, id), eq(schema.dailyReconciliations.businessId, req.businessId!))).limit(1);
    if (recList.length === 0) {
      res.status(404).json({ error: 'Reconciliation record not found' });
      return;
    }
    const rec = recList[0];
    if (rec.status !== 'open') {
      res.status(400).json({ error: `Register is already marked as ${rec.status}.` });
      return;
    }

    // Pull authoritative system transactions for this exact day
    const daySales = await db.select().from(schema.sales).where(and(eq(schema.sales.businessId, req.businessId!), eq(schema.sales.date, rec.date)));
    const systemCashSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );
    const systemPosSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'POS' || s.paymentMethod === 'Card').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );
    const systemTransferSales = roundToKobo(
      daySales.filter(s => s.paymentMethod === 'Bank Transfer').reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
    );

    const dayDebtPayments = await db.select().from(schema.debtPayments).where(and(eq(schema.debtPayments.businessId, req.businessId!), eq(schema.debtPayments.date, rec.date)));
    const systemDebtCashCollected = roundToKobo(
      dayDebtPayments.filter(p => p.targetType === 'customer' && p.paymentMethod === 'Cash').reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    const dayExpenses = await db.select().from(schema.expenses).where(and(eq(schema.expenses.businessId, req.businessId!), eq(schema.expenses.date, rec.date)));
    const systemCashExpenses = roundToKobo(
      dayExpenses.filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    );

    const safeDrop = Math.max(0, roundToKobo(Number(cashDrop) || 0));
    const safeCounted = Math.max(0, roundToKobo(Number(actualCashCounted) || 0));
    const openingFloat = Number(rec.openingFloat) || 0;

    const expectedCashInHand = calculateExpectedCash(
      openingFloat,
      systemCashSales,
      systemDebtCashCollected,
      systemCashExpenses,
      safeDrop
    );

    const varianceResult = calculateReconciliationVariance(safeCounted, expectedCashInHand);

    // Enforcement: If variance is detected, a reason is mandatory
    if (!varianceResult.isBalanced && (!varianceReason || !varianceReason.trim())) {
      res.status(400).json({
        error: `Variance of ₦${Math.abs(varianceResult.variance).toLocaleString()} detected. A variance explanation reason is mandatory before closing the business day.`,
      });
      return;
    }

    const now = new Date().toISOString();
    await db.update(schema.dailyReconciliations)
      .set({
        systemCashSales: String(systemCashSales),
        systemPosSales: String(systemPosSales),
        systemTransferSales: String(systemTransferSales),
        systemDebtCashCollected: String(systemDebtCashCollected),
        systemCashExpenses: String(systemCashExpenses),
        cashDrop: String(safeDrop),
        expectedCashInHand: String(expectedCashInHand),
        actualCashCounted: String(safeCounted),
        actualPosSettlement: String(roundToKobo(Number(actualPosSettlement) || 0)),
        actualTransferSettlement: String(roundToKobo(Number(actualTransferSettlement) || 0)),
        cashVariance: String(varianceResult.variance),
        varianceReason: varianceReason?.trim() || null,
        reconciliationNotes: reconciliationNotes?.trim() || null,
        status: 'closed',
        closedAt: now,
        closedByUserId: req.user!.id,
        closedByUserName: req.user!.name,
        updatedAt: now,
      })
      .where(eq(schema.dailyReconciliations.id, id));

    const varLabel = varianceResult.variance === 0 ? 'Balanced' : `Variance ₦${varianceResult.variance.toLocaleString()}`;
    await logServerAudit(
      req.businessId!,
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'close_day',
      'reconciliation',
      id,
      `Closed business register for ${rec.date}: Counted ₦${safeCounted.toLocaleString()}, Expected ₦${expectedCashInHand.toLocaleString()} (${varLabel})`
    );

    res.json({ success: true, variance: varianceResult.variance });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to close register' });
  }
});

// Authorized Adjustment of Closed Register
app.post('/api/reconciliation/:id/adjust', requireAuth, requirePermission('manage_reconciliation'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const { actualCashCounted, adjustmentReason } = req.body;

  if (!adjustmentReason || !adjustmentReason.trim()) {
    res.status(400).json({ error: 'An authorized adjustment reason is mandatory when modifying a closed register.' });
    return;
  }

  try {
    const recList = await db.select().from(schema.dailyReconciliations).where(and(eq(schema.dailyReconciliations.id, id), eq(schema.dailyReconciliations.businessId, req.businessId!))).limit(1);
    if (recList.length === 0) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    const rec = recList[0];
    const safeCounted = Math.max(0, roundToKobo(Number(actualCashCounted) || 0));
    const expected = Number(rec.expectedCashInHand);
    const varianceResult = calculateReconciliationVariance(safeCounted, expected);

    const now = new Date().toISOString();
    await db.update(schema.dailyReconciliations)
      .set({
        actualCashCounted: String(safeCounted),
        cashVariance: String(varianceResult.variance),
        varianceReason: `[Adjusted] ${adjustmentReason.trim()}`,
        status: 'adjusted',
        updatedAt: now,
      })
      .where(eq(schema.dailyReconciliations.id, id));

    await logServerAudit(
      req.businessId!,
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'adjust_day',
      'reconciliation',
      id,
      `Adjusted closed register for ${rec.date}: New Counted ₦${safeCounted.toLocaleString()}, Reason: ${adjustmentReason}`
    );

    res.json({ success: true, variance: varianceResult.variance });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to adjust reconciliation' });
  }
});

// ==========================================
// 11. AUDIT LOGS
// ==========================================

app.get('/api/audit-logs', requireAuth, requirePermission('view_audit_log'), async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.businessId, req.businessId!)).orderBy(desc(schema.auditLogs.timestamp)).limit(200);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

// Log Client Action (Thermal Print, WhatsApp Reminders)
app.post('/api/audit-logs', requireAuth, async (req: AuthRequest, res: Response) => {
  const { action, entity, entityId, details, metadata } = req.body;
  if (!action || !details) {
    res.status(400).json({ error: 'Action and details are required' });
    return;
  }

  try {
    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, action, entity || 'system', entityId || 'client', details, metadata);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record audit log' });
  }
});

// ==========================================
// 12. LOCALSTORAGE MIGRATION ENDPOINT
// ==========================================

app.post('/api/migrate/import-localstorage', requireAuth, requirePermission('manage_business'), async (req: AuthRequest, res: Response) => {
  const { customers, products, sales, expenses } = req.body;
  let importedCount = 0;

  try {
    await db.transaction(async (tx) => {
      // 1. Customers
      if (Array.isArray(customers)) {
        for (const c of customers) {
          const exists = await tx.select().from(schema.customers).where(eq(schema.customers.id, c.id)).limit(1);
          if (exists.length === 0) {
            await tx.insert(schema.customers).values({
              id: c.id,
              businessId: req.businessId!,
              name: c.name,
              phone: c.phone,
              email: c.email || null,
              address: c.address || null,
              notes: c.notes || null,
              totalPurchases: String(c.totalPurchases || 0),
              totalPaid: String(c.totalPaid || 0),
              outstandingDebt: String(c.outstandingDebt || 0),
              createdAt: c.createdAt || new Date().toISOString(),
              updatedAt: c.updatedAt || new Date().toISOString(),
            });
            importedCount++;
          }
        }
      }

      // 2. Products
      if (Array.isArray(products)) {
        for (const p of products) {
          const exists = await tx.select().from(schema.products).where(eq(schema.products.id, p.id)).limit(1);
          if (exists.length === 0) {
            await tx.insert(schema.products).values({
              id: p.id,
              businessId: req.businessId!,
              name: p.name,
              type: p.type || 'service',
              sellingPrice: String(p.sellingPrice || 0),
              costPrice: String(p.costPrice || 0),
              sku: p.sku || null,
              category: p.category || 'General',
              description: p.description || null,
              openingStock: Number(p.openingStock) || 0,
              currentStock: Number(p.currentStock) || 0,
              minStockLevel: Number(p.minStockLevel) || 0,
              active: p.active ?? true,
              createdAt: p.createdAt || new Date().toISOString(),
              updatedAt: p.updatedAt || new Date().toISOString(),
            });
            importedCount++;
          }
        }
      }

      // 3. Sales & Items
      if (Array.isArray(sales)) {
        for (const s of sales) {
          const exists = await tx.select().from(schema.sales).where(eq(schema.sales.id, s.id)).limit(1);
          if (exists.length === 0) {
            await tx.insert(schema.sales).values({
              id: s.id,
              businessId: req.businessId!,
              invoiceNumber: s.invoiceNumber,
              date: s.date,
              time: s.time || '12:00',
              customerId: s.customerId || null,
              customerName: s.customerName,
              customerPhone: s.customerPhone || null,
              subtotal: String(s.subtotal || 0),
              discount: String(s.discount || 0),
              taxAmount: String(s.taxAmount || 0),
              totalAmount: String(s.totalAmount || 0),
              paymentMethod: s.paymentMethod || 'Cash',
              paymentStatus: s.paymentStatus || 'paid',
              amountPaid: String(s.amountPaid || 0),
              balanceDue: String(s.balanceDue || 0),
              notes: s.notes || null,
              recordedByUserId: s.recordedByUserId || req.user!.id,
              recordedByUserName: s.recordedByUserName || req.user!.name,
              createdAt: s.createdAt || new Date().toISOString(),
              updatedAt: s.updatedAt || new Date().toISOString(),
            });

            if (Array.isArray(s.items)) {
              for (const item of s.items) {
                await tx.insert(schema.saleItems).values({
                  id: item.id || `sitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  saleId: s.id,
                  productId: item.productId || 'p1',
                  productName: item.productName || 'Item',
                  type: item.type || 'service',
                  quantity: item.quantity || 1,
                  unitPrice: String(item.unitPrice || 0),
                  costPrice: String(item.costPrice || 0),
                  discount: String(item.discount || 0),
                  total: String(item.total || 0),
                });
              }
            }
            importedCount++;
          }
        }
      }

      // 4. Expenses
      if (Array.isArray(expenses)) {
        for (const e of expenses) {
          const exists = await tx.select().from(schema.expenses).where(eq(schema.expenses.id, e.id)).limit(1);
          if (exists.length === 0) {
            await tx.insert(schema.expenses).values({
              id: e.id,
              businessId: req.businessId!,
              date: e.date,
              time: e.time || '12:00',
              category: e.category,
              description: e.description,
              amount: String(e.amount || 0),
              paymentMethod: e.paymentMethod || 'Cash',
              vendorName: e.vendorName || 'Vendor',
              referenceNumber: e.referenceNumber || null,
              notes: e.notes || null,
              recordedByUserId: e.recordedByUserId || req.user!.id,
              recordedByUserName: e.recordedByUserName || req.user!.name,
              createdAt: e.createdAt || new Date().toISOString(),
              updatedAt: e.updatedAt || new Date().toISOString(),
            });
            importedCount++;
          }
        }
      }
    });

    await logServerAudit(req.businessId!, req.user!.id, req.user!.name, req.user!.role, 'import', 'system', req.businessId!, `Imported ${importedCount} records from legacy localStorage`);

    res.json({ success: true, importedCount, message: `Successfully imported ${importedCount} records into Cloud SQL.` });
  } catch (err: any) {
    console.error('Migration error:', err);
    res.status(500).json({ error: err.message || 'Failed to migrate localStorage records' });
  }
});

// ==========================================
// 13. VITE / STATIC SERVING & STARTUP
// ==========================================

async function startServer() {
  // Seed database if empty
  try {
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.error('Seed error:', err);
  }

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smartcore Ledger server running on port ${PORT} (Node.js + PostgreSQL)`);
  });
}

startServer();
