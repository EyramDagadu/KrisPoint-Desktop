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

async function loadByoModule() {
  const directory = mkdtempSync(join(tmpdir(), 'krispoint-ai-byo-'));
  const output = join(directory, 'ai-byo.mjs');
  execFileSync(resolve(root, 'node_modules/.bin/esbuild'), [
    resolve(root, 'src/lib/server/aiByo.ts'),
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

test('impression safety allows derived summaries but protects source facts', async () => {
  const { module, cleanup } = await loadAiPolishModule();
  try {
    const source = 'There is a 12 mm left lung nodule. No pleural effusion. Follow-up is advised.';
    assert.deepEqual(
      module.checkImpressionSafety(source, '12 mm left lung nodule. No pleural effusion.'),
      []
    );
    assert.ok(
      module.checkImpressionSafety(source, '12 mm left lung nodule suspicious for malignancy.').some(
        warning => warning.code === 'UNSUPPORTED_CLINICAL_CLAIM'
      )
    );
    assert.ok(
      module.checkImpressionSafety(
        '12 mm left lung nodule; right pleural effusion.',
        '12 mm right lung nodule; left pleural effusion.'
      ).some(warning => warning.code === 'CLINICAL_CLAIM_REASSOCIATED')
    );
    for (const [source, candidate] of [
      [
        'Left femoral neck fracture; right humeral head fracture.',
        'Right femoral neck fracture; left humeral head fracture.'
      ],
      [
        'Right pneumonia; left atelectasis.',
        'Left pneumonia; right atelectasis.'
      ]
    ]) {
      assert.ok(
        module.checkImpressionSafety(source, candidate).some(
          warning => warning.code === 'CLINICAL_CLAIM_REASSOCIATED'
        ),
        candidate
      );
    }
    assert.deepEqual(
      module.checkImpressionSafety(
        'Left lung nodule; no pleural effusion.',
        'Left lung nodule and no pleural effusion.'
      ),
      []
    );
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

test('Solo AI proxy applies remote policy before transmitting to the gateway', () => {
  const route = read('src/routes/api/ai/polish/+server.ts');
  const policy = route.indexOf('findExplicitIdentifiers');
  const proxy = route.indexOf('proxyToHostedGateway(request, bytes)');
  assert.ok(policy >= 0 && policy < proxy);
  assert.match(route, /KRISPOINT_REMOTE_AI_ENABLED/);
  assert.match(route, /KRISPOINT_AI_ALLOW_IDENTIFIERS/);
});

test('AI status is authenticated, bounded, and does not expose provider settings', () => {
  const status = read('src/routes/api/ai/status/+server.ts');
  assert.match(status, /validateSessionFromRequest/);
  assert.match(status, /new URL\(['"]\/health['"]/);
  assert.match(status, /boundedText/);
  assert.match(status, /Cache-Control/);
  assert.doesNotMatch(status, /GROQ_MODEL/);
  assert.match(status, /mode/);
  assert.match(status, /BYO_AI_BASE_URL/);
});

test('client sends only signed licence metadata and never a provider key', () => {
  const client = read('src/lib/components/reporting/aiPolishService.js');
  assert.match(client, /key: license\.key/);
  assert.match(client, /machineId: license\.machineId/);
  assert.match(client, /payload: license\.payload/);
  assert.match(client, /signature: license\.signature/);
  assert.doesNotMatch(client, /GROQ_|api\.groq\.com|authorization/i);
});

test('provider mode selects an exclusive destination before report transmission', () => {
  const client = read('src/lib/components/reporting/aiPolishService.js');
  const disabled = client.indexOf("providerMode === 'disabled'");
  const ollama = client.indexOf("providerMode === 'ollama'");
  const hosted = client.indexOf("fetch('/api/ai/polish'");
  assert.ok(disabled >= 0 && disabled < hosted);
  assert.ok(ollama >= 0 && ollama < hosted);
  assert.match(client, /ollamaService\.polishReport/);
  assert.match(client, /ollamaService\.generateImpression/);
  assert.match(client, /providerMode,\s*[\r\n]+\s*template/);
  assert.match(client, /\/api\/ai\/status/);
});

test('impression generation is a separately labelled review action', () => {
  const client = read('src/lib/components/reporting/aiPolishService.js');
  const component = read('src/lib/components/reporting/AIRefineButton.svelte');
  assert.match(client, /action === 'impression'/);
  assert.match(client, /action: action === 'impression' \? 'impression'/);
  assert.match(component, /Generate impression/);
  assert.match(component, /onReportGenerated\(proposedContent, proposalAction\)/);
  assert.match(read('src/lib/components/reporting/TipTapReportEditor.svelte'), /action === 'impression'/);
});

test('provider mismatches fail closed server-side', () => {
  const route = read('src/routes/api/ai/polish/+server.ts');
  const byo = read('src/lib/server/aiByo.ts');
  assert.match(route, /PROVIDER_MISMATCH/);
  assert.match(route, /PROVIDER_NOT_READY/);
  assert.match(route, /serverProviderReady/);
  assert.match(byo, /BYO_AI_BASE_URL/);
  assert.match(byo, /BYO_AI_API_KEY/);
  assert.match(byo, /BYO_AI_MODEL/);
  assert.match(byo, /protocol !== ['"]https:/);
  assert.match(route, /requestedProvider !== ['"]hosted['"]/);
});

test('BYO adapter destination spy stays server-side and OpenAI-compatible', async () => {
  const { module, cleanup } = await loadByoModule();
  let calledUrl;
  let requestBody;
  try {
    const config = module.resolveByoConfig({
      BYO_AI_BASE_URL: 'https://byo.example.test',
      BYO_AI_API_KEY: 'server-only',
      BYO_AI_MODEL: 'model-1',
      NODE_ENV: 'production'
    });
    const provider = new module.ByoPolishProvider(async (url, options) => {
      calledUrl = String(url);
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ polishedText: 'A clear report.', changes: [] }) } }]
      }));
    });
    const output = await provider.polish(
      { report: 'A clear report.', action: 'polish' },
      config
    );
    assert.equal(output, 'A clear report.');
    assert.equal(calledUrl, 'https://byo.example.test/v1/chat/completions');
    assert.equal(requestBody.model, 'model-1');
    assert.equal(requestBody.messages[1].content.includes('A clear report.'), true);
  } finally {
    cleanup();
  }
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