---
name: License authority deployment
description: Independent deployment constraint for the KrisPoint license service
---

Keep the license authority independently publishable at `license.krispoint.com.gh`, with migrations completing before it begins listening.

**Why:** Licensing must remain available independently of Hospital, Solo, MedASR, and the hosted AI gateway.

**How to apply:** Preserve a standalone service entrypoint and database lifecycle. Treat the custom domain as production routing, while local workspace proxies remain development-only.