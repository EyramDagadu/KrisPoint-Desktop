import { writable } from 'svelte/store';

export const aiPolishDraft = writable({
  selectedTemplate: null,
  originalContent: '',
  proposedContent: '',
  blocked: false,
  warnings: []
});
