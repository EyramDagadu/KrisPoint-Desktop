// Voice Training Export API - Export training data in Kaldi format
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { voiceTrainingSamples, users } from '../../../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import archiver from 'archiver';
import { validateSession, checkPermission, logAudit } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
  const sessionToken = cookies.get('session_token');
  if (!sessionToken) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const session = await validateSession(sessionToken);
  
  if (!session.success || !session.user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const hasPermission = await checkPermission(session.user.id, 'training.export');
  if (!hasPermission) {
    return new Response(JSON.stringify({ success: false, error: 'Only the System Owner can export training data' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get all usable, reviewed samples with verified transcripts
    const samples = await db.select({
      id: voiceTrainingSamples.id,
      userId: voiceTrainingSamples.userId,
      speakerName: users.fullName,
      audioPath: voiceTrainingSamples.audioPath,
      verifiedTranscript: voiceTrainingSamples.verifiedTranscript,
      rawTranscript: voiceTrainingSamples.rawTranscript
    })
    .from(voiceTrainingSamples)
    .innerJoin(users, eq(voiceTrainingSamples.userId, users.id))
    .where(and(
      eq(voiceTrainingSamples.isUsable, true),
      eq(voiceTrainingSamples.isReviewed, true)
    ));

    if (samples.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No reviewed training samples available for export' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Group samples by speaker
    const samplesBySpeaker: Record<string, typeof samples> = {};
    for (const sample of samples) {
      const speakerId = `speaker_${sample.userId}`;
      if (!samplesBySpeaker[speakerId]) {
        samplesBySpeaker[speakerId] = [];
      }
      samplesBySpeaker[speakerId].push(sample);
    }

    // Create archive in memory using a Promise wrapper
    const zipBuffer = await new Promise<Buffer>(async (resolve, reject) => {
      const chunks: Buffer[] = [];
      
      const archive = archiver('zip', {
        zlib: { level: 6 }
      });

      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Process each speaker
      for (const [speakerId, speakerSamples] of Object.entries(samplesBySpeaker)) {
        let textContent = '';
        let wavScpContent = '';
        let utt2spkContent = '';

        for (const sample of speakerSamples) {
          const uttId = `${speakerId}_${sample.id}`;
          const transcript = sample.verifiedTranscript || sample.rawTranscript || '';
          
          textContent += `${uttId} ${transcript}\n`;
          wavScpContent += `${uttId} ${speakerId}/audio/${sample.id}.wav\n`;
          utt2spkContent += `${uttId} ${speakerId}\n`;

          if (sample.audioPath) {
            const audioPath = path.join(process.cwd(), sample.audioPath);
            if (existsSync(audioPath)) {
              try {
                const audioData = await readFile(audioPath);
                archive.append(audioData, { name: `${speakerId}/audio/${sample.id}.wav` });
              } catch (err) {
                console.error('Failed to read audio file:', err);
              }
            }
          }
        }

        archive.append(textContent, { name: `${speakerId}/text.txt` });
        archive.append(wavScpContent, { name: `${speakerId}/wav.scp` });
        archive.append(utt2spkContent, { name: `${speakerId}/utt2spk` });
      }

      // Create spk2utt file
      let spk2uttContent = '';
      for (const [speakerId, speakerSamples] of Object.entries(samplesBySpeaker)) {
        const uttIds = speakerSamples.map(s => `${speakerId}_${s.id}`).join(' ');
        spk2uttContent += `${speakerId} ${uttIds}\n`;
      }
      archive.append(spk2uttContent, { name: 'spk2utt' });

      // Add README
      const readme = `Kaldi Training Data Export
========================

This archive contains voice training data exported from KrisPoint Medical.

Structure:
- speaker_<id>/
  - audio/          : WAV audio files (16kHz mono)
  - text.txt        : Transcriptions (utterance_id transcript)
  - wav.scp         : Audio file paths (utterance_id path)
  - utt2spk         : Utterance to speaker mapping
- spk2utt           : Speaker to utterances mapping

Total speakers: ${Object.keys(samplesBySpeaker).length}
Total samples: ${samples.length}

Export date: ${new Date().toISOString()}
`;
      archive.append(readme, { name: 'README.txt' });

      archive.finalize();
    });

    // Audit log for training data export
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      action: 'TRAINING_DATA_EXPORTED',
      category: 'TRAINING',
      severity: 'INFO',
      resourceType: 'TRAINING_DATA',
      resourceId: 'export',
      description: `Training data exported: ${samples.length} samples from ${Object.keys(samplesBySpeaker).length} speakers`,
      metadata: { sampleCount: samples.length, speakerCount: Object.keys(samplesBySpeaker).length }
    });

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="krispoint_training_data_${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error exporting training data:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to export training data' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
