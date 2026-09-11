import { db, schema } from './db';
import type { User } from '../../../shared/schema';
import { eq, and, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { hmacForAudit } from './encryption';
import { validatePassword } from './passwordPolicy';
import { sessionEvents } from './sessionEvents';

const SALT_ROUNDS = 12;
const SESSION_EXPIRY_HOURS = 24;
const REFRESH_EXPIRY_DAYS = 30;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export interface AuthResult {
  success: boolean;
  user?: Omit<User, 'password' | 'securityAnswer'> & {
    roleName?: string;
    roleDisplayName?: string;
  };
  session?: {
    token: string;
    refreshToken: string;
    expiresAt: Date;
  };
  sessionId?: number;
  error?: string;
  permissions?: string[];
  mustChangePassword?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function getUserPermissions(roleId: number): Promise<string[]> {
  const rolePerms = await db
    .select({
      permissionName: schema.permissions.name
    })
    .from(schema.rolePermissions)
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.rolePermissions.roleId, roleId));
  
  return rolePerms.map(rp => rp.permissionName);
}

export async function checkPermission(userId: number, permission: string): Promise<boolean> {
  try {
    const user = await db
      .select({ roleId: schema.users.roleId })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    
    if (!user.length) return false;
    
    const permissions = await getUserPermissions(user[0].roleId);
    return permissions.includes(permission);
  } catch {
    return false;
  }
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return authHeader.replace('Bearer ', '');
  }
  
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('='))
    );
    if (cookies['session_token']) {
      return cookies['session_token'];
    }
  }
  
  return null;
}

export function extractTokenFromCookies(cookies: { get: (name: string) => string | undefined }): string | null {
  return cookies.get('session_token') || null;
}

export async function validateSessionFromRequest(request: Request): Promise<AuthResult> {
  const token = extractToken(request);
  if (!token) {
    return { success: false, error: 'No session token provided' };
  }
  return validateSession(token);
}

