---
name: Solo clinical designation
description: Separates Solo authorization roles from the clinician-facing designation used on reports.
---

The Solo account may retain the internal System Owner role for permissions, but that role name must not appear in Solo-facing UI or be presented as the clinician’s professional designation. The clinical designation is an editable profile field.

**Why:** Authorization roles describe application access, while designations such as Consultant Radiologist describe the clinician and belong on reports and PDF signatures.

**How to apply:** Use the saved user designation beneath the clinician’s name and in report authorship and signature displays, falling back to a neutral clinical label rather than an authorization role. Keep the field editable in Solo’s Admin Profile. Hospital continues to show its role labels.