export interface PolishInput {
  report: string;
  template?: string;
  modality?: string;
  bodyRegion?: string;
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

function jsonHeaders(): HeadersInit {
  return { 'content-type': 'application/json' };
}

function cleanText(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sentences(value: string): string[] {
  return cleanText(value).split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}

const STOP_WORDS = new Set(
  'a an and are as at be by for from in is it of on or that the this to was were with without'.split(' ')
);
const EDITORIAL_WORDS = new Set(
  'also demonstrated demonstrates evident identified noted present seen shows visualized appears there remains'.split(' ')
);

function contentWords(value: string): string[] {
  return cleanText(value).toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g)?.filter(
    word => word.length > 1 && !STOP_WORDS.has(word)
  ) ?? [];
}

function claimSignatures(value: string): string[] {
  return cleanText(value)
    .split(/[.;!?]+|\b(?:and|but|however)\b|\b(?:findings|impression|comparison|technique)\s*:/i)
    .map(claim => claim.toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) ?? [])
    .map(words => words.filter(word =>
      word.length > 1 && !STOP_WORDS.has(word) && !EDITORIAL_WORDS.has(word)
    ))
    .filter(words => words.length > 0)
    .map(words => words.sort().join('|'))
    .sort();
}

function protectedFacts(value: string): string[] {
  const text = cleanText(value).toLowerCase();
  const facts = new Set<string>();
  const add = (pattern: RegExp) => {
    for (const match of text.matchAll(pattern)) facts.add(match[0].replace(/\s+/g, ' ').trim());
  };
  // Measurements include ranges and the unit, so changing either is unsafe.
  add(/\b\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:mm|cm|m|mL|ml|cc|mg|g|kg|hz|khz|°c|degrees?)\b/gi);
  add(/\b(?:right|left|bilateral|unilateral|midline|r|l)\b/gi);
  add(/\b(?:no|not|without|negative|absent|denies|unremarkable|normal)\b/gi);
  add(/\b(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2}|\d{4})\b/gi);
  add(/\b(?:possible|possibly|probable|likely|unlikely|may represent|cannot exclude|suggestive of|consistent with|compatible with)\b/gi);
  // Common anatomic terms are explicitly protected in addition to the
  // sentence-preservation check (which protects less common anatomy too).
  add(/\b(?:brain|lung|lungs|heart|liver|spleen|kidney|kidneys|aorta|artery|arteries|vein|veins|bone|bones|spine|cervical|thoracic|lumbar|abdomen|pelvis|chest|skull|sinus|sinuses|nodule|mass|lesion|fracture|effusion|pleural|pericardial|lymph node|thyroid|breast|prostate|uterus|ovary|colon|stomach|pancreas|adrenal|bladder|esophagus|trachea|bronchus|lobe|lobes|joint|tendon|ligament)\b/gi);
  return [...facts];
}

export function checkClinicalSafety(source: string, candidate: string): ClinicalWarning[] {
  const warnings: ClinicalWarning[] = [];
  const sourceClaims = claimSignatures(source);
  const candidateClaims = claimSignatures(candidate);
  if (sourceClaims.length !== candidateClaims.length ||
      sourceClaims.some((claim, index) => claim !== candidateClaims[index])) {
    warnings.push({
      code: 'CLINICAL_CLAIM_CHANGED',
      message: 'A clinical claim was added, removed, or associated with different findings',
      blocking: true
    });
  }
  const sourceFacts = protectedFacts(source);
  const candidateFacts = new Set(protectedFacts(candidate));
  for (const fact of sourceFacts) {
    if (!candidateFacts.has(fact)) {
      warnings.push({
        code: 'PROTECTED_FACT_CHANGED',
        message: `Protected clinical fact was changed or omitted: "${fact}"`,
        blocking: true
      });
    }
  }

  // A candidate must retain enough distinctive words from every source
  // sentence. This catches dropped findings while permitting grammar edits.
  const candidateWords = new Set(contentWords(candidate));
  for (const sentence of sentences(source)) {
    const words = [...new Set(contentWords(sentence))];
    if (!words.length) continue;
    const retained = words.filter(word => candidateWords.has(word)).length;
    const minimum = Math.max(1, Math.ceil(words.length * 0.25));
    if (retained < minimum) {
      warnings.push({
        code: 'SOURCE_SENTENCE_OMITTED',
        message: 'A source finding or sentence was omitted from the proposed edit',
        blocking: true
      });
    }
  }

  for (const fact of candidateFacts) {
    if (!sourceFacts.includes(fact)) {
      warnings.push({
        code: 'UNSUPPORTED_FACT_ADDED',
        message: `Unsupported clinical fact was added: "${fact}"`,
        blocking: true
      });
    }
  }
  return warnings;
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
            { role: 'system', content: PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                report: input.report,
                template: input.template || '',
                modality: input.modality || '',
                bodyRegion: input.bodyRegion || ''
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