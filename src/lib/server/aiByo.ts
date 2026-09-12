import {
  AI_TIMEOUT_MS,
  MAX_JSON_BYTES,
  MAX_REPORT_BYTES
} from './aiPolish';

export interface ByoConfig {
  url: URL;
  key: string;
  model: string;
}

export interface ByoInput {
  report: string;
  template?: string;
  modality?: string;
  bodyRegion?: string;
  indication?: string;
  action?: 'polish' | 'impression';
}

const PROMPT = `You are a radiology report editor. Polish grammar, clarity, and organization only.
Return JSON with exactly this shape: {"polishedText":"string","changes":["string"]}.
Never invent, infer, add, remove, or change a clinical fact. Preserve every finding and sentence meaning,
including all measurements and units, laterality, negation, anatomy, dates, certainty/degree of confidence,
and recommendations.`;
const IMPRESSION_PROMPT = `Draft only a concise radiology impression from the supplied report facts.
Return JSON with exactly this shape: {"polishedText":"string","changes":["string"]}.
Use only explicit facts from the report and indication. Never add a diagnosis, recommendation, comparison,
or certainty. Preserve measurements, units, laterality, negation, anatomy, and certainty.`;

export function resolveByoConfig(
  environment: Record<string, string | undefined> = process.env
): ByoConfig | null {
  const base = environment.BYO_AI_BASE_URL?.trim();
  const key = environment.BYO_AI_API_KEY?.trim();
  const model = environment.BYO_AI_MODEL?.trim();
  if (!base || !key || !model) return null;
  try {
    const url = new URL('/v1/chat/completions', base);
    if (environment.NODE_ENV === 'production' && url.protocol !== 'https:') return null;
    return { url, key, model };
  } catch {
    return null;
  }
}

async function boundedText(response: Response): Promise<string> {
  if (!response.body) throw new Error('BYO AI returned no response body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_JSON_BYTES) {
      await reader.cancel();
      throw new Error('BYO AI returned an oversized response');
    }
    chunks.push(value);
  }
  const output = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(output);
}

function parseOutput(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('BYO AI returned invalid output');
  }
  const object = value as Record<string, unknown>;
  if (Object.keys(object).some(key => key !== 'polishedText' && key !== 'changes') ||
      typeof object.polishedText !== 'string' ||
      (object.changes !== undefined && (!Array.isArray(object.changes) ||
        object.changes.length > 100 ||
        object.changes.some(change => typeof change !== 'string' ||
          Buffer.byteLength(change, 'utf8') > 1_000)))) {
    throw new Error('BYO AI returned invalid structured response');
  }
  if (!object.polishedText.trim() || Buffer.byteLength(object.polishedText, 'utf8') > MAX_REPORT_BYTES) {
    throw new Error('BYO AI returned an invalid report');
  }
  return object.polishedText;
}

export class ByoPolishProvider {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async polish(input: ByoInput, config: ByoConfig, signal?: AbortSignal): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const response = await this.fetchImpl(config.url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.key}`,
          'content-type': 'application/json'
        },
        redirect: 'error',
        body: JSON.stringify({
          model: config.model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: input.action === 'impression' ? IMPRESSION_PROMPT : PROMPT
            },
            {
              role: 'user',
              content: JSON.stringify({
                report: input.report,
                template: input.template || '',
                indication: input.indication || '',
                modality: input.modality || '',
                bodyRegion: input.bodyRegion || '',
                action: input.action || 'polish'
              })
            }
          ]
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('BYO AI provider request failed');
      const envelope = JSON.parse(await boundedText(response)) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const content = envelope.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('BYO AI returned no structured response');
      return parseOutput(JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim()));
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
}