import { WebSocket, WebSocketServer } from 'ws';
import { verifyVoiceTicket } from '../artifacts/krispoint/src/lib/server/voiceTicket.js';

function rejectUpgrade(socket, status, message) {
  if (!socket.destroyed) {
    socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
    socket.destroy();
  }
}

function bridgeWebSockets(client, backend) {
  client.on('message', (data, isBinary) => {
    if (backend.readyState === WebSocket.OPEN) backend.send(data, { binary: isBinary });
  });
  backend.on('message', (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) client.send(data, { binary: isBinary });
  });
  client.on('close', (code, reason) => {
    if (backend.readyState === WebSocket.OPEN) backend.close();
    else backend.terminate();
  });
  backend.on('close', (code, reason) => {
    if (client.readyState === WebSocket.OPEN) client.close();
    else client.terminate();
  });
  client.on('error', () => backend.terminate());
  backend.on('error', () => client.terminate());
}

export function attachAuthenticatedVoiceProxy(server, {
  clientToken,
  backendHost = '127.0.0.1',
  backendPort = 8000,
  verifyTicket = verifyVoiceTicket
} = {}) {
  if (!clientToken) throw new Error('A private voice client token is required');
  const upgradeServer = new WebSocketServer({ noServer: true });

  const onUpgrade = (request, socket, head) => {
    const requestUrl = new URL(request.url || '/', 'http://voice.invalid');
    if (requestUrl.pathname !== '/voice') {
      rejectUpgrade(socket, 404, 'Not Found');
      return;
    }

    const ticket = requestUrl.searchParams.get('ticket');
    if (!ticket || !verifyTicket(ticket)) {
      rejectUpgrade(socket, 401, 'Unauthorized');
      return;
    }

    const backendUrl =
      `ws://${backendHost}:${backendPort}/?token=${encodeURIComponent(clientToken)}`;
    const backend = new WebSocket(backendUrl);
    const onBackendError = () => rejectUpgrade(socket, 502, 'Bad Gateway');
    backend.once('error', onBackendError);
    backend.once('open', () => {
      backend.off('error', onBackendError);
      upgradeServer.handleUpgrade(request, socket, head, client => {
        bridgeWebSockets(client, backend);
        upgradeServer.emit('connection', client, request);
      });
    });
  };

  server.on('upgrade', onUpgrade);
  return () => {
    server.off('upgrade', onUpgrade);
    upgradeServer.close();
  };
}