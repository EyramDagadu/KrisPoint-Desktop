import { checkClinicalSafety, checkImpressionSafety } from '../../../../api-server/src/safety.mjs';
export { checkClinicalSafety, checkImpressionSafety };

export interface PolishInput {
  report: string;
  template?: string;
  modality?: string;
  bodyRegion?: string;
  indication?: string;
  action?: 'polish' | 'impression';
}

export interface PolishProvider {
  polish(input: PolishInput, signal?: AbortSignal): Promise<string>;
}

export interface ClinicalWarning {
  code: string;
  message: string;
  blocking: true;
}

export const MAX_REPORT_BYTES = 120_000;
export const MAX_TEMPLATE_BYTES = 50_000;
export const MAX_JSON_BYTES = 512_000;
export const AI_TIMEOUT_MS = 30_000;

const PROMPT = `You are a radiology report editor. Polish grammar, clarity, and organization only.
Return JSON with exactly this shape: {"polishedText":"string","changes":["string"]}.
Never invent, infer, add, remove, or change a clinical fact. Preserve every finding and sentence meaning,
including all measurements and units, laterality, negation, anatomy, dates, certainty/degree of confidence,
and recommendations. Do not turn an uncertainty into a diagnosis. Do not add a diagnosis, comparison,
technique, or impression not present in the source. The template is style guidance only and is not a source
of clinical facts. If a safe edit is not possible, return the source text unchanged.`;
const IMPRESSION_PROMPT = `You are a radiologist drafting only the IMPRESSION from the supplied report facts.
Return JSON with exactly this shape: {"polishedText":"string","changes":["string"]}.
Write a concise impression using only facts explicitly present in the report and indication.
Never invent, infer, or add a diagnosis, recommendation, comparison, or certainty. Preserve every
measurement, unit, laterality, negation, anatomy, and degree of certainty that appears in the source.
Do not repeat the full findings or technique. If a safe impression cannot be derived, return the
source report unchanged.`;

function jsonHeaders(): HeadersInit {
  return { 'content-type': 'application/json' };
}

function parseStructuredOutput(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('AI returned an invalid structured response');
  }
  const object = value as Record<string, unknown>;
  const keys = Object.keys(object);
  if (!keys.every(key => key === 'polishedText' || key === 'changes') ||
      typeof object.polishedText !== 'string' ||
      (object.changes !== undefined &&
        (!Array.isArray(object.changes) || object.changes.length > 100 ||
          object.changes.some(change => typeof change !== 'string' || Buffer.byteLength(change, 'utf8') > 1_000)))) {
    throw new Error('AI returned an invalid structured response');
  }
  if (!object.polishedText.trim() || Buffer.byteLength(object.polishedText, 'utf8') > MAX_REPORT_BYTES) {
    throw new Error('AI returned an invalid report');
  }
  return object.polishedText;
}

async function readBoundedResponse(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) throw new Error('AI returned no response body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error('AI returned an oversized response');
    }
    chunks.push(value);
  }
  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(combined);
}

export class GroqPolishProvider implements PolishProvider {
  async polish(input: PolishInput, signal?: AbortSignal): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('AI service is not configured');
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: input.action === 'impression' ? IMPRESSION_PROMPT : PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                report: input.report,
                template: input.template || '',
                modality: input.modality || '',
                 bodyRegion: input.bodyRegion || '',
                 indication: input.indication || '',
                 action: input.action || 'polish'
              })
            }
          ]
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('AI provider request failed');
      const rawResponse = await readBoundedResponse(response, MAX_JSON_BYTES);
      const result = JSON.parse(rawResponse) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const content = result.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('AI returned no structured response');
      let parsed: unknown;
      try {
        const unwrapped = content.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
        parsed = JSON.parse(unwrapped);
      } catch {
        throw new Error('AI returned invalid JSON');
      }
      return parseStructuredOutput(parsed);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
}

export class UserAiLimiter {
  private readonly users = new Map<number, { started: number[]; active: number }>();
  constructor(
    private readonly maxRequests = 10,
    private readonly windowMs = 5 * 60_000,
    private readonly maxConcurrent = 2
  ) {}

  acquire(userId: number): () => void {
    const now = Date.now();
    const state = this.users.get(userId) || { started: [], active: 0 };
    state.started = state.started.filter(start => now - start < this.windowMs);
    if (state.started.length >= this.maxRequests) throw new Error('AI polish rate limit exceeded');
    if (state.active >= this.maxConcurrent) throw new Error('AI polish concurrency limit exceeded');
    state.started.push(now);
    state.active++;
    this.users.set(userId, state);
    return () => {
      const current = this.users.get(userId);
      if (!current) return;
      current.active = Math.max(0, current.active - 1);
      current.started = current.started.filter(start => Date.now() - start < this.windowMs);
      if (!current.active && !current.started.length) this.users.delete(userId);
    };
  }
}

export const aiLimiter = new UserAiLimiter();