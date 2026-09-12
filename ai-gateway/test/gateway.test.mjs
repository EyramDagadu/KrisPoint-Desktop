import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { once } from 'node:events';
import test from 'node:test';
import { createGatewayServer, MAX_JSON_BYTES } from '../src/server.mjs';
import { checkImpressionSafety } from '../src/safety.mjs';

function license(publicKey, privateKey) {
  const payload = Buffer.from(JSON.stringify({
    key: 'test-license', expiresAt: new Date(Date.now() + 60_000).toISOString(), features: ['ai_polish']
  })).toString('base64');
  const signature = sign(null, Buffer.from(payload, 'base64'), privateKey).toString('base64');
  return { key: 'test-license', machineId: 'test-machine', payload, signature, publicKey };
}

async function setup(options = {}) {
  const pair = generateKeyPairSync('ed25519');
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const envelope = license(publicKey, pair.privateKey);
  const server = createGatewayServer({
    publicKey: pair.publicKey,
    licenseServerUrl: 'https://license.test',
    groqApiKey: 'test-secret',
    ...options,
    fetchImpl: options.fetchImpl || (async (url) => {
      if (url.includes('/api/license/validate')) {
        return new Response(JSON.stringify({ valid: options.licenseValid !== false }), { status: 200 });
      }
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ polishedText: 'A clear report.', changes: [] }) } }]
      }), { status: 200 });
    })
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, envelope };
}

test('health is available and polish verifies license before provider', async () => {
  const { server, envelope } = await setup();
  try {
    const address = server.address();
    const health = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(health.status, 200);
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ licenseEnvelope: envelope, report: 'A clear report.' })
    });
    assert.equal(result.status, 200);
    assert.equal((await result.json()).polishedText, 'A clear report.');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('browser cross-site requests are rejected', async () => {
  const { server } = await setup();
  try {
    const address = server.address();
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site'
      },
      body: '{}'
    });
    assert.equal(result.status, 403);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('revoked and unavailable license authority fail closed before provider', async () => {
  let providerCalls = 0;
  const authorityBodies = [];
  for (const [name, authorityResult, expected] of [
    ['revoked', { valid: false }, 403],
    ['machine mismatch', { valid: false, error: 'License not activated for this device' }, 403],
    ['unavailable', null, 503]
  ]) {
    const fetchImpl = async (url, options) => url.includes('/api/license/validate')
      ? (authorityBodies.push(JSON.parse(options.body)),
        authorityResult
          ? new Response(JSON.stringify(authorityResult), { status: 200 })
          : Promise.reject(new Error('license server down')))
      : (++providerCalls, new Response('{}'));
    const { server, envelope } = await setup({ fetchImpl });
    try {
      const address = server.address();
      const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ licenseEnvelope: envelope, report: 'A clear report.' })
      });
      assert.equal(result.status, expected, name);
    } finally {
      server.close();
      await once(server, 'close');
    }
  }
  assert.equal(providerCalls, 0);
  assert.equal(authorityBodies.length, 3);
  for (const body of authorityBodies) {
    assert.deepEqual(Object.keys(body).sort(), ['licenseKey', 'machineId', 'payload', 'signature']);
  }
});

test('provider adapter seam preserves the client API when switching provider and model', async () => {
  let selectedModel = '';
  const { server, envelope } = await setup({
    provider: 'fake',
    model: 'fake-model-v1',
    providerAdapter: {
      async polish(input, context) {
        selectedModel = context.model;
        return input.report;
      }
    }
  });
  try {
    const address = server.address();
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ licenseEnvelope: envelope, report: 'A clear report.' })
    });
    assert.equal(result.status, 200);
    assert.equal((await result.json()).polishedText, 'A clear report.');
    assert.equal(selectedModel, 'fake-model-v1');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('hosted impression action uses the impression prompt and structured response', async () => {
  let providerRequest;
  const setupResult = await setup({
    fetchImpl: async (url, options) => {
      if (url.includes('/api/license/validate')) return new Response('{"valid":true}');
      providerRequest = JSON.parse(options.body);
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({
          polishedText: '12 mm left lung nodule.',
          changes: []
        }) } }]
      }));
    }
  });
  try {
    const address = setupResult.server.address();
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        licenseEnvelope: setupResult.envelope,
        action: 'impression',
        indication: 'Cough',
        report: 'There is a 12 mm left lung nodule.'
      })
    });
    assert.equal(result.status, 200);
    assert.equal((await result.json()).polishedText, '12 mm left lung nodule.');
    assert.match(providerRequest.messages[0].content, /impression/i);
    assert.match(providerRequest.messages[1].content, /"action":"impression"/);
  } finally {
    setupResult.server.close();
    await once(setupResult.server, 'close');
  }
});

test('impression safety blocks measurement/laterality reassociation', () => {
  const warnings = checkImpressionSafety(
    '12 mm left lung nodule; right pleural effusion.',
    '12 mm right lung nodule; left pleural effusion.'
  );
  assert.ok(warnings.some(warning => warning.code === 'CLINICAL_CLAIM_REASSOCIATED'));
});

