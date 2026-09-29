---
name: Account email login
description: Why email sign-in does not assume all existing account email addresses are unique.
---

Treat account emails as optional, potentially duplicated legacy data. Preserve exact username sign-in first; compare email addresses without case sensitivity only when there is no matching username. If multiple accounts share an email, require username rather than selecting an arbitrary account.

**Why:** Existing accounts were created without an email uniqueness constraint or consistent normalization. Imposing a uniqueness migration without auditing historical duplicates could block upgrades, and picking the first email match could authenticate the wrong account.

**How to apply:** When extending sign-in, profile updates, account creation, or recovery, maintain explicit ambiguity handling. A future uniqueness migration should audit and resolve legacy duplicates before imposing a database constraint.