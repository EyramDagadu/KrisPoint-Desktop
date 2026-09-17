---
name: Frozen MedASR multiprocessing
description: Preventing macOS PyInstaller workers from re-entering the MedASR server and loading duplicate models.
---

Packaged macOS MedASR must intercept frozen multiprocessing worker startup before entering the voice server main routine. A healthy sidecar may briefly have a native helper process, but only one server process may load the model or bind the voice port.

**Why:** A packaged soak showed dozens of frozen workers re-entering the server, each loading MedASR and retrying the same port. The process tree grew by several gigabytes within minutes even though one-process inference buffers were bounded.

**How to apply:** Preserve the frozen-worker entry guard in every packaged voice entry point. Installer memory checks should count processes and sum their RSS, allowing bounded native helpers while rejecting repeated model-server copies.