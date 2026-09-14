export const BETA_TERMS_VERSION = '2026-09-14-v1';
export const BETA_TERMS_STORAGE_KEY = `krispoint_solo_beta_terms_${BETA_TERMS_VERSION}`;

export const BETA_TERMS_SECTIONS = [
  {
    title: 'Pre-release software',
    body: 'KrisPoint Solo Beta is unfinished evaluation software. Features may be incomplete, unstable, changed, suspended, or removed before the final release.'
  },
  {
    title: 'Testing only — not for patient care',
    body: 'Do not use this beta to diagnose, treat, manage, or make decisions about real patients. It does not replace professional judgment, approved clinical systems, or your organization’s safety procedures.'
  },
  {
    title: 'No real patient information',
    body: 'Use fictitious or properly de-identified test data only. Do not enter names, dates of birth, medical record numbers, images, reports, or any other information that could identify a real patient.'
  },
  {
    title: 'Unsigned test build',
    body: 'This test installer is not yet code-signed or notarized. Your operating system may show an unknown-publisher or security warning. Install it only when received through the official KrisPoint beta channel, and do not redistribute it.'
  },
  {
    title: 'Backups and possible data loss',
    body: 'Beta data formats may change and local data may be corrupted or lost. Keep independent backups of anything needed for testing. Beta data is not guaranteed to migrate to the final release.'
  },
  {
    title: 'Availability, support, and warranty',
    body: 'The beta is provided for evaluation as available, without guaranteed uptime, compatibility, support response, or fitness for clinical or production use. To the extent permitted by law, KrisPoint is not responsible for losses caused by use outside these beta conditions.'
  },
  {
    title: 'Feedback and confidentiality',
    body: 'You may provide bug reports and product feedback for KrisPoint to use in improving the product. Do not publicly share non-public beta materials, screenshots, installers, or technical details without written permission.'
  },
  {
    title: 'Final release',
    body: 'This beta is not the final commercial release. The final release may require a separate license, updated terms, signed installers, and a fresh installation or migration.'
  }
];