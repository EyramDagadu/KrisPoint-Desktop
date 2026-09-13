---
name: AI identifier screening scope
description: Prevents false identifier blocks while preserving explicit identifier protection.
---

Identifier screening must inspect report text, indication, and template clinical content that will be transmitted. Template metadata such as names, identities, voice commands, and creator information must not be treated as patient content.

**Why:** Ordinary title-case clinical phrases and template names can resemble person names under broad heuristics, blocking safe reports that contain no identifiers.

**How to apply:** Continue blocking explicit labels, contact details, and strong unlabeled-person-name matches. Require at least two non-clinical name tokens for an unlabeled-name match, and keep non-clinical template metadata out of hosted AI payloads.