---
name: Solo installer portability
description: Cross-platform constraints for Solo desktop installer builds
---

Solo installer builds must preserve runtime-local working directories, platform-native optional dependencies, vendored native crypto requirements, replacement-safe Python output, and explicit unbuffered sidecar logs. Unsigned Apple Silicon builds use ad-hoc signing; public releases still require Developer ID signing and notarization.

**Why:** Windows process launching, MSVC crypto dependencies, packaged Node resolution, redirected Python encodings, and macOS sidecar signing behave differently from the Replit development environment.

**How to apply:** Run the installer contracts and locked Cargo compile for packaging changes, and retain functional offline voice smoke tests independently of signing.