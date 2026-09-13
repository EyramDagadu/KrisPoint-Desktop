---
name: Hosted AI gateway boundary
description: Durable security and deployment rules for KrisPoint hosted report AI
---

The hosted AI gateway must remain independently publishable from the licence authority. Packaged Solo uses the stable `https://ai.krispoint.com.gh` address through its authenticated local backend; provider names, models, and credentials remain server-side.

**Why:** Embedding provider credentials in Solo would expose them, while coupling the gateway deployment to licensing could interrupt licence operations or allow clinical report content to cross the licensing boundary.

**How to apply:** Authorize gateway requests with signed licence metadata and metadata-only revocation checks. Never send reports, templates, prompts, audio, or model output to licensing. Enforce identifier policy and clinical safety at the gateway, and keep provider adapters replaceable without changing Solo.

Explicit normal-study shorthand authorizes expansion from the selected normal template. Detailed reports remain fact-preserving, but phrases such as “normal abdominal ultrasound” may populate the template’s complete normal technique, findings, and impression for clinician review.

**Why:** AI Polish must support practical radiology shorthand rather than reducing every request to literal copy-editing, while keeping template expansion intentional and reviewable.

**How to apply:** Enable expansion only for short, unqualified normal-study statements that match the selected template’s modality and body region. Do not apply it to reports containing measurements, abnormalities, exceptions, or mixed findings.