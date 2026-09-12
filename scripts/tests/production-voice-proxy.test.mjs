import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { once } from 'node:events';
import { WebSocket, WebSocketServer } from 'ws';
import { attachAuthenticatedVoiceProxy } from '../voice-websocket-proxy.mjs';
import { issueVoiceTicket } from '../../artifacts/krispoint/src/lib/server/voiceTicket.js';

const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const close = server => new Promise(resolve => server.close(resolve));

test('production voice proxy authenticates upgrades and keeps the private token server-side', async () => {
  const privateToken = 'production-private-token';
  const originalToken = process.env.VOICE_CLIENT_TOKEN;
  process.env.VOICE_CLIENT_TOKEN = privateToken;

  const backendServer = createServer();
  const backendWebSockets = new WebSocketServer({ server: backendServer });
  let backendRequestUrl = '';
  backendWebSockets.on('connection', (socket, request) => {
    backendRequestUrl = request.url || '';
    socket.on('message', message => socket.send(`backend:${message}`));
  });

  const frontendServer = createServer((_request, response) => response.end('ok'));

  try {
    await listen(backendServer);
    const backendPort = backendServer.address().port;
    attachAuthenticatedVoiceProxy(frontendServer, { clientToken: privateToken, backendPort });
    await listen(frontendServer);
    const frontendPort = frontendServer.address().port;
    const ticket = issueVoiceTicket();
    const browser = new WebSocket(`ws://127.0.0.1:${frontendPort}/voice?ticket=${encodeURIComponent(ticket)}`);
    await once(browser, 'open');
    browser.send('dictation-audio');
    const [message] = await once(browser, 'message');

    assert.equal(message.toString(), 'backend:dictation-audio');
    assert.equal(new URL(backendRequestUrl, 'ws://voice.invalid').searchParams.get('token'), privateToken);
    assert.doesNotMatch(browser.url, new RegExp(privateToken));
    browser.close();
    await once(browser, 'close');
  } finally {
    backendWebSockets.close();
    await close(frontendServer);
    await close(backendServer);
    if (originalToken === undefined) delete process.env.VOICE_CLIENT_TOKEN;
    else process.env.VOICE_CLIENT_TOKEN = originalToken;
  }
});