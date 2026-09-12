import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

async function loadAiPolishModule() {
  const directory = mkdtempSync(join(tmpdir(), 'krispoint-ai-polish-'));
  const output = join(directory, 'ai-polish.mjs');
  execFileSync(resolve(root, 'node_modules/.bin/esbuild'), [
    resolve(root, 'src/lib/server/aiPolish.ts'),
    '--bundle',
    '--platform=node',
    '--format=esm',
    `--outfile=${output}`
  ], { stdio: 'ignore' });
  const module = await import(`${pathToFileURL(output).href}?test=${Date.now()}`);
  return { module, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
}

test('clinical safety blocks changed protected facts', async () => {
  const { module, cleanup } = await loadAiPolishModule();
  try {
    const source = 'There is a 12 mm left upper lobe nodule. No pleural effusion.';
    const changed = 'There is a 10 mm right upper lobe nodule. Pleural effusion is present.';
    const warnings = module.checkClinicalSafety(source, changed);
    assert.ok(warnings.length >= 3);
    assert.ok(warnings.every((warning) => warning.blocking === true));
    assert.ok(warnings.some((warning) => warning.code === 'PROTECTED_FACT_CHANGED'));
    assert.ok(warnings.some((warning) => warning.code === 'UNSUPPORTED_FACT_ADDED'));
  } finally {
    cleanup();
  }
});

test('clinical safety permits wording-only edits', async () => {
  const { module, cleanup } = await loadAiPolishModule();
  try {
    const source = 'There is a 12 mm left upper lobe nodule. No pleural effusion.';
    const edited = 'A 12 mm nodule is present in the left upper lobe. No pleural effusion is seen.';
    assert.deepEqual(module.checkClinicalSafety(source, edited), []);
  } finally {
    cleanup();
  }
});

test('clinical safety preserves fact associations and catches arbitrary additions', async () => {
  const { module, cleanup } = await loadAiPolishModule();
  try {
    const cases = [
      [
        'A 12 mm right lung nodule and a 6 mm left lung nodule.',
        'A 6 mm right lung nodule and a 12 mm left lung nodule.'
      ],
      [
        'No pleural effusion. A pneumothorax is present.',
        'Pleural effusion is present. No pneumothorax.'
      ],
      [
        'Right lower lobe pneumonia.',
        'Right lower lobe atelectasis.'
      ],
      [
        'The lungs are clear.',
        'The lungs are clear. Pulmonary edema is present.'
      ]
    ];
    for (const [source, changed] of cases) {
      const warnings = module.checkClinicalSafety(source, changed);
      assert.ok(
        warnings.some((warning) => warning.code === 'CLINICAL_CLAIM_CHANGED'),
        `${changed} should be blocked`
      );
    }
  } finally {
    cleanup();
  }
});

test('AI route verifies licence before accessing report fields', () => {
  const route = read('src/routes/api/ai/polish/+server.ts');
  assert.ok(route.indexOf('await verifyAiLicense') < route.indexOf('const report ='));
  assert.match(route, /Cache-Control': 'no-store'/);
  assert.doesNotMatch(route, /console\.(?:log|warn|error)\([^)]*(?:report|template|prompt|polished)/i);
});

test('client sends only signed licence metadata and never a provider key', () => {
  const client = read('src/lib/components/reporting/aiPolishService.js');
  assert.match(client, /key: license\.key/);
  assert.match(client, /machineId: license\.machineId/);
  assert.match(client, /payload: license\.payload/);
  assert.match(client, /signature: license\.signature/);
  assert.doesNotMatch(client, /GROQ_|api\.groq\.com|authorization/i);
});

test('Groq credentials remain server-only and outside Solo packaging configuration', () => {
  const server = read('src/lib/server/aiPolish.ts');
  const tauri = read('src-tauri/tauri.conf.json');
  const packaging = read('scripts/package-solo-backend.mjs');
  assert.match(server, /process\.env\.GROQ_API_KEY/);
  assert.doesNotMatch(tauri, /GROQ_API_KEY|api\.groq\.com/);
  assert.doesNotMatch(packaging, /GROQ_API_KEY|api\.groq\.com/);
});

test('template identity is committed only when a proposal is accepted', () => {
  const component = read('src/lib/components/reporting/AIRefineButton.svelte');
  const acceptStart = component.indexOf('function acceptProposal()');
  const acceptEnd = component.indexOf('onDestroy', acceptStart);
  assert.doesNotMatch(component.slice(0, acceptStart), /setActiveTemplate/);
  assert.match(component.slice(acceptStart, acceptEnd), /setActiveTemplate/);
});