// undefined uses the organization default; null deliberately omits letterhead.
export function previewLetterheadOverride(isSoloEdition, letterheads, selectedId) {
    if (!isSoloEdition) return undefined;
    return letterheads.find(letterhead => String(letterhead.id) === selectedId) || null;
}