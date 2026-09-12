---
name: MedASR endpoint detection
description: Durable VAD and lifecycle rules for MedASR dictation
---

MedASR uses shared pause-based endpoint detection with room-noise calibration, onset pre-roll, a bounded audio queue, and explicit Stop flushing. Do not restore fixed-duration transcription windows.

**Why:** Fixed windows reduce phrase context, while naive thresholds clip quiet speech or transcribe room noise. Unbounded queues and synchronous Stop handling can block Hospital users.

**How to apply:** Preserve audio after speech onset, trim only after a confirmed endpoint, reset calibration for new recordings, reject restart during Stop finalization, and keep both editions compatible.