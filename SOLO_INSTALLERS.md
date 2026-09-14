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

Run the workflow manually for testable unsigned artifacts. A `solo-v*` tag is a
release operation and fails closed unless both platform signing configurations
are present.

Before an unsigned beta can be used, the tester must accept the versioned
KrisPoint Solo Beta Participation Terms. The Windows MSI includes the terms in
its installer flow. Both Windows and macOS enforce the same agreement at first
launch, before account setup or access to the application. Acceptance confirms
that the build is unfinished and unsigned, is for testing only, must use
fictitious or properly de-identified data, may lose data, must not be
redistributed, and is not the final release.

## Signing

Unsigned manually dispatched workflow artifacts are suitable for controlled
testing and display the normal operating-system warning. Tagged artifacts are
never uploaded unless signing verification succeeds.

For distribution, configure these GitHub Actions encrypted secrets:

- `WINDOWS_SIGNING_CERTIFICATE_BASE64`: base64-encoded Authenticode PFX.
- `WINDOWS_SIGNING_CERTIFICATE_PASSWORD`: PFX import password.
- `APPLE_CERTIFICATE_BASE64`: base64-encoded Developer ID Application P12.
- `APPLE_CERTIFICATE_PASSWORD`: P12 import password.
- `APPLE_SIGNING_IDENTITY`: full Developer ID Application identity.
- `APPLE_API_KEY_BASE64`: base64-encoded App Store Connect API `.p8` key.
- `APPLE_API_KEY_ID`: App Store Connect API key ID.
- `APPLE_API_ISSUER`: App Store Connect API issuer ID.
- `KRISPOINT_LICENSE_PUBLIC_KEY`: the deployed authority's Ed25519 public key,
  obtained from `https://license.krispoint.com.gh/api/license/public-key`.

The Windows certificate is imported into the ephemeral runner user store,
selected by thumbprint, SHA-256 signed, and timestamped. The macOS certificate
is imported into a temporary keychain; the DMG is notarized, stapled, and
assessed by Gatekeeper. Temporary certificate files and the macOS keychain are
removed after the build.

Signing credentials belong in the release system's encrypted secret store.
Never commit them or add them to installer resources.

## License validation policy

Solo uses a random device secret stored in Windows Credential Manager or macOS
Keychain. The public machine identifier is an app-scoped SHA-256 derivative of
that secret, so deleting browser storage does not create a new machine identity.
The credential intentionally survives application reinstall.

Signed license payloads include the machine identifier and a 72-hour validation
lease. The client validates with the license authority every six hours while it
is running. A network outage can use the remaining signed lease, but licensed
features fail closed when the lease expires. Revoked, expired, mismatched, or
invalidly signed licenses fail immediately. A backwards clock movement also
requires online validation.

Tagged builds pin the authority public key at build time. Browser storage cannot
replace that trust anchor. If the licensing key pair is deliberately rotated,
the release secret and application build must be updated together.

Existing Solo licenses using the previous browser-derived identifier are
automatically migrated once to the protected native identifier. Later device
changes require explicit deactivation before activation on another machine.
Hospital retains its browser-compatible identifier and uses the same signing
authority.

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