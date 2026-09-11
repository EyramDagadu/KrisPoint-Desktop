// Voice Training Samples API - Save and list training data
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { voiceTrainingSamples, users } from '../../../../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
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
    const { sessions } = await import('../../../../../shared/schema');
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

    // Get user with role
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
    const { roles } = await import('../../../../../shared/schema');
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

const MIN_DURATION_MS = 1500;
const MIN_VOLUME_THRESHOLD = 100;
const MAX_SILENCE_PERCENT = 0.7;

// POST - Save a new training sample
export const POST: RequestHandler = async ({ request, cookies }) => {
  // Use cookie-based authentication (same as GET handler)
  const token = cookies.get('session_token');
  if (!token) {
    console.error('[VoiceTraining API] No session token cookie found');
    return json({ success: false, error: 'Unauthorized - no session token' }, { status: 401 });
  }

  const { validateSession } = await import('$lib/server/auth');
  const session = await validateSession(token);
  if (!session.success || !session.user) {
    console.error('[VoiceTraining API] Invalid session');
    return json({ success: false, error: 'Unauthorized - invalid session' }, { status: 401 });
  }

  const user = session.user;

  try {
    console.log('[VoiceTraining API] POST request received from user:', user.id, user.fullName);
    const body = await request.json();
    const { sessionId, audioBase64, audioFormat, rawTranscript, duration, reportId, reportType, avgVolume, silencePercent } = body;
    console.log('[VoiceTraining API] Payload - sessionId:', sessionId, 'duration:', duration, 'transcriptLen:', rawTranscript?.length);

    if (!rawTranscript?.trim()) {
      console.error('[VoiceTraining API] Missing raw transcript');
      return json({ success: false, error: 'Raw transcript is required' }, { status: 400 });
    }

    // Server-side quality gate validation
    if (duration < MIN_DURATION_MS) {
      return json({ success: false, error: 'Audio too short (minimum 1.5 seconds)' }, { status: 400 });
    }

    if (avgVolume !== undefined && avgVolume < MIN_VOLUME_THRESHOLD) {
      return json({ success: false, error: 'Audio volume too low' }, { status: 400 });
    }

    if (silencePercent !== undefined && silencePercent > MAX_SILENCE_PERCENT) {
      return json({ success: false, error: 'Audio has too much silence' }, { status: 400 });
    }

    const trainingDir = path.join(process.cwd(), 'training_data', 'audio', String(user.id));
    if (!existsSync(trainingDir)) {
      await mkdir(trainingDir, { recursive: true });
    }

    const filename = `${sessionId}.${audioFormat || 'wav'}`;
    const audioPath = path.join(trainingDir, filename);
    
    if (audioBase64) {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      await writeFile(audioPath, audioBuffer);
    }

    const wordCount = rawTranscript.trim().split(/\s+/).length;

    console.log('[VoiceTraining API] Inserting sample into database...');
    const [sample] = await db.insert(voiceTrainingSamples).values({
      userId: user.id,
      audioPath: `training_data/audio/${user.id}/${filename}`,
      audioDuration: duration,
      audioFormat: audioFormat || 'wav',
      rawTranscript: rawTranscript.trim(),
      sessionId,
      wordCount,
      reportId: reportId || null,
      reportType: reportType || null,
      avgVolume: avgVolume || null,
      silencePercent: silencePercent || null
    }).returning();

    console.log('[VoiceTraining API] Sample saved successfully with id:', sample.id);

    // Audit log for training sample upload
    const { logAudit } = await import('$lib/server/auth');
    await logAudit({
      userId: user.id,
      username: user.username,
      action: 'TRAINING_SAMPLE_UPLOADED',
      category: 'TRAINING',
      severity: 'INFO',
      resourceType: 'TRAINING_SAMPLE',
      resourceId: String(sample.id),
      description: `Voice training sample uploaded (${wordCount} words, ${Math.round(duration/1000)}s)`,
      metadata: { sessionId, duration, wordCount, reportType }
    });

    return json({ success: true, sampleId: sample.id });
  } catch (error) {
    console.error('[VoiceTraining API] Error saving training sample:', error);
    return json({ success: false, error: 'Failed to save training sample' }, { status: 500 });
  }
};

