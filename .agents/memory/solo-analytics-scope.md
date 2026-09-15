---
name: Solo analytics scope
description: Defines the analytics boundary between Solo and Hospital editions.
---

Solo must show only the owner’s personal analytics. Organization-wide summaries, user comparisons, and organization analytics exports remain Hospital-only.

**Why:** Solo is a private single-owner workstation, so organization-level analytics are irrelevant even though its owner account has administrative privileges.

**How to apply:** Gate organization analytics by edition as well as role. In Solo, do not load organization analytics data or show organization tabs and controls; preserve the existing personal analytics page and export.