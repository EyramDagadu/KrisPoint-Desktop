---
name: Solo installer portability
description: Cross-platform constraints for Solo desktop installer builds
---

Solo installer builds must preserve runtime-local working directories, platform-native optional dependencies, vendored native crypto requirements, replacement-safe Python output, and explicit unbuffered sidecar logs. Offline voice verification must stream short, browser-like PCM packets; oversized packets distort MedASR startup calibration and can suppress utterance detection. Unsigned Apple Silicon builds use ad-hoc signing; public releases still require Developer ID signing and notarization.

**Why:** Windows process launching, MSVC crypto dependencies, packaged Node resolution, redirected Python encodings, macOS sidecar signing, and packet-sensitive voice calibration behave differently from simplified development checks.

**How to apply:** Run the installer contracts and locked Cargo compile for packaging changes, and retain functional offline voice smoke tests independently of signing.