---
name: Playwright browser binary
description: How to run browser regression suites in this workspace when Playwright's managed browser cache is empty.
---

Set `PLAYWRIGHT_CHROMIUM_PATH=/repl/tools/bin/chromium` for Playwright runs that already support the environment override.

**Why:** The default managed-browser path was empty here, even though a working Chromium executable was installed by the environment. Downloading another browser is unnecessary.

**How to apply:** If a browser suite fails before opening a page with a missing browser executable, use the installed binary via the suite's launch option. Verify the executable still exists before recommending it in a later session.