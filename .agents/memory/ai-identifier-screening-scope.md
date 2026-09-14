---
name: AI identifier screening scope
description: Prevents false identifier blocks while preserving explicit identifier protection.
---

Identifier screening must inspect report text, indication, and template clinical content that will be transmitted. Template metadata such as names, identities, voice commands, and creator information must not be treated as patient content.

**Why:** Ordinary title-case clinical phrases and template names can resemble person names under broad heuristics, blocking safe reports that contain no identifiers.

**How to apply:** Hard-block explicit labels, contact details, and identifier numbers. Treat uncertain unlabeled-name matches as a request-specific clinician review that may continue after confirmation; never let confirmation bypass explicit matches. Keep non-clinical template metadata out of hosted AI payloads.