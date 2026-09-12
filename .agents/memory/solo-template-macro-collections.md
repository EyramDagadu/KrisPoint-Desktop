---
name: Solo template and macro collections
description: Edition-specific collection behavior for templates, macros, and AI drafting.
---

Solo must present templates and macros as unified owner collections. Do not expose system-versus-personal tabs, scope selectors, or creation labels in Solo. AI drafting must offer the unified template collection rather than hiding templates by Hospital scope or report metadata.

**Why:** Solo has one private workspace owner, so Hospital-style shared and personal pools add confusion and caused valid owner-created templates to disappear from AI Polish.

**How to apply:** Keep Hospital authorization and system/personal behavior intact. Any template or macro management, quick-insert, voice, or AI selector added to Solo should load the current owner's unified accessible collection.