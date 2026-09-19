import assert from 'node:assert/strict';
import test from 'node:test';
import {
  matchesModality,
  normalizeModality
} from '../../artifacts/krispoint/src/lib/utils/modality.js';

test('modality normalization resolves report labels to stored macro codes', () => {
  assert.equal(normalizeModality('CT Scan'), 'ct');
  assert.equal(normalizeModality('X-Ray'), 'xray');
  assert.equal(normalizeModality('Ultrasound'), 'us');
  assert.equal(normalizeModality('Mammography'), 'mg');
  assert.equal(normalizeModality('Fluoroscopy'), 'fl');
  assert.equal(normalizeModality('Nuclear Medicine'), 'nm');
  assert.equal(normalizeModality('PET-CT'), 'petct');
});

test('CT and PET-CT macros only match their exact canonical modality', () => {
  assert.equal(matchesModality('ct', 'CT'), true);
  assert.equal(matchesModality('petct', 'PET-CT'), true);
  assert.equal(matchesModality('ct', 'PET-CT'), false);
  assert.equal(matchesModality('petct', 'CT'), false);
});

test('General and unassigned macros remain available across modalities', () => {
  for (const modality of ['CT', 'MRI', 'PET-CT']) {
    assert.equal(matchesModality(null, modality), true);
    assert.equal(matchesModality('', modality), true);
    assert.equal(matchesModality('general', modality), true);
    assert.equal(matchesModality('all', modality), true);
  }
});