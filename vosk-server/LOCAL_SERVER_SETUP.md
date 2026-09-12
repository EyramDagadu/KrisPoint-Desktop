# Local MedASR Voice Server Setup

This guide configures one Windows computer to run KrisPoint's local medical
dictation service. MedASR is the default engine. Faster-Whisper remains
available for comparison or fallback.

## Requirements

- 64-bit Python 3.11
- A modern 4-core CPU and 8 GB RAM minimum
- Approximately 2 GB of free disk space for packages, model files, and cache
- Internet access during initial installation and the first model download
- A Hugging Face account for the administrator performing the first download
- No separate Git installation is required

Regular KrisPoint users do not need Hugging Face accounts.

## First-time setup

1. Install 64-bit Python 3.11 from <https://www.python.org/downloads/>.
   Select **Add Python to PATH** during installation.
2. Sign in to Hugging Face and accept the terms at
   <https://huggingface.co/google/medasr>.
3. Create a read-only Hugging Face access token.
4. From the KrisPoint folder, double-click `setup-voice-server.bat`.
   The installer creates `vosk-server\.venv` and installs the locked
   dependencies without changing the computer's global Python packages.
5. Open `vosk-server\.env` and set:

   ```env
   ASR_ENGINE=medasr
   HF_TOKEN=hf_replace_with_your_read_only_token
   VOICE_HOST=127.0.0.1
   VOICE_PORT=8000
   # Optional MedASR endpointing (safe defaults shown):
   MEDASR_VAD_SILENCE_SECONDS=1.5
   MEDASR_VAD_MAX_UTTERANCE_SECONDS=30
   ```

   The `.env` file is excluded from Git. Do not share or commit it.
6. Double-click `vosk-server\START_VOICE_SERVER.bat`.

The first start downloads approximately 421 MB of MedASR files. Later starts
load the cached model and normally do not require internet access.

On the first start, wait until the window says both `MedASR loaded` and
`Ready to accept connections from KrisPoint`. Do not close the window while the
model is downloading.

### Clean-computer acceptance test

Before hospital rollout, perform these checks while signed in as a normal
Windows user:

1. Confirm `vosk-server\.venv\Scripts\python.exe` exists after setup.
2. Start the voice server and wait for `Ready to accept connections from
   KrisPoint`.
3. Start KrisPoint, dictate a short test phrase, and confirm text appears.
4. Close both applications.
5. Disconnect the computer from the internet and start the voice server again.
   Reaching `Ready to accept connections from KrisPoint` confirms MedASR loaded
   from its local cache.
6. Reconnect the computer to the internet before returning it to service.

Record the Windows edition, whether setup was run by an administrator, and any
antivirus or firewall prompt. Same-computer use on `127.0.0.1` should not need
an inbound Windows Firewall rule.

## Daily use

1. Start the voice server with `vosk-server\START_VOICE_SERVER.bat`.
2. Keep its window open.
3. Start KrisPoint and use dictation normally.

When both services run on the same computer, KrisPoint connects to
`ws://localhost:8000` automatically.

## One server for several users

Only the computer hosting MedASR needs the model, Python environment, and
Hugging Face access.

To allow trusted computers on the same private network to connect:

1. Set `VOICE_HOST=0.0.0.0` in `vosk-server\.env`.
2. Allow inbound TCP port 8000 in Windows Firewall for the private network only.
3. Users should open KrisPoint through the voice server computer's hostname or
   IP address so the application selects the same host for voice connections.

Do not expose an unencrypted `ws://` voice server directly to the public
internet. Remote or HTTPS deployments require TLS (`wss://`), access controls,
and appropriate network security.

## Faster-Whisper fallback

To use the previous backend, edit `vosk-server\.env`:

```env
ASR_ENGINE=faster-whisper
WHISPER_MODEL_PATH=medium
```

Faster-Whisper downloads its selected model on first use. It does not require
accepting the gated MedASR terms.

## Troubleshooting

### Python 3.11 not found

Reinstall 64-bit Python 3.11 and select **Add Python to PATH**, then reopen the
terminal or installer.

### MedASR reports a gated repository or 401 error

Confirm that the administrator accepted the MedASR terms while signed into the
same Hugging Face account that issued the read-only token in `.env`.

### Windows says Git is not recognized

Download a fresh copy of the KrisPoint setup files and run
`setup-voice-server.bat` again. The current installer downloads its locked
Transformers source directly and does not require Git.

### KrisPoint cannot connect

- Confirm the voice-server window is still running.
- Confirm port 8000 is not used by another application.
- For same-computer use, keep `VOICE_HOST=127.0.0.1`.
- For LAN use, set `VOICE_HOST=0.0.0.0` and check the private-network firewall
  rule.

### Reinstall the voice environment

Close the voice server, delete only the `vosk-server\.venv` directory, and run
`setup-voice-server.bat` again. The downloaded model cache is stored separately
and does not normally need to be downloaded again.