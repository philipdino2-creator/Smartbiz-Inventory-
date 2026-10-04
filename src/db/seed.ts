import { db } from './index.ts';
import * as schema from './schema.ts';
import {
  INITIAL_BUSINESS,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS_SERVICES,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_PAYABLES,
  INITIAL_RECURRING_EXPENSES,
  INITIAL_RECONCILIATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData.ts';
import bcrypt from 'bcryptjs';

export async function seedDatabaseIfEmpty() {
  try {
    const existing = await db.select().from(schema.businesses).limit(1);
    if (existing.length > 0) {
      return { seeded: false, message: 'Database already initialized.' };
    }

    console.log('Seeding initial Smartcore ICT Centre records into Cloud SQL...');

    // 1. Business
    await db.insert(schema.businesses).values({
      id: INITIAL_BUSINESS.id,
      name: INITIAL_BUSINESS.name,
      tagline: INITIAL_BUSINESS.tagline,
      address: INITIAL_BUSINESS.address,
      phone: INITIAL_BUSINESS.phone,
      email: INITIAL_BUSINESS.email,
      currency: INITIAL_BUSINESS.currency,
      currencySymbol: INITIAL_BUSINESS.currencySymbol,
      taxRate: INITIAL_BUSINESS.taxRate,
      enableTax: INITIAL_BUSINESS.enableTax,
      bankName: INITIAL_BUSINESS.bankName || null,
      bankAccountName: INITIAL_BUSINESS.accountName || null,
      bankAccountNumber: INITIAL_BUSINESS.accountNumber || null,
      includeBankOnReceipts: INITIAL_BUSINESS.includeBankDetailsInReminders ?? true,
      lastInvoiceSequence: INITIAL_BUSINESS.lastInvoiceSequence || 105,
    });

    // 2. Users with default hashed password for local authentication fallback
    const defaultPasswordHash = bcrypt.hashSync('smartcore123', 10);
    for (const u of INITIAL_USERS) {
      await db.insert(schema.users).values({
        id: u.id,
        businessId: INITIAL_BUSINESS.id,
        uid: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        role: u.role,
        active: u.active,
        permissions: u.permissions || null,
        passwordHash: defaultPasswordHash,
      });
    }

    // 3. Customers
    for (const c of INITIAL_CUSTOMERS) {
      await db.insert(schema.customers).values({
        id: c.id,
        businessId: INITIAL_BUSINESS.id,
        name: c.name,
        phone: c.phone,
        email: c.email || null,
        address: c.address || null,
        notes: c.notes || null,
        totalPurchases: String(c.totalPurchases || 0),
        totalPaid: String(c.totalPaid || 0),
        outstandingDebt: String(c.outstandingDebt || 0),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    // 4. Products & Services
    for (const p of INITIAL_PRODUCTS_SERVICES) {
      await db.insert(schema.products).values({
        id: p.id,
        businessId: INITIAL_BUSINESS.id,
        name: p.name,
        type: p.type,
        sellingPrice: String(p.sellingPrice || 0),
        costPrice: String(p.costPrice || 0),
        sku: p.sku || null,
        category: p.category,
        description: p.description || null,
        openingStock: p.openingStock || 0,
        currentStock: p.currentStock || 0,
        minStockLevel: p.minStockLevel || 0,
        active: p.active,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
    }

    // 5. Sales & Sale Items
    for (const s of INITIAL_SALES) {
      await db.insert(schema.sales).values({
        id: s.id,
        businessId: INITIAL_BUSINESS.id,
        invoiceNumber: s.invoiceNumber,
        date: s.date,
        time: s.time,
        customerId: s.customerId || null,
        customerName: s.customerName,
        customerPhone: s.customerPhone || null,
        subtotal: String(s.subtotal || 0),
        discount: String(s.discount || 0),
        taxAmount: String(s.taxAmount || 0),
        totalAmount: String(s.totalAmount || 0),
        paymentMethod: s.paymentMethod,
        paymentStatus: s.paymentStatus,
        amountPaid: String(s.amountPaid || 0),
        balanceDue: String(s.balanceDue || 0),
        notes: s.notes || null,
        recordedByUserId: s.recordedByUserId,
        recordedByUserName: s.recordedByUserName,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      });

      if (Array.isArray(s.items)) {
        for (const item of s.items) {
          await db.insert(schema.saleItems).values({
            id: item.id,
            saleId: s.id,
            productId: item.productId,
            productName: item.productName,
            type: item.type,
            quantity: item.quantity,
            unitPrice: String(item.unitPrice || 0),
            costPrice: String(item.costPrice || 0),
            discount: String(item.discount || 0),
            total: String(item.total || 0),
          });
        }
      }
    }

    // 6. Expenses
    for (const e of INITIAL_EXPENSES) {
      await db.insert(schema.expenses).values({
        id: e.id,
        businessId: INITIAL_BUSINESS.id,
        date: e.date,
        time: e.time,
        category: e.category,
        description: e.description,
        amount: String(e.amount || 0),
        paymentMethod: e.paymentMethod,
        vendorName: e.vendorName,
        referenceNumber: e.referenceNumber || null,
        notes: e.notes || null,
        recordedByUserId: e.recordedByUserId,
        recordedByUserName: e.recordedByUserName,
        recurringExpenseId: e.recurringExpenseId || null,
        occurrenceKey: e.occurrenceKey || null,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    }

    // 7. Payables
    for (const py of INITIAL_PAYABLES) {
      await db.insert(schema.payables).values({
        id: py.id,
        businessId: INITIAL_BUSINESS.id,
        vendorName: py.vendorName,
        description: py.description,
        totalAmount: String(py.totalAmount || 0),
        amountPaid: String(py.amountPaid || 0),
        balanceDue: String(py.balanceDue || 0),
        dueDate: py.dueDate || null,
        status: py.status,
        notes: py.notes || null,
        createdAt: py.createdAt,
        updatedAt: py.updatedAt,
      });
    }

    // 8. Recurring Expenses
    for (const r of INITIAL_RECURRING_EXPENSES) {
      await db.insert(schema.recurringExpenses).values({
        id: r.id,
        businessId: INITIAL_BUSINESS.id,
        category: r.category,
        description: r.description,
        amount: String(r.amount || 0),
        frequency: r.frequency,
        paymentMethod: r.paymentMethod,
        vendorName: r.vendorName,
        nextDueDate: r.nextDueDate,
        status: r.status,
        autoRecord: (r as any).autoRecord ?? false,
        notes: r.notes || null,
        lastGeneratedDate: r.lastGeneratedDate || null,
        generatedExpenseIds: r.generatedExpenseIds || [],
        createdByUserId: r.createdByUserId,
        createdByUserName: r.createdByUserName,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    }

    // 9. Daily Reconciliations
    for (const rec of INITIAL_RECONCILIATIONS) {
      await db.insert(schema.dailyReconciliations).values({
        id: rec.id,
        businessId: INITIAL_BUSINESS.id,
        date: rec.date,
        openedAt: rec.openedAt,
        closedAt: rec.closedAt || null,
        openedByUserId: rec.openedByUserId,
        openedByUserName: rec.openedByUserName,
        closedByUserId: rec.closedByUserId || null,
        closedByUserName: rec.closedByUserName || null,
        status: rec.status,
        openingFloat: String(rec.openingFloat || 0),
        systemCashSales: String(rec.systemCashSales || 0),
        systemPosSales: String(rec.systemPosSales || 0),
        systemTransferSales: String(rec.systemTransferSales || 0),
        systemDebtCashCollected: String(rec.systemDebtCashCollected || 0),
        systemCashExpenses: String(rec.systemCashExpenses || 0),
        cashDrop: String(rec.cashDrop || 0),
        expectedCashInHand: String(rec.expectedCashInHand || 0),
        actualCashCounted: String(rec.actualCashCounted || 0),
        actualPosSettlement: String(rec.actualPosSettlement || 0),
        actualTransferSettlement: String(rec.actualTransferSettlement || 0),
        cashVariance: String(rec.cashVariance || 0),
        varianceReason: rec.varianceReason || null,
        reconciliationNotes: rec.reconciliationNotes || null,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
      });
    }

    // 10. Audit Logs
    for (const a of INITIAL_AUDIT_LOGS) {
      await db.insert(schema.auditLogs).values({
        id: a.id,
        businessId: INITIAL_BUSINESS.id,
        userId: a.userId,
        userName: a.userName,
        userRole: a.userRole,
        action: a.action,
        entity: (a as any).entity || (a as any).entityType || 'system',
        entityId: a.entityId,
        details: a.details,
        metadata: (a as any).metadata || null,
        timestamp: a.timestamp,
      });
    }

    console.log('Seeding completed successfully.');
    return { seeded: true, message: 'Database seeded successfully.' };
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
}
