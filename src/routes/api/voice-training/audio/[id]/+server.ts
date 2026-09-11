// Voice Training Audio File API - Serve audio files for playback
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { voiceTrainingSamples, users, sessions, roles } from '../../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

export const GET: RequestHandler = async ({ params, cookies }) => {
  // Use cookie-based authentication
  const token = cookies.get('session_token');
  if (!token) {
    console.error('[VoiceTraining Audio] No session token cookie');
    return new Response('Unauthorized - no session token', { status: 401 });
  }

  const { validateSession } = await import('$lib/server/auth');
  const session = await validateSession(token);
  if (!session.success || !session.user) {
    console.error('[VoiceTraining Audio] Invalid session');
    return new Response('Unauthorized - invalid session', { status: 401 });
  }

  const user = session.user;
  const adminOrOwner = await isAdminOrOwner(user.id);
  if (!adminOrOwner) {
    return new Response('Admin access required', { status: 403 });
  }

  try {
    const sampleId = parseInt(params.id);

    const [sample] = await db.select()
      .from(voiceTrainingSamples)
      .where(eq(voiceTrainingSamples.id, sampleId))
      .limit(1);

    if (!sample || !sample.audioPath) {
      return new Response('Sample not found', { status: 404 });
    }

    const audioPath = path.join(process.cwd(), sample.audioPath);
    
    if (!existsSync(audioPath)) {
      return new Response('Audio file not found', { status: 404 });
    }

    const audioData = await readFile(audioPath);
    const format = sample.audioFormat || 'wav';
    const mimeType = format === 'webm' ? 'audio/webm' : 'audio/wav';

    return new Response(audioData, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': audioData.length.toString(),
        'Cache-Control': 'private, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Error serving audio:', error);
    return new Response('Failed to serve audio', { status: 500 });
  }
};
