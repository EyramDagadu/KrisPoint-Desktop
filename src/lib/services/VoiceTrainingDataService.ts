// Voice Training Data Collection Service
// Captures audio and transcripts for training voice recognition models
import { browser } from '$app/environment';

interface TrainingSession {
  sessionId: string;
  audioChunks: Int16Array[];
  startTime: number;
  rawTranscript: string;
  sampleRate: number;
  reportId?: number;
  reportType?: string;
}

interface QualityMetrics {
  avgVolume: number;
  silencePercent: number;
  durationMs: number;
  isAcceptable: boolean;
}

interface TrainingSample {
  sessionId: string;
  audioBlob: Blob;
  rawTranscript: string;
  duration: number;
  reportId?: number;
  reportType?: string;
  avgVolume: number;
  silencePercent: number;
  userId?: number;
}

const MIN_DURATION_MS = 1500;
const MIN_VOLUME_THRESHOLD = 100;
const MAX_SILENCE_PERCENT = 0.7;
const SILENCE_THRESHOLD = 50;

export class VoiceTrainingDataService {
  private isEnabled: boolean = false;
  private currentSession: TrainingSession | null = null;
  private pendingSamples: TrainingSample[] = [];
  private userId: number | null = null;
  private sampleRate: number = 16000;
  private settingsListenerSet: boolean = false;

  constructor() {
    if (browser) {
      this.loadSettings();
      this.setupSettingsListener();
    }
  }

  private async loadSettings() {
    try {
      const { settingsService } = await import('./SettingsService.js');
      if (settingsService) {
        this.isEnabled = settingsService.settings.voice?.contributeTrainingData || false;
        console.log('[VoiceTraining] Loaded settings - contributeTrainingData:', this.isEnabled);
      }
      
      const sessionData = localStorage.getItem('KRISPOINT_SESSION_DATA');
      if (sessionData) {
        const data = JSON.parse(sessionData);
        this.userId = data.user?.id || null;
        console.log('[VoiceTraining] User ID loaded:', this.userId);
      }
    } catch (error) {
      console.error('Failed to load training data settings:', error);
    }
  }

  private setupSettingsListener() {
    if (this.settingsListenerSet || !browser) return;
    this.settingsListenerSet = true;

    window.addEventListener('voiceSettingsChanged', ((event: CustomEvent) => {
      if (event.detail && event.detail.contributeTrainingData !== undefined) {
        this.setEnabled(event.detail.contributeTrainingData);
      }
    }) as EventListener);

    window.addEventListener('settingsChanged', (async () => {
      await this.loadSettings();
    }) as EventListener);
  }

  setEnabled(enabled: boolean) {
    console.log('[VoiceTraining] setEnabled called with:', enabled);
    this.isEnabled = enabled;
    if (!enabled) {
      this.currentSession = null;
    }
  }

