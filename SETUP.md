# KrisPoint Medical - Local Setup

KrisPoint includes guided first-time installers for Windows and macOS. They
create the local database, generate encryption credentials, initialize tables,
and can optionally install local MedASR voice recognition.

## Prerequisites

- Node.js 20 or later
- PostgreSQL 15 or later, including `psql` and `createdb`
- 64-bit Python 3.11 only when the computer will host voice recognition
- An internet connection during installation

## Windows guided setup

1. Install Node.js 20 or later from <https://nodejs.org/>.
2. Install PostgreSQL 15 or later from
   <https://www.postgresql.org/download/windows/>. Include the command-line
   tools.
3. Double-click `setup-local-windows.bat`.
4. Enter the PostgreSQL administrator username and password when requested.
   The password is used only during database creation and is not saved.
5. Choose whether this computer should host MedASR voice recognition.

## macOS guided setup

Homebrew users can install and start the prerequisites with:

```bash
brew install node@20 postgresql@15
brew services start postgresql@15
```

Then double-click `setup-local-macos.command`, or run:

```bash
bash scripts/setup-local-macos.sh
```

macOS may ask for approval before opening a downloaded `.command` file. If
needed, Control-click the file, select **Open**, and approve it.

The macOS installer detects both Apple Silicon and Intel Homebrew locations and
adds the versioned Node.js, PostgreSQL, and Python tools to its own `PATH`.

## What the installers do

- Check Node.js and PostgreSQL
- Create or reuse a database named `krispoint`
- Create a dedicated `krispoint_app` database account
- Generate a strong database password and a 64-character encryption key
- Write the local application `.env`
- Install Node dependencies
- Create or update all KrisPoint database tables
- Optionally install Python 3.11, MedASR dependencies, and voice configuration

KrisPoint does not run using the PostgreSQL administrator account. The
administrator password is held only while the database is configured and then
removed from the installer process.

Generated `.env` files are excluded from Git and should not be shared.

If an existing `.env` is present, the installers preserve its database
credentials and encryption key. They will not replace an encryption key for an
existing installation because doing so would make previously encrypted patient
data unreadable.

## MedASR voice setup

Before choosing voice recognition in either guided installer:

1. Install 64-bit Python 3.11.
2. Sign in to Hugging Face and accept the terms at
   <https://huggingface.co/google/medasr>.
3. Create a read-only Hugging Face token.
4. Enter the token when the installer requests it.

Only the computer hosting the voice server needs Hugging Face access. Normal
KrisPoint users do not need Hugging Face accounts.

The first voice-server start downloads approximately 421 MB of model files.
Later starts use the local cache and can normally run offline.

## Starting KrisPoint

Start the application from the KrisPoint folder:

```bash
npm run dev
```

Open <http://localhost:5000>.

Start local voice recognition separately:

- Windows: double-click `vosk-server\START_VOICE_SERVER.bat`
- macOS: double-click `start-voice-server-macos.command`

Keep the voice-server window open while dictating.

## First application user

1. The first user to register becomes the System Owner.
2. Create additional users and assign roles as needed.
3. System templates and macros are seeded automatically.

## Manual setup fallback

If the guided installer cannot be used:

1. Create a PostgreSQL database and application account.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` and a 64-character `ENCRYPTION_KEY`.
4. Run:

   ```bash
   pnpm install --frozen-lockfile
   npm run db:push
   npm run dev
   ```

For manual voice setup and trusted-LAN instructions, see
`vosk-server/LOCAL_SERVER_SETUP.md`.

## Troubleshooting

### PostgreSQL connection fails

- Confirm PostgreSQL is running.
- Confirm the administrator username, password, host, and port.
- On Windows, ensure PostgreSQL command-line tools were installed.
- On macOS, ensure the PostgreSQL `bin` directory is on `PATH`.

### Port 5000 is already in use

Stop the other process using port 5000 before starting KrisPoint.

### MedASR reports a gated repository or 401 error

Confirm the MedASR terms were accepted by the same Hugging Face account that
created the read-only token.

## Production notes

For a hospital deployment:

- Use HTTPS and secure WebSockets (`wss://`)
- Restrict database and voice-server ports to trusted networks
- Configure regular PostgreSQL backups
- Protect `.env` files with operating-system permissions
- Run the application and voice server as managed services