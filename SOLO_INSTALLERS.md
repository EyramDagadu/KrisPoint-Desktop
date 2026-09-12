# KrisPoint Solo installers

KrisPoint Solo is distributed as a self-contained desktop application:

- Windows 10/11 x64: MSI and NSIS setup executable
- Apple Silicon macOS 12 or later: DMG containing the application
- Embedded Node runtime for the authenticated loopback application backend
- Embedded SQLite database; PostgreSQL is not used by Solo
- Optional native MedASR runtime and model

End users do not install or run Node.js, Python, PostgreSQL, terminal scripts,
or background services.

## Build variants

### Core Solo

```sh
pnpm install --frozen-lockfile
pnpm run test:solo:installer
pnpm run build:solo:installer
```

The core installer runs all Solo features except local voice dictation.
Attempting to enable dictation explains that the Solo + MedASR package is
required.

### Solo + MedASR

The MedASR model is gated. The build account must accept Google's model terms
and provide a read-only `HF_TOKEN` through the build environment. The token is
used only to download model files and is not written into the installer.

```sh
INCLUDE_MEDASR=1 pnpm run build:solo:installer
```

On PowerShell:

```powershell
$env:INCLUDE_MEDASR = "1"
pnpm run build:solo:installer
```

The build packages the Python application, dependencies, and model as a native
`krispoint-voice` executable. Installed machines do not require Python or
network access for model startup.

## Automated release builds

`.github/workflows/solo-installers.yml` runs on Windows x64 and Apple Silicon
macOS. It:

1. builds the voice-enabled native runtime and Solo installer;
2. runs installer contract tests;
3. performs clean install, launch, rerun/repair, replacement upgrade, and
   uninstall smoke tests using the native installer format;
4. blocks outbound network access and sends recorded audio through the
   installed MedASR executable, checking client authentication, HMAC health,
   a non-empty transcription, and clean shutdown;
5. uploads MSI/NSIS and DMG artifacts.

Run the workflow manually for testable unsigned artifacts, or push a
`solo-v*` tag.

## Signing

Unsigned workflow artifacts are suitable for controlled testing and display
the normal operating-system warning.

For distribution, configure the standard Tauri signing environment in the
release runner:

- Windows: code-signing certificate and password, with DigiCert timestamping.
- macOS: Developer ID Application identity, hardened runtime, Apple API key or
  app-specific password for notarization, and stapling.

Signing credentials belong in the release system's encrypted secret store.
Never commit them or add them to installer resources.

## Runtime and upgrade behavior

Tauri starts the embedded backend before showing the window, authenticates its
readiness on a random loopback port, and stops it when the window closes.
MedASR uses a separate random loopback port and an HMAC challenge before it is
reported ready. Its URL is passed to the webview only after verification.

Application data and OS credential-store keys live outside the installation
directory. Installer repair and upgrades replace application files without
replacing the Solo SQLite database or encryption keys. Uninstall removes the
application; clinical data is intentionally retained so an accidental
uninstall is not destructive.

## Local platform verification

After building on the target OS:

```powershell
./scripts/verify-solo-installer.ps1
```

```sh
./scripts/verify-solo-installer-macos.sh
```

These tests install and remove applications on the current machine. Run them
only on disposable release runners or clean test machines.