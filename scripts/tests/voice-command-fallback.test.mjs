import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeEach, test } from 'node:test';
import { harness } from './helpers/voice-service-harness.mjs';

const { EnhancedVoiceService, voiceCommandService, state, setBrowser } = harness;

beforeEach(t => {
  setBrowser(false);
  for (const values of Object.values(state)) values.length = 0;
  voiceCommandService.cachedMacros = [];
  voiceCommandService.cachedTemplates = [];
  voiceCommandService.setupCommands();
  voiceCommandService.insertText = text => state.inserted.push({ text });
  voiceCommandService.speakFeedback = text => state.errors.push(text);
  for (const method of ['log', 'warn', 'error']) t.mock.method(console, method, () => {});
});

function service() {
  const instance = new EnhancedVoiceService();
  instance.setupEnhancedCommands();
  instance.insertText = (text, options) => state.inserted.push({ text, options });
  instance.insertDatabaseTemplate = template => state.templates.push(template);
  return instance;
}

function mockLookups(t, { macros = [], templates = [], lookup = null } = {}) {
  return t.mock.method(globalThis, 'fetch', async url => {
    if (url === '/api/user-settings') {
      return { ok: true, json: async () => ({ settings: { macroScope: 'personal', templateScope: 'personal' } }) };
    }
    if (lookup) return lookup(url);
    if (url === '/api/macros?scope=personal') {
      return { ok: true, json: async () => ({ success: true, macros }) };
    }
    if (url === '/api/templates?scope=personal') {
      return { ok: true, json: async () => ({ success: true, templates }) };
    }
    throw new Error(`Unexpected API request: ${url}`);
  });
}

for (const transcript of [
  'Macro. calcifications, seen today.',
  'Template, unregistered findings.'
]) {
  test(`unresolved speech is preserved once with a warning: ${transcript}`, async t => {
    mockLookups(t);
    assert.equal(await service().processTranscript(transcript), false);
    assert.deepEqual(state.inserted, [{ text: transcript + ' ', options: { preserveTranscript: true } }]);
    assert.equal(state.errors.length, 1);
    assert.match(state.errors[0], /not found/);
    assert.equal(state.templates.length, 0);
  });
}

test('compound medical terms and ordinary dictation do not attempt a named lookup', async t => {
  const requests = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected lookup'); });
  const instance = service();
  const transcripts = ['Macrocalcifications are present.', 'No effusion, edema, or mass.'];
  for (const transcript of transcripts) await instance.processTranscript(transcript);
  assert.deepEqual(state.inserted.map(item => item.text), transcripts.map(text => text + ' '));
  assert.equal(requests.mock.callCount(), 0);
  assert.equal(state.errors.length, 0);
});

for (const location of ['local', 'database']) {
  test(`successful ${location} macro inserts content without dictating its invocation`, async t => {
    const macro = { name: 'Follow-up', voiceCommand: 'follow-up', content: 'Follow-up is recommended.' };
    if (location === 'local') state.localMacros.push(macro);
    mockLookups(t, { macros: location === 'database' ? [macro] : [] });
    assert.equal(await service().processTranscript('Macro. follow up.'), true);
    assert.deepEqual(state.inserted, [{ text: macro.content + ' ', options: undefined }]);
    assert.equal(state.errors.length, 0);
    assert.equal(state.successes.length, 1);
  });
}

test('successful template loads once without dictating its invocation', async t => {
  const template = { name: 'Normal chest X-ray', voiceCommand: 'normal chest x-ray', content: 'No acute abnormality.' };
  mockLookups(t, { templates: [template] });
  assert.equal(await service().processTranscript('Template, normal chest xray.'), true);
  assert.deepEqual(state.templates, [template]);
  assert.equal(state.inserted.length, 0);
  assert.equal(state.errors.length, 0);
});

test('slow lookup does not reorder or duplicate the next utterance', async t => {
  let release;
  let started;
  const waiting = new Promise(resolve => { release = resolve; });
  const lookupStarted = new Promise(resolve => { started = resolve; });
  mockLookups(t, { lookup: async () => {
    started();
    await waiting;
    return { ok: true, json: async () => ({ success: true, macros: [] }) };
  } });
  const instance = service();
  const first = instance.processTranscript('Macro calcifications.');
  const second = instance.processTranscript('No effusion.');
  await lookupStarted;
  assert.equal(state.inserted.length, 0);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(state.inserted.map(item => item.text), ['Macro calcifications. ', 'No effusion. ']);
});

test('successful delayed macro still precedes subsequent dictation', async t => {
  let release;
  let started;
  const waiting = new Promise(resolve => { release = resolve; });
  const lookupStarted = new Promise(resolve => { started = resolve; });
  mockLookups(t, { lookup: async () => {
    started();
    await waiting;
    return { ok: true, json: async () => ({
      success: true, macros: [{ name: 'Follow-up', voiceCommand: 'follow-up', content: 'Follow-up advised.' }]
    }) };
  } });
  const instance = service();
  const first = instance.processTranscript('Macro follow-up.');
  const second = instance.processTranscript('No effusion.');
  await lookupStarted;
  release();
  await Promise.all([first, second]);
  assert.deepEqual(state.inserted.map(item => item.text), ['Follow-up advised. ', 'No effusion. ']);
});