// PATCH - Bulk update samples (admin only)
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  // Use cookie-based authentication
  const token = cookies.get('session_token');
  if (!token) {
    console.error('[VoiceTraining PATCH] No session token cookie');
    return json({ success: false, error: 'Unauthorized - no session token' }, { status: 401 });
  }

  const { validateSession } = await import('$lib/server/auth');
  const session = await validateSession(token);
  if (!session.success || !session.user) {
    console.error('[VoiceTraining PATCH] Invalid session');
    return json({ success: false, error: 'Unauthorized - invalid session' }, { status: 401 });
  }

  const user = session.user;
  const adminOrOwner = await isAdminOrOwner(user.id);
  if (!adminOrOwner) {
    return json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, speakerId } = body;

    if (action !== 'mark_all_usable' && action !== 'mark_all_unusable') {
      return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const isUsable = action === 'mark_all_usable';

    // Build update query based on filter
    if (speakerId) {
      await db.update(voiceTrainingSamples)
        .set({ isUsable })
        .where(eq(voiceTrainingSamples.userId, parseInt(speakerId)));
    } else {
      await db.update(voiceTrainingSamples)
        .set({ isUsable });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error bulk updating samples:', error);
    return json({ success: false, error: 'Failed to update samples' }, { status: 500 });
  }
};

// GET - List training samples (admin/owner only)
export const GET: RequestHandler = async ({ cookies, url }) => {
  const token = cookies.get('session_token');
  if (!token) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { validateSession } = await import('$lib/server/auth');
  const session = await validateSession(token);
  if (!session.success || !session.user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Check training.review permission or admin/owner role
  const hasPermission = session.permissions?.includes('training.review');
  const adminOrOwner = await isAdminOrOwner(session.user.id);
  if (!hasPermission && !adminOrOwner) {
    return json({ success: false, error: 'Training data access required' }, { status: 403 });
  }

  try {
    const speakerId = url.searchParams.get('speakerId');
    const reviewed = url.searchParams.get('reviewed');
    const usable = url.searchParams.get('usable');
    const dateFilter = url.searchParams.get('dateFilter');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build conditions array
    const conditions = [];
    
    if (speakerId) {
      conditions.push(eq(voiceTrainingSamples.userId, parseInt(speakerId)));
    }
    
    if (reviewed === 'reviewed') {
      conditions.push(eq(voiceTrainingSamples.isReviewed, true));
    } else if (reviewed === 'unreviewed') {
      conditions.push(eq(voiceTrainingSamples.isReviewed, false));
    }
    
    if (usable === 'usable') {
      conditions.push(eq(voiceTrainingSamples.isUsable, true));
    } else if (usable === 'unusable') {
      conditions.push(eq(voiceTrainingSamples.isUsable, false));
    }
    
    if (dateFilter) {
      const now = new Date();
      let startDate: Date;
      
      if (dateFilter === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (startDate!) {
        const { gte } = await import('drizzle-orm');
        conditions.push(gte(voiceTrainingSamples.createdAt, startDate));
      }
    }

    const { and } = await import('drizzle-orm');
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const samples = await db.select({
      id: voiceTrainingSamples.id,
      userId: voiceTrainingSamples.userId,
      speakerName: users.fullName,
      audioPath: voiceTrainingSamples.audioPath,
      audioDuration: voiceTrainingSamples.audioDuration,
      rawTranscript: voiceTrainingSamples.rawTranscript,
      verifiedTranscript: voiceTrainingSamples.verifiedTranscript,
      reportType: voiceTrainingSamples.reportType,
      wordCount: voiceTrainingSamples.wordCount,
      avgVolume: voiceTrainingSamples.avgVolume,
      silencePercent: voiceTrainingSamples.silencePercent,
      isReviewed: voiceTrainingSamples.isReviewed,
      isUsable: voiceTrainingSamples.isUsable,
      qualityNotes: voiceTrainingSamples.qualityNotes,
      createdAt: voiceTrainingSamples.createdAt
    })
    .from(voiceTrainingSamples)
    .innerJoin(users, eq(voiceTrainingSamples.userId, users.id))
    .where(whereClause)
    .orderBy(desc(voiceTrainingSamples.createdAt))
    .limit(limit)
    .offset(offset);

    // Get total count with same filters
    const countResult = await db.select({ count: voiceTrainingSamples.id })
      .from(voiceTrainingSamples)
      .where(whereClause);

    return json({
      success: true,
      samples,
      total: countResult.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching training samples:', error);
    return json({ success: false, error: 'Failed to fetch training samples' }, { status: 500 });
  }
};
