// Deliberately conservative detection: dates, measurements, anatomy, and
// ordinary clinical prose are not identifiers. Explicit labels/contact
// identifiers are reported everywhere; unlabeled person-name detection is
// restricted to indication/template context.
const IDENTIFIER_RULES = [
  ['PATIENT_NAME', /\bpatient\s*(?:name\s*)?[:#=-](?:\s*[^\n,;|]{2,100})?/i],
  ['PATIENT_NAME', /\bname\s*[:#=-]\s*[^\n,;|]{2,100}/i],
  ['MRN', /\b(?:mrn|medical\s+record\s+(?:number|no)|hospital\s+(?:number|no))\s*[:#=-]?\s*[A-Z0-9][A-Z0-9 -]{2,}/i],
  ['ACCESSION', /\baccession(?:\s+(?:number|no))?\s*[:#=-]?\s*[A-Z0-9][A-Z0-9 -]{2,}/i],
  ['EMAIL', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['PHONE', /\b(?:phone|telephone|mobile|contact\s+number)\s*[:#=-]?\s*(?:\+?\d[\d\s().-]{6,}\d)/i]
];
const CLINICAL_NAME_ALLOWLIST = new Set(
  `a an and acute abdomen abdominal abnormality abnormal abnormalities adrenal airway all also analysis appears
  approach artery assessment atelectasis bilateral bladder bone bowel brain breast cardiac cardiopulmonary cardiomediastinal
  cervical chest chronic clear comparison compatible conclusion consistent cortical demonstrate
  demonstrated demonstrates density diagnosis diaphragm diffuse disease distal effusion esophagus
  evident examination findings follow-up fracture frontal gallbladder gastric head heart hepatic
  hilum history impression inferior inner identified imaging kidney left lesion level liver lobe
  lower lumbar lymph lung lungs mass medial mediastinal midline mild moderate normal nodule noted
  no none observation opacity or ovary pancreas patient pelvis pleural possible posterior prostate provided
  pulmonary recommendation renal report right rib scattered seen severe sinus spleen spine stable
  stomach suggestive technique tendon thoracic thyroid tissue trachea transabdominal ultrasound upper uterus vascular vein
  visualized without within there this the ct mri xray ap pa bibasilar silhouette focal consolidation
  infiltrate infiltrates opacity opacities prominence prominent interstitial degenerative changes
  change changes postoperative post surgical acute chronic`.split(/\s+/)
);

function hasUnlabeledPersonName(value) {
  const titleCase = /\b(?:[A-Z][a-z]{2,}|[A-Z]\.)\s+(?:(?:[A-Z][a-z]{2,}|[A-Z]\.)\s+)?[A-Z][a-z]{2,}\b/g;
  const spacedInitials = /\b[A-Z](?:\s+[A-Z]){1,3}\s+[A-Z][a-z]{2,}\b/g;
  const allCaps = /\b[A-Z]{2,}(?:\s+[A-Z]{2,}){1,3}\b/g;
  const candidates = [
    ...value.matchAll(titleCase),
    ...value.matchAll(spacedInitials),
    ...value.matchAll(allCaps)
  ];
  return candidates.some(match => {
    const words = match[0].replace(/\./g, '').split(/\s+/);
    if (words.length < 2) return false;
    return words.some(word => !CLINICAL_NAME_ALLOWLIST.has(word.toLowerCase()));
  });
}

export function findExplicitIdentifiers(value) {
  if (typeof value !== 'string' || !value) return [];
  const codes = new Set(
    IDENTIFIER_RULES
      .filter(([, pattern]) => pattern.test(value))
      .map(([code]) => code)
  );
  return [...codes].map(code => ({ code }));
}

export function findExplicitIdentifiersInRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return [];
  const parts = [];
  const nameEligibleParts = [];
  const excludedKeys = new Set(['licenseEnvelope', 'license', 'licence', 'providerMode', 'action']);
  const visit = (value, key, path) => {
    if (key && excludedKeys.has(key)) return;
    if (typeof value === 'string') {
      parts.push({ value, path });
      if (path[0] === 'indication' || path[0] === 'template') nameEligibleParts.push(value);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, '', path);
      return;
    }
    if (value && typeof value === 'object') {
      for (const [childKey, childValue] of Object.entries(value)) {
        visit(childValue, childKey, path.concat(childKey));
      }
    }
  };
  visit(input, '', []);
  const explicit = findExplicitIdentifiers(parts.map(part => part.value).join('\n'));
  if (explicit.length) return explicit;
  if (nameEligibleParts.some(value => hasUnlabeledPersonName(value))) {
    return [{ code: 'UNLABELED_PERSON_NAME' }];
  }
  return [];
}