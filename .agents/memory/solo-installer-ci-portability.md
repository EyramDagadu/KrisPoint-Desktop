---
name: Solo installer CI portability
description: Cross-platform constraints for building the Solo desktop installer on GitHub-hosted Windows and Apple Silicon macOS runners.
---

Cross-platform Solo installer builds must keep npm’s target-native optional packages in the lockfiles, launch packaged runtimes from their own directories, launch Windows command shims through a shell, vendor native crypto dependencies, and avoid deep-signing checks of native sidecars stored as app resources. Packaged Python output must tolerate Windows console encodings, and installer smoke tests must own an explicit unbuffered sidecar-log path. Apple Silicon builds without an Apple Developer certificate should use explicit ad-hoc signing; a public release still needs a Developer ID certificate and notarization.

**Why:** GitHub-hosted runners do not share Replit’s package registry, Windows does not execute `.cmd` shims directly through Node’s default spawn behavior, and OpenSSL is not installed for Rust’s MSVC target. Packaged Node resolves entry points relative to its working directory, while redirected Python output can use CP1252 and crash on Unicode status symbols after a successful model load. macOS code-signing treats a PyInstaller sidecar resource tree differently from a nested app bundle.

**How to apply:** When changing Solo packaging or release CI, preserve runtime-local working directories, UTF-8 or replacement-safe Python output, and direct sidecar-log capture. Validate both platform target dependency graphs, run the installer contract suite and a locked Cargo compile, then trigger a newly versioned installer tag. Keep functional installer smoke tests—including the offline voice test—in place independently of any future Developer ID signing and notarization step.