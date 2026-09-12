// Voice Training Sample Correction API - Users can update their corrected transcripts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { voiceTrainingSamples, users, sessions } from '../../../../../../../shared/schema';
import { eq, and } from 'drizzle-orm';

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

// PATCH - User updates their corrected transcript
export const PATCH: RequestHandler = async ({ request, params }) => {
  const user = await verifySession(request);
  if (!user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sampleId = parseInt(params.id);
    const body = await request.json();
    const { correctedTranscript } = body;

    if (correctedTranscript === undefined) {
      return json({ success: false, error: 'Corrected transcript is required' }, { status: 400 });
    }

    // Only allow users to update their own samples
    const [sample] = await db.select()
      .from(voiceTrainingSamples)
      .where(and(
        eq(voiceTrainingSamples.id, sampleId),
        eq(voiceTrainingSamples.userId, user.id)
      ))
      .limit(1);

    if (!sample) {
      return json({ success: false, error: 'Sample not found or not owned by user' }, { status: 404 });
    }

    // Update corrected transcript and final transcript (unless admin has edited)
    const updateData: Record<string, any> = {
      correctedTranscript: correctedTranscript.trim(),
      updatedAt: new Date()
    };

    // Only update finalTranscript if admin hasn't edited it
    if (!sample.adminEditedTranscript) {
      updateData.finalTranscript = correctedTranscript.trim();
    }

    const [updated] = await db.update(voiceTrainingSamples)
      .set(updateData)
      .where(eq(voiceTrainingSamples.id, sampleId))
      .returning();

    return json({ success: true, sample: updated });
  } catch (error) {
    console.error('Error updating corrected transcript:', error);
    return json({ success: false, error: 'Failed to update correction' }, { status: 500 });
  }
};