  isTrainingEnabled(): boolean {
    return this.isEnabled;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  startSession(reportId?: number, reportType?: string) {
    console.log('[VoiceTraining] startSession called - isEnabled:', this.isEnabled);
    if (!this.isEnabled) {
      console.log('[VoiceTraining] Training disabled, not starting session');
      return;
    }

    this.currentSession = {
      sessionId: this.generateSessionId(),
      audioChunks: [],
      startTime: Date.now(),
      rawTranscript: '',
      sampleRate: this.sampleRate,
      reportId,
      reportType
    };
  }

  setReportContext(reportId?: number, reportType?: string) {
    if (!this.currentSession) return;
    this.currentSession.reportId = reportId;
    this.currentSession.reportType = reportType;
  }

  addAudioChunk(chunk: Int16Array) {
    if (!this.isEnabled || !this.currentSession) return;
    this.currentSession.audioChunks.push(new Int16Array(chunk));
  }

  setRawTranscript(transcript: string) {
    if (!this.isEnabled || !this.currentSession) return;
    this.currentSession.rawTranscript = transcript;
  }

  private calculateQualityMetrics(samples: Int16Array): QualityMetrics {
    const durationMs = Math.round((samples.length / this.sampleRate) * 1000);
    
    if (samples.length === 0) {
      return { avgVolume: 0, silencePercent: 1, durationMs, isAcceptable: false };
    }

    let sumSquares = 0;
    let silentSamples = 0;

    for (let i = 0; i < samples.length; i++) {
      const absValue = Math.abs(samples[i]);
      sumSquares += samples[i] * samples[i];
      if (absValue < SILENCE_THRESHOLD) {
        silentSamples++;
      }
    }

    const avgVolume = Math.sqrt(sumSquares / samples.length);
    const silencePercent = silentSamples / samples.length;

    const isAcceptable = 
      durationMs >= MIN_DURATION_MS &&
      avgVolume >= MIN_VOLUME_THRESHOLD &&
      silencePercent < MAX_SILENCE_PERCENT;

    return { avgVolume, silencePercent, durationMs, isAcceptable };
  }

  async endSession(): Promise<TrainingSample | null> {
    console.log('[VoiceTraining] endSession called - isEnabled:', this.isEnabled, 'hasSession:', !!this.currentSession);
    if (!this.isEnabled || !this.currentSession) {
      console.log('[VoiceTraining] endSession aborted - not enabled or no session');
      return null;
    }
    if (this.currentSession.audioChunks.length === 0) {
      console.log('[VoiceTraining] endSession aborted - no audio chunks');
      return null;
    }
    if (!this.currentSession.rawTranscript.trim()) {
      console.log('[VoiceTraining] endSession aborted - no transcript');
      return null;
    }

    const session = this.currentSession;
    this.currentSession = null;

    const totalLength = session.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    console.log('[VoiceTraining] Total audio length:', totalLength, 'samples, transcript:', session.rawTranscript.substring(0, 50));
    const combinedAudio = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of session.audioChunks) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    const metrics = this.calculateQualityMetrics(combinedAudio);
    console.log('[VoiceTraining] Quality metrics:', metrics);

    if (!metrics.isAcceptable) {
      console.log('[VoiceTraining] Sample REJECTED:', 
        `duration=${metrics.durationMs}ms (min=${MIN_DURATION_MS}), volume=${metrics.avgVolume.toFixed(1)} (min=${MIN_VOLUME_THRESHOLD}), silence=${(metrics.silencePercent * 100).toFixed(1)}% (max=${MAX_SILENCE_PERCENT * 100}%)`);
      return null;
    }
    console.log('[VoiceTraining] Sample ACCEPTED, creating WAV blob');

    const wavBlob = this.int16ToWav(combinedAudio, session.sampleRate);

    const sample: TrainingSample = {
      sessionId: session.sessionId,
      audioBlob: wavBlob,
      rawTranscript: session.rawTranscript,
      duration: metrics.durationMs,
      reportId: session.reportId,
      reportType: session.reportType,
      avgVolume: metrics.avgVolume,
      silencePercent: metrics.silencePercent,
      userId: this.userId || undefined
    };

    this.pendingSamples.push(sample);
    await this.uploadPendingSamples();

    return sample;
  }

  private int16ToWav(samples: Int16Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    const audioData = new Int16Array(buffer, 44, samples.length);
    audioData.set(samples);

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private async uploadPendingSamples() {
    console.log('[VoiceTraining] uploadPendingSamples called, pending count:', this.pendingSamples.length);
    if (this.pendingSamples.length === 0) return;

    const samplesToUpload = [...this.pendingSamples];
    this.pendingSamples = [];

    for (const sample of samplesToUpload) {
      try {
        console.log('[VoiceTraining] Uploading sample:', sample.sessionId, 'transcript length:', sample.rawTranscript.length);
        const arrayBuffer = await sample.audioBlob.arrayBuffer();
        const base64Audio = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const response = await fetch('/api/voice-training/samples', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: sample.sessionId,
            audioBase64: base64Audio,
            audioFormat: 'wav',
            rawTranscript: sample.rawTranscript,
            duration: sample.duration,
            reportId: sample.reportId,
            reportType: sample.reportType,
            avgVolume: sample.avgVolume,
            silencePercent: sample.silencePercent
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[VoiceTraining] Upload FAILED:', response.status, errorText);
          this.pendingSamples.push(sample);
        } else {
          console.log('[VoiceTraining] Upload SUCCESS for sample:', sample.sessionId);
        }
      } catch (error) {
        console.error('[VoiceTraining] Upload ERROR:', error);
        this.pendingSamples.push(sample);
      }
    }
  }
}

export const voiceTrainingDataService = new VoiceTrainingDataService();