test('impression association is vocabulary-independent and permits safe consolidation', () => {
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
      checkImpressionSafety(source, candidate).some(
        warning => warning.code === 'CLINICAL_CLAIM_REASSOCIATED'
      ),
      candidate
    );
  }
  assert.deepEqual(
    checkImpressionSafety(
      'Left lung nodule; no pleural effusion.',
      'Left lung nodule and no pleural effusion.'
    ),
    []
  );
});

test('unsupported provider names fail closed at gateway startup', () => {
  const pair = generateKeyPairSync('ed25519');
  assert.throws(() => createGatewayServer({
    provider: 'not-supported',
    publicKey: pair.publicKey,
    licenseServerUrl: 'https://license.test'
  }), /Unsupported AI provider/);
});

test('license authority receives metadata only and provider receives no license envelope', async () => {
  let authorityBody;
  let providerBody;
  const setupResult = await setup({
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body);
      if (url.includes('/api/license/validate')) {
        authorityBody = body;
        return new Response('{"valid":true}');
      }
      providerBody = body;
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ polishedText: 'A clear report.', changes: [] }) } }]
      }));
    }
  });
  try {
    const address = setupResult.server.address();
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        licenseEnvelope: setupResult.envelope,
        report: 'A clear report.',
        template: 'Style only'
      })
    });
    assert.equal(result.status, 200);
    assert.deepEqual(Object.keys(authorityBody).sort(), ['licenseKey', 'machineId', 'payload', 'signature']);
    assert.equal(JSON.stringify(authorityBody).includes('A clear report.'), false);
    assert.equal(JSON.stringify(providerBody).includes('licenseEnvelope'), false);
    assert.equal(JSON.stringify(providerBody).includes('test-machine'), false);
  } finally {
    setupResult.server.close();
    await once(setupResult.server, 'close');
  }
});

test('gateway policy blocks direct originless licensed identifier requests', async () => {
  let providerCalls = 0;
  const setupResult = await setup({
    fetchImpl: async (url) => url.includes('/api/license/validate')
      ? new Response('{"valid":true}')
      : (++providerCalls, new Response('{}'))
  });
  try {
    const address = setupResult.server.address();
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        licenseEnvelope: setupResult.envelope,
        report: 'There is a 12 mm nodule.',
        indication: 'Patient name: Jane Doe.'
      })
    });
    assert.equal(result.status, 422);
    assert.equal(providerCalls, 0);
  } finally {
    setupResult.server.close();
    await once(setupResult.server, 'close');
  }
});

test('gateway blocks Ghanaian-style and initialed context names before provider call', async () => {
  let providerCalls = 0;
  const setupResult = await setup({
    fetchImpl: async (url) => url.includes('/api/license/validate')
      ? new Response('{"valid":true}')
      : (++providerCalls, new Response('{}'))
  });
  try {
    const address = setupResult.server.address();
    for (const bodyField of [
      { indication: 'Kwame Kofi Mensah for chest pain.' },
      { template: { findingsHtml: 'J. K. Mensah' } },
      { indication: 'Patient: Ama Serwaa Osei.' },
      { indication: 'Patient name:' },
      { template: 'Name: Jane Doe' }
    ]) {
      const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          licenseEnvelope: setupResult.envelope,
          report: 'There is a 12 mm nodule.',
          ...bodyField
        })
      });
      assert.equal(result.status, 422);
    }
    assert.equal(providerCalls, 0);
  } finally {
    setupResult.server.close();
    await once(setupResult.server, 'close');
  }
});

test('rate limiting identity is the verified license and machine, not source IP', async () => {
  const identities = [];
  const setupResult = await setup({
    limiter: {
      acquire(identity) {
        identities.push(identity);
        return () => {};
      }
    }
  });
  try {
    const address = setupResult.server.address();
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ licenseEnvelope: setupResult.envelope, report: 'A clear report.' })
    });
    assert.equal(result.status, 200);
    assert.deepEqual(identities, ['test-license:test-machine']);
  } finally {
    setupResult.server.close();
    await once(setupResult.server, 'close');
  }
});

test('provider timeout, cancellation, and oversized responses fail closed', async () => {
  const timeoutFetch = async (url, options) => {
    if (url.includes('/api/license/validate')) return new Response('{"valid":true}');
    return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('cancelled'), { name: 'AbortError' })));
    });
  };
  const timeoutSetup = await setup({ timeoutMs: 20, fetchImpl: timeoutFetch });
  try {
    const address = timeoutSetup.server.address();
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ licenseEnvelope: timeoutSetup.envelope, report: 'A clear report.' })
    });
    assert.equal(result.status, 504);
  } finally {
    timeoutSetup.server.close();
    await once(timeoutSetup.server, 'close');
  }

  const oversizeSetup = await setup({
    fetchImpl: async (url) => url.includes('/api/license/validate')
      ? new Response('{"valid":true}')
      : new Response('x'.repeat(MAX_JSON_BYTES + 1))
  });
  try {
    const address = oversizeSetup.server.address();
    const result = await fetch(`http://127.0.0.1:${address.port}/v1/polish`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ licenseEnvelope: oversizeSetup.envelope, report: 'A clear report.' })
    });
    assert.equal(result.status, 503);
  } finally {
    oversizeSetup.server.close();
    await once(oversizeSetup.server, 'close');
  }
});