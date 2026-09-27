---
name: Browser auth request interception
description: Why browser network mocks can fail to intercept first-run auth checks
---

When mocking first-run API requests in Playwright, create the browser context with service workers blocked.

**Why:** The app's service worker handles GET requests to the API. Page-level request events still appear, but page-level route mocks can silently miss these requests. An owner-check failure test initially displayed the normal registration form until service workers were blocked.

**How to apply:** Block service workers for browser tests that deliberately intercept or fail an auth GET request. Leave them enabled when testing real offline behavior.