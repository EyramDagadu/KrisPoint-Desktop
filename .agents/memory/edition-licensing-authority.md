---
name: Edition licensing authority
description: Licensing invariant that applies when adding or changing KrisPoint editions
---

The existing license authority, client license store, activation guard, signed-license verification, and feature entitlements remain the source of truth for every edition. Edition-specific setup, storage, or desktop lifecycle code must not replace or bypass them.

**Why:** Solo changes storage and lifecycle behavior but remains a licensed KrisPoint product. Forking activation logic would create inconsistent entitlements and weaken signature and expiry enforcement.

**How to apply:** Merge edition checks around the shared licensing flow, preserve invalid-activation rejection, and keep license verification fail-closed.