---
name: Release type-check boundary
description: Why the release gate intentionally scopes legacy JavaScript and strict inference.
---

The release check must remain a clean, dependable gate. Legacy JavaScript diagnostics and project-wide strict inference should only be enabled after the affected area has been migrated to a zero-error baseline.

**Why:** Enabling both across the existing application produced more than two thousand errors, which hid new defects and made the release command unusable. Syntax and Svelte structural checks remain active, while concrete errors exposed by the scoped check are fixed.

**How to apply:** Migrate typing in focused areas with a separate strict configuration, then strengthen the main release configuration only when the newly covered area passes cleanly.