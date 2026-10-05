import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users, sessions } from '../db/schema.ts';
import { eq, or, lt, and, isNotNull } from 'drizzle-orm';
import { User, Permission } from '../types/index.ts';
import { hasPermission } from '../utils/permissionUtils.ts';

// Legacy in-memory session interface for backward compatibility only (non-authoritative)
export interface ServerSession {
  userId: string;
  businessId: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * @deprecated activeSessions is no longer the authoritative session store.
 * PostgreSQL `sessions` table is the sole authoritative store.
 */
export const activeSessions = new Map<string, ServerSession>();

export interface AuthRequest extends Request {
  user?: User;
  businessId?: string;
  token?: string;
  sessionId?: string;
}

/**
 * Computes a SHA-256 cryptographic hash of a raw session token.
 * Prevents raw token leakage in database backups and logs.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a cryptographically secure random session token.
 * Uses Node's crypto.randomBytes(32) providing 256 bits of entropy.
 */
export function generateSessionToken(): { rawToken: string; tokenHash: string } {
  const rawBytes = crypto.randomBytes(32);
  const rawToken = `smt_tok_${rawBytes.toString('hex')}`;
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Creates a persistent session in PostgreSQL for an authenticated user.
 */
export async function createSession(
  userId: string,
  businessId: string,
  ttlDays: number = 7
): Promise<{ token: string; expiresAt: Date; sessionId: string }> {
  const { rawToken, tokenHash } = generateSessionToken();
  const sessionId = `ses_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    businessId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    revokedAt: null,
  });

  // Opportunistic background cleanup of expired/revoked sessions
  cleanupExpiredSessions().catch(() => {});

  return { token: rawToken, expiresAt, sessionId };
}

/**
 * Revokes a session by recording revokedAt timestamp in PostgreSQL.
 */
export async function revokeSession(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  const tokenHash = hashToken(rawToken);
  const result = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, tokenHash));
  return true;
}

/**
 * Revokes all active sessions for a specific user (e.g. security reset).
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.userId, userId));
  return (result as any)?.rowCount || 0;
}

/**
 * Lightweight cleanup for expired sessions and long-revoked sessions (> 7 days).
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(sessions)
      .where(
        or(
          lt(sessions.expiresAt, now),
          and(isNotNull(sessions.revokedAt), lt(sessions.revokedAt, cutoff))
        )
      );
    return (result as any)?.rowCount || 0;
  } catch (err: any) {
    console.error('Session cleanup error:', err.message);
    return 0;
  }
}

/**
 * Validates a session token directly against PostgreSQL.
 */
export async function validateSessionToken(rawToken: string): Promise<{
  valid: boolean;
  user?: User;
  businessId?: string;
  error?: string;
  statusCode?: number;
}> {
  if (!rawToken) {
    return { valid: false, error: 'Unauthorized: Missing token', statusCode: 401 };
  }

  const tokenHash = hashToken(rawToken);
  const sessionRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (sessionRows.length === 0) {
    return { valid: false, error: 'Unauthorized: Invalid authentication token', statusCode: 401 };
  }

  const sess = sessionRows[0];

  // Check revocation
  if (sess.revokedAt) {
    return { valid: false, error: 'Unauthorized: Session has been revoked. Please log in again.', statusCode: 401 };
  }

  // Check expiration
  if (new Date(sess.expiresAt).getTime() <= Date.now()) {
    return { valid: false, error: 'Unauthorized: Session has expired. Please log in again.', statusCode: 401 };
  }

  // Load authoritative user from PostgreSQL
  const dbUsers = await db.select().from(users).where(eq(users.id, sess.userId)).limit(1);
  if (dbUsers.length === 0 || !dbUsers[0].active) {
    return { valid: false, error: 'Unauthorized: User account is inactive or not found', statusCode: 401 };
  }

  const u = dbUsers[0];
  const user: User = {
    id: u.id,
    businessId: u.businessId,
    name: u.name,
    email: u.email,
    phone: u.phone || undefined,
    role: u.role as any,
    active: u.active,
    permissions: (u.permissions as Permission[]) || undefined,
  };

  // Asynchronously record lastUsedAt
  db.update(sessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(sessions.id, sess.id))
    .catch(() => {});

  return { valid: true, user, businessId: u.businessId };
}

/**
 * Authentication Middleware: Validates Bearer token against PostgreSQL sessions
 * with fallback to Firebase ID token verification.
 */
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  // 1. Authoritative check: PostgreSQL persistent session store
  try {
    const tokenHash = hashToken(token);
    const sessionRows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);

    if (sessionRows.length > 0) {
      const sess = sessionRows[0];

      if (sess.revokedAt) {
        res.status(401).json({ error: 'Unauthorized: Session has been revoked. Please log in again.' });
        return;
      }

      if (new Date(sess.expiresAt).getTime() <= Date.now()) {
        res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
        return;
      }

      const dbUsers = await db.select().from(users).where(eq(users.id, sess.userId)).limit(1);
      if (dbUsers.length === 0 || !dbUsers[0].active) {
        res.status(401).json({ error: 'Unauthorized: User account is inactive or not found' });
        return;
      }

      const u = dbUsers[0];
      req.user = {
        id: u.id,
        businessId: u.businessId,
        name: u.name,
        email: u.email,
        phone: u.phone || undefined,
        role: u.role as any,
        active: u.active,
        permissions: (u.permissions as Permission[]) || undefined,
      };
      req.businessId = u.businessId;
      req.token = token;
      req.sessionId = sess.id;

      // Update lastUsedAt asynchronously
      db.update(sessions)
        .set({ lastUsedAt: new Date() })
        .where(eq(sessions.id, sess.id))
        .catch((err) => console.error('Failed to update session lastUsedAt:', err.message));

      next();
      return;
    }
  } catch (err: any) {
    console.error('Database lookup failed during session validation:', err.message);
    res.status(500).json({ error: 'Internal server error during authentication' });
    return;
  }

  // 2. Fall back to Firebase ID token verification
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email || '';
    const uid = decoded.uid;

    let dbUsers = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (dbUsers.length === 0 && email) {
      dbUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    }

    if (dbUsers.length > 0) {
      const u = dbUsers[0];
      if (!u.active) {
        res.status(403).json({ error: 'Forbidden: User account is deactivated' });
        return;
      }
      req.user = {
        id: u.id,
        businessId: u.businessId,
        name: u.name,
        email: u.email,
        phone: u.phone || undefined,
        role: u.role as any,
        active: u.active,
        permissions: (u.permissions as Permission[]) || undefined,
      };
      req.businessId = u.businessId;
      req.token = token;
      next();
      return;
    } else {
      res.status(401).json({ error: 'Unauthorized: No Smartcore Ledger account linked to this credential' });
      return;
    }
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
    return;
  }
};

/**
 * Authorization Middleware: Enforces granular permission on sensitive endpoints
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!hasPermission(req.user, permission)) {
      res.status(403).json({
        error: `Permission Denied: Your account does not possess the required permission [${permission}].`,
      });
      return;
    }

    next();
  };
};