export async function login(
  username: string, 
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResult> {
  try {
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (!user.length) {
      await logAudit({
        action: 'LOGIN_FAILED',
        category: 'AUTH',
        severity: 'WARNING',
        description: `Failed login attempt for unknown user: ${username}`,
        ipAddress,
        userAgent
      });
      return { success: false, error: 'Invalid username or password' };
    }

    const userData = user[0];

    if (!userData.isActive) {
      await logAudit({
        userId: userData.id,
        username: userData.username,
        action: 'LOGIN_BLOCKED',
        category: 'AUTH',
        severity: 'WARNING',
        description: 'Login attempt on disabled account',
        ipAddress,
        userAgent
      });
      return { success: false, error: 'Account is disabled. Contact administrator.' };
    }

    if (userData.lockedUntil && new Date(userData.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(userData.lockedUntil).getTime() - Date.now()) / 60000);
      return { success: false, error: `Account locked. Try again in ${remainingMinutes} minutes.` };
    }

    const isValid = await verifyPassword(password, userData.password);

    if (!isValid) {
      const attempts = (userData.failedLoginAttempts || 0) + 1;
      const lockUntil = attempts >= MAX_LOGIN_ATTEMPTS 
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000)
        : null;

      await db
        .update(schema.users)
        .set({ 
          failedLoginAttempts: attempts,
          lockedUntil: lockUntil
        })
        .where(eq(schema.users.id, userData.id));

      await logAudit({
        userId: userData.id,
        username: userData.username,
        action: 'LOGIN_FAILED',
        category: 'AUTH',
        severity: attempts >= MAX_LOGIN_ATTEMPTS ? 'CRITICAL' : 'WARNING',
        description: `Failed login attempt ${attempts}/${MAX_LOGIN_ATTEMPTS}`,
        ipAddress,
        userAgent
      });

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        return { success: false, error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.` };
      }

      return { success: false, error: 'Invalid username or password' };
    }

    await db
      .update(schema.users)
      .set({ 
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      })
      .where(eq(schema.users.id, userData.id));

    // Invalidate all existing sessions for this user (single session enforcement)
    await db
      .update(schema.sessions)
      .set({ isValid: false })
      .where(eq(schema.sessions.userId, userData.id));
    
    // Notify any connected SSE clients that their session was terminated
    sessionEvents.notifySessionTerminated(userData.id, 'new_login');

    const sessionToken = generateToken();
    const refreshToken = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(schema.sessions).values({
      userId: userData.id,
      sessionToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      ipAddress,
      userAgent,
      isValid: true
    });

    const permissions = await getUserPermissions(userData.roleId);

    const role = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, userData.roleId))
      .limit(1);

    await logAudit({
      userId: userData.id,
      username: userData.username,
      userRole: role[0]?.name,
      action: 'LOGIN_SUCCESS',
      category: 'AUTH',
      severity: 'INFO',
      description: 'User logged in successfully',
      ipAddress,
      userAgent
    });

    const { password: _, securityAnswer: __, ...userWithoutSensitive } = userData;

    return {
      success: true,
      user: { ...userWithoutSensitive, roleName: role[0]?.name, roleDisplayName: role[0]?.displayName },
      session: {
        token: sessionToken,
        refreshToken,
        expiresAt
      },
      permissions,
      mustChangePassword: userData.mustChangePassword || false
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An error occurred during login' };
  }
}

export async function validateSession(sessionToken: string): Promise<AuthResult> {
  try {
    const session = await db
      .select()
      .from(schema.sessions)
      .where(and(
        eq(schema.sessions.sessionToken, sessionToken),
        eq(schema.sessions.isValid, true)
      ))
      .limit(1);

    if (!session.length) {
      return { success: false, error: 'Invalid session' };
    }

    const sessionData = session[0];

    if (new Date(sessionData.expiresAt) < new Date()) {
      await db
        .update(schema.sessions)
        .set({ isValid: false, revokedReason: 'expired' })
        .where(eq(schema.sessions.id, sessionData.id));
      return { success: false, error: 'Session expired' };
    }

    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, sessionData.userId!))
      .limit(1);

    if (!user.length || !user[0].isActive) {
      return { success: false, error: 'User not found or disabled' };
    }

    const userData = user[0];
    const permissions = await getUserPermissions(userData.roleId);

    const role = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, userData.roleId))
      .limit(1);

    const { password: _, securityAnswer: __, ...userWithoutSensitive } = userData;

    return {
      success: true,
      user: { ...userWithoutSensitive, roleName: role[0]?.name, roleDisplayName: role[0]?.displayName },
      sessionId: sessionData.id,
      permissions
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { success: false, error: 'Session validation failed' };
  }
}

export async function logout(sessionToken: string): Promise<{ success: boolean }> {
  try {
    const session = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.sessionToken, sessionToken))
      .limit(1);

    if (session.length) {
      const userId = session[0].userId;
      
      await db
        .update(schema.sessions)
        .set({ 
          isValid: false, 
          revokedAt: new Date(),
          revokedReason: 'user_logout'
        })
        .where(eq(schema.sessions.id, session[0].id));

      if (userId) {
        await db
          .delete(schema.reportEditLocks)
          .where(eq(schema.reportEditLocks.userId, userId));
        
        const user = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, userId))
          .limit(1);

        if (user.length) {
          await logAudit({
            userId: user[0].id,
            username: user[0].username,
            action: 'LOGOUT',
            category: 'AUTH',
            severity: 'INFO',
            description: 'User logged out'
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

export async function register(userData: {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  roleId: number;
  title?: string;
  licenseNumber?: string;
  specialty?: string;
  department?: string;
  institution?: string;
  createdBy?: number;
}): Promise<AuthResult> {
  try {
    if (process.env.VITE_KRISPOINT_EDITION === 'solo') {
      const [{ userCount }] = await db.select({ userCount: count() }).from(schema.users);
      if (userCount > 0) {
        return { success: false, error: 'This Solo workspace already has an owner. Additional users are not supported.' };
      }
    }

    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors.join('. ') };
    }

    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, userData.username))
      .limit(1);

    if (existing.length) {
      return { success: false, error: 'Username already exists' };
    }

    const hashedPassword = await hashPassword(userData.password);

    const [newUser] = await db.insert(schema.users).values({
      username: userData.username,
      password: hashedPassword,
      fullName: userData.fullName,
      email: userData.email,
      roleId: userData.roleId,
      title: userData.title,
      licenseNumber: userData.licenseNumber,
      specialty: userData.specialty,
      department: userData.department,
      institution: userData.institution,
      createdBy: userData.createdBy,
      isActive: true,
      isVerified: true
    }).returning();

    const role = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, userData.roleId))
      .limit(1);

    await logAudit({
      userId: userData.createdBy,
      action: 'USER_CREATED',
      category: 'USERS',
      severity: 'INFO',
      description: `New user created: ${userData.username}`,
      resourceType: 'USER',
      resourceId: String(newUser.id),
      newValue: { username: userData.username, role: role[0]?.name }
    });

    const { password: _, securityAnswer: __, ...userWithoutSensitive } = newUser;

    return {
      success: true,
      user: { ...userWithoutSensitive, roleName: role[0]?.name, roleDisplayName: role[0]?.displayName }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

export async function logAudit(entry: {
  userId?: number;
  username?: string;
  userRole?: string;
  action: string;
  category: string;
  severity?: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const timestamp = new Date();
    
    const checksumData = JSON.stringify({
      userId: entry.userId,
      username: entry.username,
      userRole: entry.userRole,
      action: entry.action,
      category: entry.category,
      severity: entry.severity || 'INFO',
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      description: entry.description,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      metadata: entry.metadata,
      timestamp: timestamp.toISOString()
    });
    const checksum = hmacForAudit(checksumData);

    await db.insert(schema.auditLogs).values({
      ...entry,
      createdAt: timestamp,
      checksum
    });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

export async function getRoles() {
  return db.select().from(schema.roles).orderBy(schema.roles.level);
}

export interface ReportParticipationResult {
  canMutate: boolean;
  isParticipant: boolean;
  participationReason?: string;
  denyReason?: string;
}

export async function checkReportParticipation(
  userId: number, 
  reportId: number
): Promise<ReportParticipationResult> {
  try {
    const [report] = await db
      .select({
        createdBy: schema.reports.createdBy,
        openedBy: schema.reports.openedBy,
        assignedSpecialistId: schema.reports.assignedSpecialistId,
        signedBy: schema.reports.signedBy,
        reviewedBy: schema.reports.reviewedBy,
        status: schema.reports.status
      })
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!report) {
      return { canMutate: false, isParticipant: false, denyReason: 'Report not found' };
    }

    // SIGNED reports: always read-only (use "Undo Sign Off" to revert first)
    if (report.status === 'SIGNED') {
      return { canMutate: false, isParticipant: false, denyReason: 'Report is signed and read-only' };
    }
    
    // SUBMITTED reports: only assigned specialist can edit
    if (report.status === 'SUBMITTED') {
      if (report.assignedSpecialistId === userId) {
        return { canMutate: true, isParticipant: true, participationReason: 'Assigned specialist' };
      }
      // Authors can view but not edit while submitted
      if (report.createdBy === userId) {
        return { canMutate: false, isParticipant: true, denyReason: 'Report is pending specialist review' };
      }
      return { canMutate: false, isParticipant: false, denyReason: 'Report is pending specialist review' };
    }

    // DRAFT reports: owner/creator can edit
    if (report.createdBy === userId) {
      return { canMutate: true, isParticipant: true, participationReason: 'Report author' };
    }

    if (report.openedBy === userId) {
      return { canMutate: true, isParticipant: true, participationReason: 'Currently assigned' };
    }

    if (report.assignedSpecialistId === userId) {
      return { canMutate: true, isParticipant: true, participationReason: 'Assigned specialist' };
    }

    const returnedWorkflows = await db
      .select({ userId: schema.reportWorkflows.userId })
      .from(schema.reportWorkflows)
      .where(
        and(
          eq(schema.reportWorkflows.reportId, reportId),
          eq(schema.reportWorkflows.event, 'RETURNED')
        )
      );

    const returnedByUser = returnedWorkflows.some(w => w.userId === userId);
    if (returnedByUser) {
      return { canMutate: true, isParticipant: true, participationReason: 'Returned report for revision' };
    }

    return { 
      canMutate: false, 
      isParticipant: false, 
      denyReason: 'You must be involved in the report creation or review process to modify it' 
    };
  } catch (error) {
    console.error('Check report participation error:', error);
    return { canMutate: false, isParticipant: false, denyReason: 'Failed to verify participation' };
  }
}

export async function getUsers() {
  return db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      fullName: schema.users.fullName,
      email: schema.users.email,
      title: schema.users.title,
      specialty: schema.users.specialty,
      department: schema.users.department,
      institution: schema.users.institution,
      designation: schema.users.designation,
      roleId: schema.users.roleId,
      roleName: schema.roles.name,
      roleDisplayName: schema.roles.displayName,
      isActive: schema.users.isActive,
      lastLoginAt: schema.users.lastLoginAt,
      createdAt: schema.users.createdAt,
      deletedAt: schema.users.deletedAt
    })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .orderBy(schema.users.fullName);
}
