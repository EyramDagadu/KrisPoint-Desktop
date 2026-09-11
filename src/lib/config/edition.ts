export type KrisPointEdition = 'hospital' | 'solo';

function detectEdition(): KrisPointEdition {
  const configured = import.meta.env.VITE_KRISPOINT_EDITION;
  if (configured === 'hospital' || configured === 'solo') {
    return configured;
  }
  return 'hospital';
}

export const appEdition = detectEdition();
export const isSoloEdition = appEdition === 'solo';

export const editionCapabilities = Object.freeze({
  collaboration: !isSoloEdition,
  multiUserAdministration: !isSoloEdition,
  sharedWorklist: !isSoloEdition,
  localVoiceLifecycle: isSoloEdition,
  localBackupRestore: isSoloEdition
});
