const STOP_WORDS = new Set(
  'a an and are as at be by for from in is it of on or that the this to was were with without'.split(' ')
);
const EDITORIAL_WORDS = new Set(
  'also demonstrated demonstrates evident identified noted present seen shows visualized appears there remains'.split(' ')
);

function cleanText(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sentences(value) {
  return cleanText(value).split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}

function contentWords(value) {
  return cleanText(value).toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g)?.filter(
    word => word.length > 1 && !STOP_WORDS.has(word)
  ) ?? [];
}

function impressionContentWords(value) {
  return contentWords(value).filter(word => !EDITORIAL_WORDS.has(word));
}

function claimSignatures(value) {
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

function claimParts(value) {
  return cleanText(value)
    .split(/[.;!?]+|\b(?:and|but|however)\b|\b(?:findings|impression|comparison|technique)\s*:/i)
    .map(claim => claim.trim())
    .filter(Boolean);
}

function protectedAnchors(value) {
  const text = cleanText(value).toLowerCase();
  const anchors = {
    laterality: new Set(),
    measurement: new Set(),
    negation: new Set(),
    certainty: new Set()
  };
  for (const match of text.matchAll(/\b\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:mm|cm|m|mL|ml|cc|mg|g|kg|hz|khz|°c|degrees?)\b/gi)) {
    anchors.measurement.add(match[0].replace(/\s+/g, ' ').trim());
  }
  for (const match of text.matchAll(/\b(?:right|left|bilateral|unilateral|midline|r|l)\b/gi)) {
    anchors.laterality.add({ r: 'right', l: 'left' }[match[0]] || match[0]);
  }
  for (const match of text.matchAll(/\b(?:no|not|without|negative|absent|denies|unremarkable|normal)\b/gi)) {
    anchors.negation.add('negated');
  }
  for (const match of text.matchAll(/\b(?:possible|possibly|probable|likely|unlikely|may represent|cannot exclude|suggestive of|consistent with|compatible with)\b/gi)) {
    const certainty = match[0].replace(/\s+/g, ' ').trim();
    anchors.certainty.add(
      ['probable', 'likely'].includes(certainty) ? 'likely' :
        certainty === 'unlikely' ? 'unlikely' : 'qualified'
    );
  }
  return anchors;
}

function protectedFacts(value) {
  const text = cleanText(value).toLowerCase();
  const facts = new Set();
  const anchors = protectedAnchors(value);
  for (const values of Object.values(anchors)) {
    for (const fact of values) facts.add(fact);
  }
  for (const match of text.matchAll(/\b(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2}|\d{4})\b/gi)) {
    facts.add(match[0].replace(/\s+/g, ' ').trim());
  }
  return [...facts];
}

function claimTokenStructures(value) {
  return claimParts(value).map(text => ({
    tokens: new Set(impressionContentWords(text)),
    anchors: protectedAnchors(text)
  }));
}

export function checkClinicalSafety(source, candidate) {
  const warnings = [];
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
  const candidateWords = new Set(contentWords(candidate));
  for (const sentence of sentences(source)) {
    const words = [...new Set(contentWords(sentence))];
    if (!words.length) continue;
    const retained = words.filter(word => candidateWords.has(word)).length;
    if (retained < Math.max(1, Math.ceil(words.length * 0.25))) {
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

export function checkImpressionSafety(source, candidate) {
  const warnings = [];
  const sourceFacts = protectedFacts(source);
  const candidateFacts = new Set(protectedFacts(candidate));
  // A derived impression may summarize and reorder findings, but it must
  // preserve every clinically material protected fact it carries. Dates are
  // source context rather than impression facts and need not be repeated.
  for (const fact of sourceFacts) {
    if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(fact)) continue;
    if (!candidateFacts.has(fact)) {
      warnings.push({
        code: 'PROTECTED_FACT_CHANGED',
        message: `Protected clinical fact was changed or omitted: "${fact}"`,
        blocking: true
      });
    }
  }
  const sourceClaims = claimTokenStructures(source);
  const candidateClaims = claimTokenStructures(candidate);
  const sourceWords = new Set(sourceClaims.flatMap(claim => [...claim.tokens]));
  for (const claim of candidateClaims) {
    if ([...claim.tokens].some(word => !sourceWords.has(word))) {
      warnings.push({
        code: 'UNSUPPORTED_CLINICAL_CLAIM',
        message: 'The proposed impression contains a clinical claim not supported by the report',
        blocking: true
      });
      break;
    }
  }
  // Facts may be omitted with an omitted source claim, but the generic content
  // tokens and each protected anchor category that remain in a candidate
  // claim must be supported by the same source claim. This deliberately does
  // not classify anatomy or pathology: those are ordinary content tokens.
  const anchorCategories = ['laterality', 'measurement', 'negation', 'certainty'];
  const anchorsCompatible = (sourceAnchors, candidateAnchors) =>
    anchorCategories.every(category => {
      const sourceValues = sourceAnchors[category];
      const candidateValues = candidateAnchors[category];
      if (!sourceValues.size && !candidateValues.size) return true;
      if (sourceValues.size !== candidateValues.size) return false;
      return [...candidateValues].every(value => sourceValues.has(value));
    });
  for (const claim of candidateClaims) {
    const minimumOverlap = Math.max(1, Math.ceil(claim.tokens.size * 0.75));
    const supported = sourceClaims.some(sourceClaim => {
      const overlap = [...claim.tokens].filter(token => sourceClaim.tokens.has(token)).length;
      return overlap >= minimumOverlap &&
        anchorsCompatible(sourceClaim.anchors, claim.anchors);
    });
    if (!supported) {
      warnings.push({
        code: 'CLINICAL_CLAIM_REASSOCIATED',
        message: 'A clinical claim was not supported with compatible facts and context',
        blocking: true
      });
      break;
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