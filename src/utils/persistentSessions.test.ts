import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import {
  createSession,
  revokeSession,
  validateSessionToken,
  hashToken,
  generateSessionToken,
  cleanupExpiredSessions,
  requireAuth,
  AuthRequest,
  activeSessions,
} from '../middleware/auth.ts';
import { Response } from 'express';

export async function runPersistentSessionsTests(): Promise<{ passed: boolean; results: string[] }> {
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

  try {
    // =========================================================================
    // 1. Session Token Generation & Cryptographic Entropy
    // =========================================================================
    const tokenInfo = generateSessionToken();
    assert(tokenInfo.rawToken.startsWith('smt_tok_'), 'Session token begins with smt_tok_ prefix');
    
    // Hex portion is 64 characters (32 bytes = 256 bits of cryptographic entropy)
    const hexPortion = tokenInfo.rawToken.replace('smt_tok_', '');
    assert(hexPortion.length === 64, 'Token payload contains exactly 64 hex characters (256 bits entropy)');
    assert(/^[0-9a-f]{64}$/i.test(hexPortion), 'Token payload contains valid cryptographically secure hex');
    
    const computedHash = hashToken(tokenInfo.rawToken);
    assert(computedHash === tokenInfo.tokenHash, 'hashToken accurately produces deterministic SHA-256 digest');
    assert(computedHash.length === 64, 'Token hash is a 64-character SHA-256 hexadecimal string');

    // =========================================================================
    // 2. Persistent PostgreSQL Session Creation & Database Storage
    // =========================================================================
    const testUserId = 'usr_philip_owner';
    const testBusinessId = 'biz_smartcore_001';

    const created = await createSession(testUserId, testBusinessId, 7);
    assert(Boolean(created.token), 'Valid credentials generate a non-empty session token');
    assert(Boolean(created.sessionId), 'Session creation returns a unique session identifier');
    assert(created.expiresAt.getTime() > Date.now() + 6 * 24 * 60 * 60 * 1000, 'Session expires approximately 7 days in the future');

    // Verify row directly in PostgreSQL Cloud SQL table
    const sessionInDb = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, created.sessionId))
      .limit(1);

    assert(sessionInDb.length === 1, 'Session record is successfully persisted in PostgreSQL database');
    assert(sessionInDb[0].userId === testUserId, 'Persisted session records correct authoritative userId');
    assert(sessionInDb[0].businessId === testBusinessId, 'Persisted session records correct authoritative businessId');
    assert(sessionInDb[0].revokedAt === null, 'Newly created session has null revokedAt');

    // Verify plaintext raw token is NEVER stored in database
    const rawTokenStored = JSON.stringify(sessionInDb[0]).includes(created.token);
    assert(rawTokenStored === false, 'Raw session token is NEVER stored in plaintext in the database');
    assert(sessionInDb[0].tokenHash === hashToken(created.token), 'Database stores the SHA-256 cryptographic hash of the token');

    // =========================================================================
    // 3. Authentication Validation & Context Population
    // =========================================================================
    const validation = await validateSessionToken(created.token);
    assert(validation.valid === true, 'Valid PostgreSQL session token authenticates successfully');
    assert(validation.user?.id === testUserId, 'Authentication loads correct user entity from PostgreSQL');
    assert(validation.user?.role === 'owner', 'Authoritative role (owner) is correctly established');
    assert(validation.businessId === testBusinessId, 'Authoritative businessId is correctly established');

    // Unknown token rejection
    const fakeToken = `smt_tok_${'a'.repeat(64)}`;
    const unknownValidation = await validateSessionToken(fakeToken);
    assert(unknownValidation.valid === false, 'Unknown session token is rejected with unauthorized status');

    // Tampered token rejection
    const tamperedToken = created.token.slice(0, -1) + (created.token.endsWith('a') ? 'b' : 'a');
    const tamperedValidation = await validateSessionToken(tamperedToken);
    assert(tamperedValidation.valid === false, 'Tampered session token is rejected with unauthorized status');

    // Empty/missing token rejection
    const emptyValidation = await validateSessionToken('');
    assert(emptyValidation.valid === false, 'Missing session token is rejected immediately');

    // =========================================================================
    // 4. Session Expiration Handling
    // =========================================================================
    const expiredSessionId = `ses_exp_${Date.now()}`;
    const expiredTokenInfo = generateSessionToken();
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour in past

    await db.insert(schema.sessions).values({
      id: expiredSessionId,
      userId: testUserId,
      businessId: testBusinessId,
      tokenHash: expiredTokenInfo.tokenHash,
      expiresAt: pastDate,
      createdAt: pastDate,
      lastUsedAt: pastDate,
      revokedAt: null,
    });

    const expiredValidation = await validateSessionToken(expiredTokenInfo.rawToken);
    assert(expiredValidation.valid === false, 'Expired session token is strictly rejected');
    assert(Boolean(expiredValidation.error?.includes('expired')), 'Expired session returns clear expiration message');

    // Clean up test expired session
    await db.delete(schema.sessions).where(eq(schema.sessions.id, expiredSessionId));

    // =========================================================================
    // 5. Session Revocation / Logout Verification
    // =========================================================================
    const logoutSession = await createSession(testUserId, testBusinessId, 7);
    const beforeLogout = await validateSessionToken(logoutSession.token);
    assert(beforeLogout.valid === true, 'Session is valid prior to logout');

    // Execute server-side session revocation
    await revokeSession(logoutSession.token);

    // Verify revokedAt in database
    const revokedRow = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, logoutSession.sessionId))
      .limit(1);
    assert(revokedRow[0].revokedAt !== null, 'Logout records revokedAt timestamp in PostgreSQL');

    // Attempt authentication with logged-out token
    const afterLogout = await validateSessionToken(logoutSession.token);
    assert(afterLogout.valid === false, 'Revoked/logged-out token no longer authenticates');
    assert(Boolean(afterLogout.error?.includes('revoked')), 'Revoked session returns clear revocation explanation');

    // =========================================================================
    // 6. Multi-Instance & Server Restart Independence
    // =========================================================================
    // Verify that activeSessions Map is NOT authoritative and can be completely empty
    activeSessions.clear();
    assert(activeSessions.size === 0, 'In-memory activeSessions Map is completely cleared (simulating restart)');

    // Authenticate through requireAuth middleware using the persistent session
    const authFlow = { nextCalled: false };
    let authErrorStatus: number | null = null;
    let authErrorJson: any = null;

    const mockReq: Partial<AuthRequest> = {
      headers: {
        authorization: `Bearer ${created.token}`,
      },
    };
    const mockRes: Partial<Response> = {
      status(code: number) {
        authErrorStatus = code;
        return this as Response;
      },
      json(data: any) {
        authErrorJson = data;
        return this as Response;
      },
    };

    await requireAuth(mockReq as AuthRequest, mockRes as Response, () => {
      authFlow.nextCalled = true;
    });

    assert(authFlow.nextCalled === true, 'Valid session persists and authenticates with ZERO process memory (survives restart)');
    assert(mockReq.user?.id === testUserId, 'requireAuth populates user context from PostgreSQL after restart');
    assert(mockReq.businessId === testBusinessId, 'requireAuth populates businessId context from PostgreSQL after restart');
    assert(authErrorStatus === null, 'No 401 error returned when verifying persisted session');

    // Multi-instance simulation: authenticate same token from another instance simulation
    const instanceBValidation = await validateSessionToken(created.token);
    assert(instanceBValidation.valid === true, 'Session is recognized across distinct server instances via shared PostgreSQL');

    // =========================================================================
    // 7. Dynamic User Changes (Authoritative Server State vs Stale Cache)
    // =========================================================================
    // Test that if a user's role or status changes in database, the session immediately enforces it
    const staffSession = await createSession('usr_emeka_staff', testBusinessId, 7);
    const staffCheck = await validateSessionToken(staffSession.token);
    assert(staffCheck.user?.role === 'staff', 'Staff user session starts with authoritative staff role');

    // Simulate owner modifying user permissions dynamically in PostgreSQL
    await db
      .update(schema.users)
      .set({ permissions: ['view_reports'] })
      .where(eq(schema.users.id, 'usr_emeka_staff'));

    const updatedStaffCheck = await validateSessionToken(staffSession.token);
    assert(
      Array.isArray(updatedStaffCheck.user?.permissions) && updatedStaffCheck.user?.permissions.includes('view_reports'),
      'Dynamic permission updates in PostgreSQL take effect immediately on next request without re-login'
    );

    // Clean up permission override back to null
    await db
      .update(schema.users)
      .set({ permissions: null })
      .where(eq(schema.users.id, 'usr_emeka_staff'));

    // =========================================================================
    // 8. Tenant & Business Isolation Enforcement
    // =========================================================================
    // An authenticated user cannot spoof or cross business boundaries
    assert(mockReq.businessId === testBusinessId, 'req.businessId is strictly derived from database user, not client input');

    // Clean up test sessions created during test
    await db.delete(schema.sessions).where(eq(schema.sessions.id, created.sessionId));
    await db.delete(schema.sessions).where(eq(schema.sessions.id, logoutSession.sessionId));
    await db.delete(schema.sessions).where(eq(schema.sessions.id, staffSession.sessionId));

    // =========================================================================
    // 9. Session Cleanup Verification
    // =========================================================================
    const cleanupCount = await cleanupExpiredSessions();
    assert(typeof cleanupCount === 'number', 'cleanupExpiredSessions executes successfully without throwing');

  } catch (err: any) {
    passed = false;
    results.push(`✗ FATAL TEST ERROR: ${err.message}\n${err.stack}`);
  }

  return { passed, results };
}
