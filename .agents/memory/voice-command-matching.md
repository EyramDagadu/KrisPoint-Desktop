---
name: Voice command matching
description: Safety rule for punctuation-tolerant spoken macro and template invocation.
---

Treat punctuation and spacing variants as equivalent when resolving spoken commands and saved voice-command keys, including x-ray/x ray/xray. Prefer exact normalized command matches over partial matches, and refuse ambiguous matches rather than choosing a clinical macro or template arbitrarily.

**Why:** ASR punctuation can vary between transcriptions, while the literal dictated report text and deliberate punctuation-insertion commands must retain their original meaning. Broad fuzzy or first-match behavior risks inserting the wrong clinical content.

**How to apply:** Keep normalization confined to command detection and lookup; do not rewrite the inserted report content or the stored display text. Apply the same key rule to both editions and duplicate checks.

Clinical words containing command prefixes, such as macrocalcifications, macroadenoma, and macrophages, must remain ordinary dictation.

**Why:** The user specifically raised the risk that a natural medical word could be mistaken for a failed macro command and disappear from the transcript.

**How to apply:** Require a separate command word rather than a substring inside a medical word. Distinguish this from an ASR transcript that actually splits the word into “macro calcifications,” which can resemble an explicit command.

Preserve unresolved spoken macro/template invocations as dictation while still warning the user. Do not run command-alias rewriting over that literal fallback.

**Why:** The user chose to preserve unmatched speech so an ASR-split medical term cannot disappear following a failed command lookup.

**How to apply:** Await the lookup outcome before consuming speech, keep the original utterance on failure, and do not insert a command phrase after a successful clinical insert. This fallback applies to speech, not clicked command buttons.