import assert from 'node:assert/strict';
import test from 'node:test';
import { previewLetterheadOverride } from '../../artifacts/krispoint/src/lib/components/reporting/pdfLetterheadSelection.js';

const defaultLetterhead = { id: 1, name: 'Organization default' };
const alternative = { id: 2, name: 'Alternate' };
const saved = [defaultLetterhead, alternative];

test('Solo distinguishes two saved letterheads from no letterhead without mutating the default', () => {
  assert.equal(previewLetterheadOverride(true, saved, '1'), defaultLetterhead);
  assert.equal(previewLetterheadOverride(true, saved, '2'), alternative);
  assert.equal(previewLetterheadOverride(true, saved, ''), null);
  assert.equal(saved[0], defaultLetterhead);
});

test('Hospital previews and exports pass no override, retaining the shared organization default', () => {
  for (const selection of ['1', '2', '']) {
    assert.equal(previewLetterheadOverride(false, saved, selection), undefined);
  }
});