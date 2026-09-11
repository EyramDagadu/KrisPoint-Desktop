---
name: Edition licensing authority
description: Licensing invariant that applies when adding or changing KrisPoint editions
---

The existing license server, client license store, activation guard, signed-license verification, and feature entitlements remain the source of truth for every edition. Edition-specific setup, storage, or desktop lifecycle code must not replace or bypass them.

**Why:** Solo adds local SQLite, embedded runtimes, and single-owner behavior, but it is still a licensed KrisPoint product. Forking activation logic would create inconsistent entitlements and weaken signature and expiry enforcement.

**How to apply:** When modifying Hospital or Solo behavior, merge edition checks around the current licensing flow. Keep the License UI available, preserve the license-server proxy where used, and test that invalid activation remains rejected.