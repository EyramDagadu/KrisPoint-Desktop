---
name: Solo license trust policy
description: Security boundaries for device activation, offline access, and public release trust
---

Public Solo releases must pin the license authority public key, bind signed
licenses to the native credential-store device identity, and allow offline use
only through a finite server-issued lease. A device change requires explicit
deactivation, except for the one-way migration from the legacy browser identity.

**Why:** A replaceable browser-stored public key permits forged offline licenses,
and indefinite offline operation prevents revocation from taking effect. A
protected installation identity survives browser-data deletion and reinstall
without collecting a raw hardware serial number.

**How to apply:** Keep manual unsigned builds suitable only for controlled
testing. For public releases, update the pinned key in lockstep with any
deliberate authority-key rotation, preserve periodic validation and the bounded
offline lease, and require an audited device-transfer path rather than silently
rebinding active licenses.