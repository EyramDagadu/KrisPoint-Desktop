import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeVoiceCommand,
  findVoiceCommandMatch,
  matchVoicePattern,
  MACRO_COMMAND_PATTERN,
  TEMPLATE_COMMAND_PATTERN
} from '../../artifacts/krispoint/src/lib/utils/voiceCommand.js';

test('spoken command prefixes tolerate punctuation inserted by transcription', () => {
  for (const transcript of ['Macro follow-up', 'Macro. follow-up', 'MACRO, follow up', 'Macro—follow up']) {
    const match = transcript.match(MACRO_COMMAND_PATTERN);
    assert.ok(match, transcript);
    assert.equal(normalizeVoiceCommand(match[1]), 'follow up');
  }
  for (const transcript of ['Template normal chest x-ray', 'template, normal chest xray', 'TEMPLATE: normal chest x ray.']) {
    const match = transcript.match(TEMPLATE_COMMAND_PATTERN);
    assert.ok(match, transcript);
    assert.equal(normalizeVoiceCommand(match[1]), 'normal chest xray');
  }
});

test('medical words containing macro remain dictation rather than macro commands', () => {
  for (const transcript of [
    'macrocalcifications',
    'Macrocalcifications are present.',
    'There are coarse macrocalcifications within the nodule.',
    'A pituitary macroadenoma is identified.',
    'Macrophages are present.',
    'No macroscopic fat is demonstrated.',
    'Macronodules are seen.'
  ]) {
    assert.equal(matchVoicePattern(transcript, MACRO_COMMAND_PATTERN), null, transcript);
  }
});

test('matching ignores punctuation, case and spacing without changing the source text', () => {
  const macros = [{ name: 'Follow-up', voiceCommand: 'follow-up', content: 'Follow-up is recommended.' }];
  assert.equal(findVoiceCommandMatch(macros, 'follow. up!', { includeName: true }).item, macros[0]);
  assert.equal(macros[0].content, 'Follow-up is recommended.');

  const templates = [{ name: 'Normal chest X-ray', voiceCommand: 'normal chest x-ray' }];
  assert.equal(findVoiceCommandMatch(templates, 'NORMAL, chest xray').item, templates[0]);
  const nameOnly = [{ name: 'Follow-up', voiceCommand: null }];
  assert.equal(findVoiceCommandMatch(nameOnly, 'follow. up', { includeName: true }).item, nameOnly[0]);
  assert.equal(normalizeVoiceCommand('CT-scan'), normalizeVoiceCommand('CT scan'));
  assert.equal(normalizeVoiceCommand('chest x-ray'), normalizeVoiceCommand('chest x ray'));
});

test('other spoken actions tolerate punctuation without altering dictated text', () => {
  assert.ok(matchVoicePattern('new, paragraph.', /new paragraph/i));
  assert.ok(matchVoicePattern('go to: findings', /go to\s+(findings)/i));
  const original = 'dictate No edema, effusion, or mass.';
  assert.equal(matchVoicePattern(original, /dictate (.*)/i, { preservePayload: true })[1],
    'No edema, effusion, or mass.');
});

test('exact matches take priority, while ambiguous partial or punctuation aliases are refused', () => {
  const chest = { name: 'Chest', voiceCommand: 'normal chest', content: 'chest' };
  const xray = { name: 'Chest X-ray', voiceCommand: 'normal chest xray', content: 'xray' };
  assert.equal(findVoiceCommandMatch([chest, xray], 'normal chest x-ray', { allowPartial: true }).item, xray);
  assert.equal(findVoiceCommandMatch([chest, xray], 'normal', { allowPartial: true }).ambiguous, true);
  assert.equal(findVoiceCommandMatch([chest, xray], 'normal chest', { allowPartial: true }).item, chest);
  const duplicate = { name: 'Alternate chest', voiceCommand: 'normal, chest x-ray' };
  assert.deepEqual(
    findVoiceCommandMatch([xray, duplicate], 'normal chest xray'),
    { item: null, ambiguous: true }
  );
  assert.deepEqual(findVoiceCommandMatch([chest], 'unrelated'), { item: null, ambiguous: false });
});