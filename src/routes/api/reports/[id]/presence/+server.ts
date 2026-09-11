import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, checkReportParticipation } from '$lib/server/auth';
import { eq, and, lt } from 'drizzle-orm';

const HEARTBEAT_EXPIRY_SECONDS = 60;
const LOCK_EXPIRY_SECONDS = 75;

async function verifyReportAccess(userId: number, reportId: number) {
  const [report] = await db
    .select({
      status: schema.reports.status,
      createdBy: schema.reports.createdBy,
      openedBy: schema.reports.openedBy,
      signedBy: schema.reports.signedBy,
      reviewedBy: schema.reports.reviewedBy,
      assignedSpecialistId: schema.reports.assignedSpecialistId
    })
    .from(schema.reports)
    .where(eq(schema.reports.id, reportId))
    .limit(1);
  
  if (!report) {
    return { allowed: false, notFound: true };
  }
  
  const hasFullRead = await checkPermission(userId, 'reports.read');
  if (hasFullRead) {
    return { allowed: true, report };
  }
  
  const hasReadOwn = await checkPermission(userId, 'reports.read_own');
  if (!hasReadOwn) {
    return { allowed: false };
  }
  
  const isOwner = report.createdBy === userId || report.openedBy === userId;
  const isParticipant = report.assignedSpecialistId === userId || 
                        report.signedBy === userId || 
                        report.reviewedBy === userId;
  
  if (isOwner || isParticipant) {
    return { allowed: true, report };
  }
  
  if (report.status === 'SIGNED') {
    return { allowed: true, report };
  }
  
  return { allowed: false };
}

async function cleanupExpiredLocks() {
  const expiryTime = new Date(Date.now() - LOCK_EXPIRY_SECONDS * 1000);
  await db.delete(schema.reportEditLocks)
    .where(lt(schema.reportEditLocks.expiresAt, new Date()));
}

async function getLockStatus(reportId: number, currentUserId: number) {
  await cleanupExpiredLocks();
  
  const [lock] = await db
    .select({
      userId: schema.reportEditLocks.userId,
      fullName: schema.users.fullName,
      acquiredAt: schema.reportEditLocks.acquiredAt,
      expiresAt: schema.reportEditLocks.expiresAt
    })
    .from(schema.reportEditLocks)
    .innerJoin(schema.users, eq(schema.reportEditLocks.userId, schema.users.id))
    .where(eq(schema.reportEditLocks.reportId, reportId))
    .limit(1);
  
  if (!lock) {
    return { isLocked: false, lockHolder: null, isOwnLock: false };
  }
  
  return {
    isLocked: true,
    lockHolder: {
      userId: lock.userId,
      fullName: lock.fullName,
      acquiredAt: lock.acquiredAt
    },
    isOwnLock: lock.userId === currentUserId
  };
}

async function acquireLock(reportId: number, userId: number): Promise<{ success: boolean; error?: string; lockHolder?: any }> {
  await cleanupExpiredLocks();
  
  const [existingLock] = await db
    .select({
      userId: schema.reportEditLocks.userId,
      fullName: schema.users.fullName
    })
    .from(schema.reportEditLocks)
    .innerJoin(schema.users, eq(schema.reportEditLocks.userId, schema.users.id))
    .where(eq(schema.reportEditLocks.reportId, reportId))
    .limit(1);
  
  if (existingLock) {
    if (existingLock.userId === userId) {
      const newExpiresAt = new Date(Date.now() + LOCK_EXPIRY_SECONDS * 1000);
      await db.update(schema.reportEditLocks)
        .set({ expiresAt: newExpiresAt })
        .where(eq(schema.reportEditLocks.reportId, reportId));
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Report is locked by another user',
        lockHolder: { userId: existingLock.userId, fullName: existingLock.fullName }
      };
    }
  }
  
  const expiresAt = new Date(Date.now() + LOCK_EXPIRY_SECONDS * 1000);
  await db.insert(schema.reportEditLocks)
    .values({
      reportId,
      userId,
      acquiredAt: new Date(),
      expiresAt
    });
  
  return { success: true };
}

async function renewLock(reportId: number, userId: number): Promise<{ success: boolean; error?: string }> {
  const [existingLock] = await db
    .select()
    .from(schema.reportEditLocks)
    .where(and(
      eq(schema.reportEditLocks.reportId, reportId),
      eq(schema.reportEditLocks.userId, userId)
    ))
    .limit(1);
  
  if (!existingLock) {
    return { success: false, error: 'No lock held' };
  }
  
  const newExpiresAt = new Date(Date.now() + LOCK_EXPIRY_SECONDS * 1000);
  await db.update(schema.reportEditLocks)
    .set({ expiresAt: newExpiresAt })
    .where(eq(schema.reportEditLocks.id, existingLock.id));
  
  return { success: true };
}

