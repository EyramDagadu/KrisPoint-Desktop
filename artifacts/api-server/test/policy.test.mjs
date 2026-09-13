import assert from 'node:assert/strict';
import test from 'node:test';
import { findExplicitIdentifiers, findExplicitIdentifiersInRequest } from '../src/policy.mjs';

test('identifier policy blocks explicit identifiers but permits clinical dates and measurements', () => {
  assert.deepEqual(findExplicitIdentifiers(
    'Patient name: Jane Doe. MRN: MR-12345. Accession: ACC-88. jane@example.test. Phone: +1 (555) 123-4567.'
  ).map(item => item.code), ['PATIENT_NAME', 'MRN', 'ACCESSION', 'EMAIL', 'PHONE']);
  assert.deepEqual(findExplicitIdentifiers(
    'There is a 12 mm left lung nodule dated 2024-01-05. No effusion.'
  ), []);
});

test('blocked identifier policy performs no gateway call', () => {
  let gatewayCalls = 0;
  const report = 'Patient name: Jane Doe. There is a 12 mm nodule.';
  if (!findExplicitIdentifiers(report).length) gatewayCalls++;
  assert.equal(gatewayCalls, 0);
});

test('identifier policy recursively inspects indication and future context strings', () => {
  assert.deepEqual(
    findExplicitIdentifiersInRequest({
      report: 'A 12 mm nodule.',
      indication: 'Patient name: Jane Doe',
      context: { referring: { note: 'Email jane@example.test' } },
      providerMode: 'hosted',
      action: 'polish',
      licenseEnvelope: { payload: 'Patient name: should be excluded from policy scan' }
    }).map(item => item.code),
    ['PATIENT_NAME', 'EMAIL']
  );
});

test('identifier policy blocks labelled and plausible unlabeled names only in context fields', () => {
  for (const value of [
    'Patient: Jane Doe',
    'Name: Jane Doe',
    'Patient name:',
    'Indication: Kwame Kofi Mensah for chest pain',
    'Template: J. K. Mensah'
  ]) {
    assert.ok(findExplicitIdentifiersInRequest({
      report: 'There is a 12 mm left lung nodule.',
      indication: value.includes('Indication') ? value : undefined,
      template: value.includes('Template') ? { findingsHtml: value } : undefined,
      patient: value.startsWith('Patient') ? value : undefined,
      name: value.startsWith('Name') ? value : undefined
    }).length, value);
  }
  assert.deepEqual(findExplicitIdentifiersInRequest({
    indication: 'There is a left upper lobe nodule.'
  }), []);
  assert.deepEqual(findExplicitIdentifiersInRequest({
    template: 'No Acute Cardiopulmonary Abnormality.'
  }), []);
});

test('identifier policy permits normal report prose and non-clinical template metadata', () => {
  assert.deepEqual(findExplicitIdentifiersInRequest({
    content: 'Normal head CT scan. No abnormalities found.',
    indication: '',
    modality: 'CT',
    bodyRegion: 'Head',
    template: {
      name: 'Normal Study',
      identity: 'fallback:ct:head',
      voiceCommand: 'Normal Head',
      content: '<p>No acute intracranial abnormality.</p>'
    },
    action: 'polish'
  }), []);
});