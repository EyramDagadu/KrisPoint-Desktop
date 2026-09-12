---
name: MedASR endpoint detection
description: Durable VAD and lifecycle rules for MedASR dictation in Solo and Hospital
---

MedASR dictation must use shared pause-based endpoint detection with calibrated room-noise handling, onset pre-roll, a bounded audio queue, and explicit Stop flushing. Do not restore fixed-duration transcription windows.

**Why:** Fixed windows create unnatural punctuation and reduce phrase context. Naive energy thresholds can transcribe steady room noise or clip quiet speech, while unbounded queues and synchronous Stop handling can exhaust memory or block other Hospital users.

**How to apply:** Preserve all audio after speech onset, trim silence only after a confirmed endpoint, retain calibration across utterances, reset it for a new recording, reject restart while Stop finalizes, and keep the shared engine compatible with both packaged Solo and server-hosted Hospital.