for (const kind of ['macro', 'template']) {
  test(`ambiguous ${kind} preserves speech rather than choosing clinical content`, async t => {
    const items = [
      { name: 'First', voiceCommand: 'follow-up', content: 'first' },
      { name: 'Second', voiceCommand: 'follow up', content: 'second' }
    ];
    mockLookups(t, kind === 'macro' ? { macros: items } : { templates: items });
    const transcript = `${kind}, follow-up.`;
    assert.equal(await service().processTranscript(transcript), false);
    assert.deepEqual(state.inserted.map(item => item.text), [transcript + ' ']);
    assert.match(state.errors[0], /Multiple/);
    assert.equal(state.templates.length, 0);
  });
}

for (const kind of ['macro', 'template']) {
  for (const failure of ['network', 'http', 'payload']) {
    test(`${kind} ${failure} lookup failure preserves speech with an explicit warning`, async t => {
      mockLookups(t, { lookup: () => {
        if (failure === 'network') throw new Error('Offline');
        if (failure === 'http') return { ok: false, status: 503 };
        return { ok: true, json: async () => ({ success: false }) };
      } });
      const transcript = `${kind}. unavailable, today.`;
      assert.equal(await service().processTranscript(transcript), false);
      assert.deepEqual(state.inserted.map(item => item.text), [transcript + ' ']);
      assert.match(state.errors[0], /Could not look up/);
    });
  }
}

test('unmatched quick-button commands do not become dictation', async t => {
  mockLookups(t);
  assert.equal(await service().processCommand('Macro missing'), false);
  assert.equal(state.inserted.length, 0);
  assert.match(state.errors[0], /not found/);
});

test('other successful commands remain consumed', async () => {
  const instance = service();
  let count = 0;
  instance.commandPatterns = [{ pattern: /new paragraph/i, action: () => { count++; } }];
  assert.equal(await instance.processTranscript('new, paragraph.'), true);
  assert.equal(count, 1);
  assert.equal(state.inserted.length, 0);
});

test('insertion failure is reported without retrying or blocking the next utterance', async () => {
  const instance = service();
  let attempts = 0;
  instance.insertText = text => {
    attempts++;
    if (attempts === 1) throw new Error('Editor unavailable');
    state.inserted.push({ text });
  };
  const first = instance.processTranscript('First utterance.');
  const second = instance.processTranscript('Second utterance.');
  await assert.rejects(first, /Editor unavailable/);
  await second;
  assert.equal(attempts, 2);
  assert.deepEqual(state.inserted.map(item => item.text), ['Second utterance. ']);
  assert.match(state.errors[0], /Could not insert spoken text/);
});

test('literal fallback reaches the editor without medical command rewriting or recasing', async t => {
  const instance = service();
  instance.insertText = EnhancedVoiceService.prototype.insertText;
  mockLookups(t);
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    setBrowser(false);
  });
  const chain = {
    focus() { return this; },
    insertContent(text) { state.inserted.push({ text }); return this; },
    run() { return true; }
  };
  globalThis.document = { querySelector: () => null };
  globalThis.window = { tiptapEditor: { chain: () => chain, isDestroyed: false } };
  setBrowser(true);
  const transcript = 'Template, Unregistered Findings.';
  await instance.processTranscript(transcript);
  assert.deepEqual(state.inserted, [{ text: transcript + ' ' }]);
  assert.equal(state.processorCalls.length, 0);
});

test('legacy commands preserve unknown speech once and still resolve valid macros/templates', () => {
  for (const transcript of ['Macro calcifications.', 'Template, missing.']) {
    assert.equal(voiceCommandService.processCommand(transcript), false);
  }
  assert.deepEqual(state.inserted.map(item => item.text), ['Macro calcifications. ', 'Template, missing. ']);
  state.inserted.length = 0;
  voiceCommandService.cachedMacros = [{ name: 'Follow-up', voiceCommand: 'follow-up', content: 'Follow-up advised.' }];
  voiceCommandService.cachedTemplates = [{ name: 'Chest', voiceCommand: 'chest x-ray', content: 'Chest is clear.' }];
  assert.equal(voiceCommandService.processCommand('Macro, follow up.'), true);
  assert.equal(voiceCommandService.processCommand('Template chest xray.'), true);
  assert.deepEqual(state.inserted.map(item => item.text), ['Follow-up advised. ', 'Chest is clear.']);
});

test('legacy ambiguous commands preserve speech without inserting either item', () => {
  voiceCommandService.cachedMacros = [
    { name: 'One', voiceCommand: 'follow-up', content: 'one' },
    { name: 'Two', voiceCommand: 'follow up', content: 'two' }
  ];
  assert.equal(voiceCommandService.processCommand('Macro follow-up.'), false);
  assert.deepEqual(state.inserted.map(item => item.text), ['Macro follow-up. ']);
  assert.match(state.errors[0], /Multiple/);
});

test('reporting callback uses speech fallback while quick commands stay command-only', () => {
  const component = readFileSync(new URL(
    '../../artifacts/krispoint/src/lib/components/reporting/EnhancedVoiceControl.svelte', import.meta.url
  ), 'utf8');
  assert.match(component, /enhancedVoiceService\.processTranscript\(result\.transcript, result\.confidence\)/);
  assert.match(component, /await enhancedVoiceService\.processCommand\(command, 1\.0\)/);
  assert.doesNotMatch(component, /const wasCommand = enhancedVoiceService\.processCommand/);
});