// HTTPS Server Wrapper for KrisPoint Medical
// This enables secure connections for voice dictation on remote computers

import { handler } from './artifacts/krispoint/build/handler.js';
import { run as runHospitalDatabaseMigration } from './scripts/migrate-active-template-identity.mjs';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { attachAuthenticatedVoiceProxy } from './scripts/voice-websocket-proxy.mjs';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const certPath = process.env.SSL_CERT_PATH || path.join(process.cwd(), 'ssl', 'cert.pem');
const keyPath = process.env.SSL_KEY_PATH || path.join(process.cwd(), 'ssl', 'key.pem');
const voiceClientToken = process.env.VOICE_CLIENT_TOKEN;

if (process.env.VITE_KRISPOINT_EDITION !== 'solo' && !voiceClientToken) {
    throw new Error('VOICE_CLIENT_TOKEN is required for the Hospital /voice production proxy');
}

// server-https.js is the root Hospital production wrapper. Run the small,
// retry-safe PostgreSQL rollout before opening the listener. Solo packaging
// has its own SQLite initialization and never enters this path.
if (process.env.VITE_KRISPOINT_EDITION !== 'solo') {
    await runHospitalDatabaseMigration();
}

// Get local IP address
function getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'YOUR_IP';
}

// Check if SSL certificates exist
const hasSSL = fs.existsSync(certPath) && fs.existsSync(keyPath);

if (process.env.REQUIRE_HTTPS === 'true' && !hasSSL) {
    throw new Error(`REQUIRE_HTTPS=true but SSL certificate files were not found at ${certPath} and ${keyPath}`);
}

if (hasSSL) {
    // HTTPS mode
    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };

    const httpsServer = https.createServer(options, handler);
    attachAuthenticatedVoiceProxy(httpsServer, {
        clientToken: voiceClientToken,
        backendHost: process.env.VOICE_HOST,
        backendPort: process.env.VOICE_PORT
    });
    
    httpsServer.listen(PORT, HOST, () => {
        console.log(`\n🔒 KrisPoint running with HTTPS`);
        console.log(`   Local:   https://localhost:${PORT}`);
        console.log(`   Network: https://${HOST === '0.0.0.0' ? getLocalIP() : HOST}:${PORT}`);
        console.log(`\n✅ Voice dictation will work on all computers!`);
        console.log(`   (Accept the certificate warning on first visit)\n`);
    });

    // The redirect is opt-in because port 80 is commonly owned by IIS or
    // another reverse proxy on Windows servers. A redirect failure must never
    // terminate the primary HTTPS/voice service.
    if (process.env.ENABLE_HTTP_REDIRECT === 'true') {
        const httpRedirect = http.createServer((req, res) => {
            const host = req.headers.host?.split(':')[0] || 'localhost';
            res.writeHead(301, { Location: `https://${host}:${PORT}${req.url}` });
            res.end();
        });
        httpRedirect.on('error', (error) => {
            console.warn(`HTTP→HTTPS redirect unavailable on port 80: ${error.message}`);
        });
        httpRedirect.listen(80, HOST);
        console.log(`   HTTP→HTTPS redirect active on port 80`);
    }

} else {
    // HTTP fallback mode
    const httpServer = http.createServer(handler);
    attachAuthenticatedVoiceProxy(httpServer, {
        clientToken: voiceClientToken,
        backendHost: process.env.VOICE_HOST,
        backendPort: process.env.VOICE_PORT
    });
    
    httpServer.listen(PORT, HOST, () => {
        console.log(`\n⚠️  KrisPoint running with HTTP (no SSL certificates found)`);
        console.log(`   Local:   http://localhost:${PORT}`);
        console.log(`   Network: http://${HOST === '0.0.0.0' ? getLocalIP() : HOST}:${PORT}`);
        console.log(`\n⚠️  Voice dictation may not work on remote computers.`);
        console.log(`   Run generate-ssl-cert.bat to enable HTTPS.\n`);
    });
}

