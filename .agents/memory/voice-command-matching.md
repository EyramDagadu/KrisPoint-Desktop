---
name: Voice command matching
description: Safety rule for punctuation-tolerant spoken macro and template invocation.
---

Treat punctuation and spacing variants as equivalent when resolving spoken commands and saved voice-command keys, including x-ray/x ray/xray. Prefer exact normalized command matches over partial matches, and refuse ambiguous matches rather than choosing a clinical macro or template arbitrarily.

**Why:** ASR punctuation can vary between transcriptions, while the literal dictated report text and deliberate punctuation-insertion commands must retain their original meaning. Broad fuzzy or first-match behavior risks inserting the wrong clinical content.

**How to apply:** Keep normalization confined to command detection and lookup; do not rewrite the inserted report content or the stored display text. Apply the same key rule to both editions and duplicate checks.