const MODALITY_ALIASES = Object.freeze({
  ctscan: 'ct',
  ultrasound: 'us',
  mammography: 'mg',
  fluoroscopy: 'fl',
  nuclearmedicine: 'nm'
});

export function normalizeModality(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return MODALITY_ALIASES[normalized] || normalized;
}

export function matchesModality(itemModality, selectedModality) {
  const selected = normalizeModality(selectedModality);
  if (!selected) return true;

  const item = normalizeModality(itemModality);
  if (!item || item === 'all' || item === 'general') return true;

  return item === selected;
}