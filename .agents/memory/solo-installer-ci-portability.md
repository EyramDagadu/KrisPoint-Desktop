---
name: Solo installer CI portability
description: Cross-platform constraints for building the Solo desktop installer on GitHub-hosted Windows and Apple Silicon macOS runners.
---

Cross-platform Solo installer builds must keep npm’s target-native optional packages in the lockfiles, launch Windows command shims through a shell, vendor native crypto dependencies, and avoid deep-signing checks of native sidecars stored as app resources. Apple Silicon builds without an Apple Developer certificate should use explicit ad-hoc signing; a public release still needs a Developer ID certificate and notarization.

**Why:** GitHub-hosted runners do not share Replit’s package registry, Windows does not execute `.cmd` shims directly through Node’s default spawn behavior, and OpenSSL is not installed for Rust’s MSVC target. macOS code-signing treats a PyInstaller sidecar resource tree differently from a nested app bundle.

**How to apply:** When changing Solo packaging or release CI, validate both platform target dependency graphs, run the installer contract suite and a locked Cargo compile, then trigger a newly versioned installer tag. Keep functional installer smoke tests—including the offline voice test—in place independently of any future Developer ID signing and notarization step.