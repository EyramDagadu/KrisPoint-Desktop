---
name: Mixed Vite plugin types
description: Why preview plugin declarations can resolve a different Vite version from their consuming app.
---

Keep preview-plugin type resolution aligned with the consuming artifact's Vite, rather than the workspace's hoisted copy. The Replit preview plugins can reference Vite in their declarations without declaring a Vite peer dependency.

**Why:** This workspace intentionally runs the Svelte application on Vite 6 and the React mockup sandbox on Vite 7. Plugin declarations fell back to the workspace Vite 6 types, causing incompatible hook signatures despite a working Vite 7 preview.

**How to apply:** Prefer scoped type resolution for the affected artifact. Do not force a workspace-wide Vite major upgrade or suppress plugin type errors merely to align the preview tooling.