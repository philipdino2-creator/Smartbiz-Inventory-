import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { User, Permission } from '../types/index.ts';
import { hasPermission } from '../utils/permissionUtils.ts';

// In-memory token store for server sessions
export interface ServerSession {
  userId: string;
  businessId: string;
  createdAt: number;
  expiresAt: number;
}

export const activeSessions = new Map<string, ServerSession>();

export interface AuthRequest extends Request {
  user?: User;
  businessId?: string;
  token?: string;
}

/**
 * Authentication Middleware: Validates Bearer token (Firebase ID token or Server session token)
 */
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Check local server session token
  const session = activeSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
      return;
    }

    try {
      const dbUsers = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
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
      next();
      return;
    } catch (err) {
      console.error('Database lookup failed during session validation:', err);
      res.status(500).json({ error: 'Internal server error during authentication' });
      return;
    }
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