async function releaseLock(reportId: number, userId: number): Promise<{ success: boolean }> {
  await db.delete(schema.reportEditLocks)
    .where(and(
      eq(schema.reportEditLocks.reportId, reportId),
      eq(schema.reportEditLocks.userId, userId)
    ));
  return { success: true };
}

export const GET: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    const access = await verifyReportAccess(session.user.id, reportId);
    if (!access.allowed) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const expiryTime = new Date(Date.now() - HEARTBEAT_EXPIRY_SECONDS * 1000);
    
    await db.delete(schema.reportEditors)
      .where(lt(schema.reportEditors.lastHeartbeat, expiryTime));

    const activeEditors = await db
      .select({
        userId: schema.reportEditors.userId,
        fullName: schema.users.fullName,
        lastHeartbeat: schema.reportEditors.lastHeartbeat
      })
      .from(schema.reportEditors)
      .innerJoin(schema.users, eq(schema.reportEditors.userId, schema.users.id))
      .where(eq(schema.reportEditors.reportId, reportId));

    const otherEditors = activeEditors.filter(e => e.userId !== session.user!.id);

    const lockStatus = await getLockStatus(reportId, session.user.id);

    return json({
      success: true,
      activeEditors: otherEditors.map(e => ({
        userId: e.userId,
        fullName: e.fullName
      })),
      hasOtherEditors: otherEditors.length > 0,
      lock: lockStatus
    });
  } catch (error) {
    console.error('Get report presence error:', error);
    return json({ success: false, error: 'Failed to get presence' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'heartbeat';

    if (action === 'leave') {
      await db.delete(schema.reportEditors)
        .where(and(
          eq(schema.reportEditors.reportId, reportId),
          eq(schema.reportEditors.userId, session.user.id)
        ));
      await releaseLock(reportId, session.user.id);
      return json({ success: true, action: 'left' });
    }

    if (action === 'release_lock') {
      await releaseLock(reportId, session.user.id);
      const lockStatus = await getLockStatus(reportId, session.user.id);
      return json({ success: true, action: 'lock_released', lock: lockStatus });
    }

    const access = await verifyReportAccess(session.user.id, reportId);
    if (!access.allowed) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    if (action === 'acquire_lock') {
      const participation = await checkReportParticipation(session.user.id, reportId);
      if (!participation.isParticipant) {
        return json({ success: false, error: 'Only report participants can acquire edit lock' }, { status: 403 });
      }
      
      const lockResult = await acquireLock(reportId, session.user.id);
      if (!lockResult.success) {
        return json({ 
          success: false, 
          error: lockResult.error,
          lockHolder: lockResult.lockHolder 
        }, { status: 423 });
      }
      
      const lockStatus = await getLockStatus(reportId, session.user.id);
      return json({ success: true, action: 'lock_acquired', lock: lockStatus });
    }

    const expiryTime = new Date(Date.now() - HEARTBEAT_EXPIRY_SECONDS * 1000);
    await db.delete(schema.reportEditors)
      .where(lt(schema.reportEditors.lastHeartbeat, expiryTime));

    const [existing] = await db
      .select()
      .from(schema.reportEditors)
      .where(and(
        eq(schema.reportEditors.reportId, reportId),
        eq(schema.reportEditors.userId, session.user.id)
      ))
      .limit(1);

    if (existing) {
      await db.update(schema.reportEditors)
        .set({ lastHeartbeat: new Date() })
        .where(eq(schema.reportEditors.id, existing.id));
    } else {
      await db.insert(schema.reportEditors)
        .values({
          reportId,
          userId: session.user.id,
          lastHeartbeat: new Date()
        });
    }

    const lockStatus = await getLockStatus(reportId, session.user.id);
    if (lockStatus.isOwnLock) {
      await renewLock(reportId, session.user.id);
    }

    const activeEditors = await db
      .select({
        userId: schema.reportEditors.userId,
        fullName: schema.users.fullName
      })
      .from(schema.reportEditors)
      .innerJoin(schema.users, eq(schema.reportEditors.userId, schema.users.id))
      .where(eq(schema.reportEditors.reportId, reportId));

    const otherEditors = activeEditors.filter(e => e.userId !== session.user!.id);

    const updatedLockStatus = await getLockStatus(reportId, session.user.id);

    return json({
      success: true,
      action: existing ? 'heartbeat' : 'joined',
      activeEditors: otherEditors.map(e => ({
        userId: e.userId,
        fullName: e.fullName
      })),
      hasOtherEditors: otherEditors.length > 0,
      lock: updatedLockStatus
    });
  } catch (error) {
    console.error('Update report presence error:', error);
    return json({ success: false, error: 'Failed to update presence' }, { status: 500 });
  }
};
