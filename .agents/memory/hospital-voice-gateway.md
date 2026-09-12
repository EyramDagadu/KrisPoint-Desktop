---
name: Hospital voice gateway
description: Security and transport rules for browser-based Hospital MedASR access
---

Hospital browser clients connect through an authenticated, same-origin WebSocket gateway. MedASR remains bound to loopback, and its internal client token must never reach browser code.

**Why:** Browser microphone use requires a secure origin, and exposing the MedASR token would let unauthenticated clients bypass Hospital sessions.

**How to apply:** Issue short-lived tickets only to valid Hospital sessions, validate them at the gateway, inject the private token server-side, and preserve Solo's separate Tauri-managed flow.