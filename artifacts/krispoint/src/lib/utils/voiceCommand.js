// Normalize only command recognition keys, never the text inserted into a report.
export function normalizeVoiceCommand(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC')
    .toLowerCase()
    .replace(/['’ʼ]/gu, '')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/\bx ray\b/gu, 'xray');
}

export const MACRO_COMMAND_PATTERN = /\bmacro[\s\p{P}\p{S}]+(.+)/iu;
export const TEMPLATE_COMMAND_PATTERN = /\btemplate[\s\p{P}\p{S}]+(.+)/iu;

export function matchVoicePattern(transcript, pattern, { preservePayload = false } = {}) {
  // Prefer the original transcript so any captured name or dictation remains intact.
  return transcript.match(pattern) ||
    (preservePayload ? null : normalizeVoiceCommand(transcript).match(pattern));
}

// Exact voice commands take priority over display names and partial matches.
// Refuse ambiguous matches rather than inserting a different clinical item.
export function findVoiceCommandMatch(items, query, { includeName = false, allowPartial = false } = {}) {
  const key = normalizeVoiceCommand(query);
  if (!key) return { item: null, ambiguous: false };

  const candidates = items.map(item => ({
    item,
    voice: normalizeVoiceCommand(item.voiceCommand),
    name: includeName ? normalizeVoiceCommand(item.name) : ''
  }));
  const result = (matches) => ({
    item: matches.length === 1 ? matches[0].item : null,
    ambiguous: matches.length > 1
  });

  const exactVoice = candidates.filter(candidate => candidate.voice === key);
  if (exactVoice.length) return result(exactVoice);

  if (includeName) {
    const exactName = candidates.filter(candidate => candidate.name === key);
    if (exactName.length) return result(exactName);
  }

  if (allowPartial) {
    const partial = candidates.filter(candidate =>
      [candidate.voice, candidate.name].some(value =>
        value && (value.includes(key) || key.includes(value))
      )
    );
    if (partial.length) return result(partial);
  }

  return { item: null, ambiguous: false };
}