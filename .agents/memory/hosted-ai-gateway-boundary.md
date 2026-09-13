---
name: Hosted AI gateway boundary
description: Durable security and deployment rules for KrisPoint hosted report AI
---

The hosted AI gateway must remain independently publishable from the licence authority. Packaged Solo uses the stable `https://ai.krispoint.com.gh` address through its authenticated local backend; provider names, models, and credentials remain server-side.

**Why:** Embedding provider credentials in Solo would expose them, while coupling the gateway deployment to licensing could interrupt licence operations or allow clinical report content to cross the licensing boundary.

**How to apply:** Authorize gateway requests with signed licence metadata and metadata-only revocation checks. Never send reports, templates, prompts, audio, or model output to licensing. Enforce identifier policy and clinical safety at the gateway, and keep provider adapters replaceable without changing Solo.

AI drafting is review-first: the selected template may guide structure, expand shorthand, populate complete normal reports, and draft impressions. Clinical-difference checks are advisory rather than proposal-blocking.

**Why:** AI Polish must provide useful radiology drafting rather than literal copy-editing; the reporting clinician reviews, edits, accepts, or rejects every proposal before it changes the report.

**How to apply:** Preserve explicit abnormalities, measurements, laterality, negation, and qualifications in the prompt, but surface detected differences as review warnings. Keep identifiers, signed licensing, request bounds, and explicit clinician acceptance enforced.