---
name: Hospital voice gateway
description: Security and transport rules for browser-based Hospital MedASR access
---

Hospital browser clients must connect through an authenticated, same-origin WebSocket gateway. The MedASR process stays bound to loopback and its internal client token must never reach browser code.

**Why:** Browser microphone use requires a secure origin, direct LAN or Preview connections create WS/WSS compatibility problems, and exposing the internal MedASR token would let unauthenticated clients bypass Hospital sessions.

**How to apply:** Require a valid Hospital session before issuing a short-lived signed voice ticket. Validate the ticket at the gateway, inject the internal token server-side, and proxy to a loopback-only MedASR socket. Preserve Solo's separate Tauri-managed token flow.