---
name: Appearance persistence
description: Defines the persistence scope for light and dark appearance choices.
---

Treat the selected appearance theme as a device-level preference rather than only a signed-in user setting.

**Why:** The sign-in screen also supports appearance controls, and Solo users expect their selection to survive logout, login, and desktop application relaunches.

**How to apply:** Any future appearance option should have a device-level persistence path. User settings may mirror it for compatibility, but must not overwrite the active device preference with a stale default.