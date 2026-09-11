// HTTPS Server Wrapper for KrisPoint Medical
// This enables secure connections for voice dictation on remote computers

import { handler } from './build/handler.js';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const SSL_DIR = './ssl';

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
const certPath = path.join(SSL_DIR, 'cert.pem');
const keyPath = path.join(SSL_DIR, 'key.pem');

const hasSSL = fs.existsSync(certPath) && fs.existsSync(keyPath);

if (hasSSL) {
    // HTTPS mode
    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };

    const httpsServer = https.createServer(options, handler);
    
    httpsServer.listen(PORT, HOST, () => {
        console.log(`\n🔒 KrisPoint running with HTTPS`);
        console.log(`   Local:   https://localhost:${PORT}`);
        console.log(`   Network: https://${HOST === '0.0.0.0' ? getLocalIP() : HOST}:${PORT}`);
        console.log(`\n✅ Voice dictation will work on all computers!`);
        console.log(`   (Accept the certificate warning on first visit)\n`);
    });

    // Also start HTTP redirect server on port 80 if available
    try {
        const httpRedirect = http.createServer((req, res) => {
            const host = req.headers.host?.split(':')[0] || 'localhost';
            res.writeHead(301, { Location: `https://${host}:${PORT}${req.url}` });
            res.end();
        });
        httpRedirect.listen(80, HOST);
        console.log(`   HTTP→HTTPS redirect active on port 80`);
    } catch (e) {
        // Port 80 might require admin rights, ignore
    }

} else {
    // HTTP fallback mode
    const httpServer = http.createServer(handler);
    
    httpServer.listen(PORT, HOST, () => {
        console.log(`\n⚠️  KrisPoint running with HTTP (no SSL certificates found)`);
        console.log(`   Local:   http://localhost:${PORT}`);
        console.log(`   Network: http://${HOST === '0.0.0.0' ? getLocalIP() : HOST}:${PORT}`);
        console.log(`\n⚠️  Voice dictation may not work on remote computers.`);
        console.log(`   Run generate-ssl-cert.bat to enable HTTPS.\n`);
    });
}

