---
name: Hospital Windows releases
description: Durable operating model for local Windows Hospital server deployments
---

Hospital Windows servers use immutable, full-commit Git release directories with a small atomic current-release pointer. Production configuration, TLS material, and credentials stay outside Git with administrator-only access. Updates build before downtime, back up PostgreSQL before schema changes, switch only after migration, and restore the prior application release when health verification fails.

**Why:** In-place Git updates can leave a hospital unavailable after a partial build or failed migration, and secrets copied into release directories are difficult to protect and rotate.

**How to apply:** Keep the service runner stable, run the Hospital HTTPS/voice wrapper from the selected release, require a healthy database/schema/encryption/licensing response after start, and treat database restoration as a separate reviewed operation from application rollback.