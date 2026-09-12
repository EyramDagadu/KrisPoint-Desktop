// Voice Training Sample API - Update and Delete individual samples
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { voiceTrainingSamples, users, sessions, roles } from '../../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Verify user session and return user data
async function verifySession(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessionResult = await db.select()
      .from(sessions)
      .where(eq(sessions.sessionToken, token))
      .limit(1);

    if (sessionResult.length === 0 || !sessionResult[0].isValid) {
      return null;
    }

    const session = sessionResult[0];
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    return userResult[0];
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// Check if user is admin or owner
async function isAdminOrOwner(userId: number): Promise<boolean> {
  try {
    const userResult = await db.select({
      roleName: roles.name
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

    return userResult.length > 0 && (userResult[0].roleName === 'admin' || userResult[0].roleName === 'owner');
  } catch {
    return false;
  }
}

// GET - Get a single sample (admin only, or audio file for playback)
export const GET: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get('session_token');
  if (!token) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { validateSession } = await import('$lib/server/auth');
  const session = await validateSession(token);
  if (!session.success || !session.user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const adminOrOwner = await isAdminOrOwner(user.id);
  if (!adminOrOwner) {
    return json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const sampleId = parseInt(params.id);
    
    const [sample] = await db.select()
      .from(voiceTrainingSamples)
      .where(eq(voiceTrainingSamples.id, sampleId))
      .limit(1);

    if (!sample) {
      return json({ success: false, error: 'Sample not found' }, { status: 404 });
    }

    return json({ success: true, sample });
  } catch (error) {
    console.error('Error fetching training sample:', error);
    return json({ success: false, error: 'Failed to fetch sample' }, { status: 500 });
  }
};

// PATCH - Update sample (admin can edit transcript, mark reviewed, etc.)
export const PATCH: RequestHandler = async ({ request, params, cookies }) => {
  const token = cookies.get('session_token');
  if (!token) {
    console.error('[VoiceTraining Sample PATCH] No session token cookie');
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { validateSession } = await import('$lib/server/auth');
  const session = await validateSession(token);
  if (!session.success || !session.user) {
    console.error('[VoiceTraining Sample PATCH] Invalid session');
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const adminOrOwner = await isAdminOrOwner(user.id);
  if (!adminOrOwner) {
    return json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const sampleId = parseInt(params.id);
    const body = await request.json();
    
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };

    // Admin can update these fields
    if (body.verifiedTranscript !== undefined) {
      updateData.verifiedTranscript = body.verifiedTranscript;
    }

    if (body.isReviewed !== undefined) {
      updateData.isReviewed = body.isReviewed;
      if (body.isReviewed) {
        updateData.reviewedBy = user.id;
        updateData.reviewedAt = new Date();
      }
    }

    if (body.isUsable !== undefined) {
      updateData.isUsable = body.isUsable;
    }

    if (body.qualityNotes !== undefined) {
      updateData.qualityNotes = body.qualityNotes;
    }

    const [updated] = await db.update(voiceTrainingSamples)
      .set(updateData)
      .where(eq(voiceTrainingSamples.id, sampleId))
      .returning();

    if (!updated) {
      return json({ success: false, error: 'Sample not found' }, { status: 404 });
    }

    // Audit log for sample review
    if (body.isReviewed !== undefined) {
      const { logAudit } = await import('$lib/server/auth');
      await logAudit({
        userId: user.id,
        username: user.username,
        action: 'TRAINING_SAMPLE_REVIEWED',
        category: 'TRAINING',
        severity: 'INFO',
        resourceType: 'TRAINING_SAMPLE',
        resourceId: String(sampleId),
        description: `Training sample ${body.isUsable ? 'marked usable' : 'marked unusable'}`,
        metadata: { isUsable: body.isUsable, qualityNotes: body.qualityNotes }
      });
    }

    return json({ success: true, sample: updated });
  } catch (error) {
    console.error('Error updating training sample:', error);
    return json({ success: false, error: 'Failed to update sample' }, { status: 500 });
  }
};

// DELETE - Delete a sample (admin only)
export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get('session_token');
  if (!token) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { validateSession } = await import('$lib/server/auth');
  const session = await validateSession(token);
  if (!session.success || !session.user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const adminOrOwner = await isAdminOrOwner(user.id);
  if (!adminOrOwner) {
    return json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const sampleId = parseInt(params.id);

    // Get sample to find audio file path
    const [sample] = await db.select()
      .from(voiceTrainingSamples)
      .where(eq(voiceTrainingSamples.id, sampleId))
      .limit(1);

    if (!sample) {
      return json({ success: false, error: 'Sample not found' }, { status: 404 });
    }

    // Delete audio file if it exists
    if (sample.audioPath) {
      const audioPath = path.join(process.cwd(), sample.audioPath);
      if (existsSync(audioPath)) {
        try {
          await unlink(audioPath);
        } catch (err) {
          console.error('Failed to delete audio file:', err);
        }
      }
    }

    // Delete from database
    await db.delete(voiceTrainingSamples)
      .where(eq(voiceTrainingSamples.id, sampleId));

    // Audit log for sample deletion
    const { logAudit } = await import('$lib/server/auth');
    await logAudit({
      userId: user.id,
      username: user.username,
      action: 'TRAINING_SAMPLE_DELETED',
      category: 'TRAINING',
      severity: 'WARNING',
      resourceType: 'TRAINING_SAMPLE',
      resourceId: String(sampleId),
      description: `Training sample deleted`,
      metadata: { audioPath: sample.audioPath }
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting training sample:', error);
    return json({ success: false, error: 'Failed to delete sample' }, { status: 500 });
  }
};
