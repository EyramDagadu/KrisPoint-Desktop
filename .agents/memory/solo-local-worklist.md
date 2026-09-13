---
name: Solo local worklist
description: Distinguishes Solo's private reporting queue from Hospital's shared worklist collaboration.
---

Solo must expose the Worklist page and worklist APIs as a private local reporting queue. The `sharedWorklist` capability controls multi-user collaboration behavior; it must not remove or block Solo's local queue.

**Why:** Signing or finalizing a Solo report returns the clinician to Worklist, where the newly completed report must remain visible and loadable.

**How to apply:** Keep Worklist navigation and local CRUD available in Solo. Continue gating multi-user review, assignment, chat, and other collaboration-only behavior to Hospital.