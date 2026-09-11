$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DatabaseName = "krispoint"
$ApplicationUser = "krispoint_app"
$EnvironmentPath = Join-Path $ProjectRoot ".env"
$VoiceDirectory = Join-Path $ProjectRoot "vosk-server"
$VoiceEnvironmentPath = Join-Path $VoiceDirectory ".env"
$VoicePython = Join-Path $VoiceDirectory ".venv\Scripts\python.exe"

function Stop-Setup([string]$Message) {
    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Require-Command([string]$Name, [string]$InstallMessage) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Stop-Setup "$Name was not found. $InstallMessage"
    }
}

function Find-PostgresTool([string]$ToolName) {
    $command = Get-Command $ToolName -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $candidates = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\$ToolName.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending
    if ($candidates.Count -gt 0) {
        return $candidates[0].FullName
    }

    Stop-Setup "$ToolName was not found. Install PostgreSQL 15 or later, including command-line tools."
}

function Read-Default([string]$Prompt, [string]$DefaultValue) {
    $value = Read-Host "$Prompt [$DefaultValue]"
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $DefaultValue
    }
    return $value.Trim()
}

function Convert-SecureStringToText([Security.SecureString]$SecureValue) {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

function Run-Checked([string]$Description, [scriptblock]$Command) {
    Write-Host $Description
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Stop-Setup "$Description failed with exit code $LASTEXITCODE."
    }
}

Set-Location $ProjectRoot

Write-Host "========================================"
Write-Host " KrisPoint First-Time Setup - Windows"
Write-Host "========================================"
Write-Host ""

Require-Command "node" "Install Node.js 20 or later from https://nodejs.org/."
Require-Command "npm" "Install Node.js 20 or later from https://nodejs.org/."

$nodeMajor = [int]((& node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 20) {
    Stop-Setup "Node.js 20 or later is required. Installed version: $(& node --version)"
}

$psql = Find-PostgresTool "psql"
$createdb = Find-PostgresTool "createdb"

if (Test-Path $EnvironmentPath) {
    Write-Host "An existing .env file was found."
    Write-Host "Its database credentials and encryption key will be preserved."
    Write-Host "To protect existing encrypted patient data, this installer never replaces them."
    Run-Checked "Installing application dependencies..." { npm ci --ignore-scripts --no-audit --no-fund }
    Run-Checked "Initializing or updating database tables..." { npm run db:push }
    Write-Host ""
    Write-Host "Existing KrisPoint installation verified successfully." -ForegroundColor Green
    Write-Host "Run setup-voice-server.bat separately if voice recognition is not installed."
    exit 0
}

$databaseHost = Read-Default "PostgreSQL host" "localhost"
$databasePort = Read-Default "PostgreSQL port" "5432"
$administrator = Read-Default "PostgreSQL administrator username" "postgres"
$administratorSecret = Read-Host "PostgreSQL administrator password (not saved)" -AsSecureString
$administratorPassword = Convert-SecureStringToText $administratorSecret
$applicationPassword = (& node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))")
$encryptionKey = (& node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")

try {
    $env:PGPASSWORD = $administratorPassword

    $roleExists = (& $psql --host $databaseHost --port $databasePort --username $administrator --dbname postgres --tuples-only --no-align --command "SELECT 1 FROM pg_roles WHERE rolname = '$ApplicationUser';").Trim()
    if ($LASTEXITCODE -ne 0) {
        Stop-Setup "Could not connect to PostgreSQL. Check the host, port, username, password, and that PostgreSQL is running."
    }

    if ($roleExists -ne "1") {
        Run-Checked "Creating the dedicated KrisPoint database account..." {
            & $psql --host $databaseHost --port $databasePort --username $administrator --dbname postgres --set ON_ERROR_STOP=1 --command "CREATE ROLE $ApplicationUser LOGIN PASSWORD '$applicationPassword';"
        }
    } else {
        Run-Checked "Refreshing the dedicated KrisPoint database password..." {
            & $psql --host $databaseHost --port $databasePort --username $administrator --dbname postgres --set ON_ERROR_STOP=1 --command "ALTER ROLE $ApplicationUser WITH LOGIN PASSWORD '$applicationPassword';"
        }
    }

    $databaseExists = (& $psql --host $databaseHost --port $databasePort --username $administrator --dbname postgres --tuples-only --no-align --command "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';").Trim()
    if ($LASTEXITCODE -ne 0) {
        Stop-Setup "Could not check the KrisPoint database."
    }

    if ($databaseExists -ne "1") {
        Run-Checked "Creating the KrisPoint database..." {
            & $createdb --host $databaseHost --port $databasePort --username $administrator --owner $ApplicationUser $DatabaseName
        }
    } else {
        Run-Checked "Assigning the existing KrisPoint database to its application account..." {
            & $psql --host $databaseHost --port $databasePort --username $administrator --dbname postgres --set ON_ERROR_STOP=1 --command "ALTER DATABASE $DatabaseName OWNER TO $ApplicationUser;"
        }
    }
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    $administratorPassword = $null
    $administratorSecret.Dispose()
}

$databaseUrl = "postgresql://${ApplicationUser}:${applicationPassword}@${databaseHost}:${databasePort}/${DatabaseName}"
@"
# Generated by KrisPoint first-time setup.
DATABASE_URL=$databaseUrl
ENCRYPTION_KEY=$encryptionKey
VITE_VOSK_SERVER_URL=
NODE_ENV=development
"@ | Set-Content -Path $EnvironmentPath -Encoding UTF8

$env:DATABASE_URL = $databaseUrl
$env:ENCRYPTION_KEY = $encryptionKey
Run-Checked "Installing application dependencies..." { npm ci --ignore-scripts --no-audit --no-fund }
Run-Checked "Creating or updating KrisPoint database tables..." { npm run db:push }

$installVoice = Read-Host "Install local MedASR voice recognition on this computer? [y/N]"
if ($installVoice -match "^[Yy]$") {
    if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
        Stop-Setup "Python Launcher was not found. Install 64-bit Python 3.11 and select 'Add Python to PATH'."
    }

    & py -3.11 -c "import struct, sys; assert sys.version_info[:2] == (3, 11); assert struct.calcsize('P') * 8 == 64"
    if ($LASTEXITCODE -ne 0) {
        Stop-Setup "Voice recognition requires 64-bit Python 3.11."
    }

    if (-not (Test-Path $VoicePython)) {
        Run-Checked "Creating the private voice Python environment..." {
            & py -3.11 -m venv (Join-Path $VoiceDirectory ".venv")
        }
    }

    Run-Checked "Updating pip in the voice environment..." { & $VoicePython -m pip install --upgrade pip }
    Run-Checked "Installing MedASR dependencies..." { & $VoicePython -m pip install -r (Join-Path $VoiceDirectory "requirements.txt") }
    Run-Checked "Verifying voice dependencies..." { & $VoicePython -c "import faster_whisper; import torch; import transformers; import websockets" }

    Write-Host ""
    Write-Host "Accept the MedASR terms at https://huggingface.co/google/medasr"
    $hfSecret = Read-Host "Read-only Hugging Face token" -AsSecureString
    $hfToken = Convert-SecureStringToText $hfSecret
    try {
        if ([string]::IsNullOrWhiteSpace($hfToken)) {
            Stop-Setup "A Hugging Face token is required for the first MedASR download."
        }
        @"
ASR_ENGINE=medasr
MEDASR_MODEL_ID=google/medasr
MEDASR_DEVICE=cpu
MEDASR_CPU_THREADS=4
MEDASR_MIN_SILENCE_SECONDS=0.5
MEDASR_MAX_UTTERANCE_SECONDS=20
HF_TOKEN=$hfToken
VOICE_HOST=127.0.0.1
VOICE_PORT=8000
SAMPLE_RATE=16000
CHUNK_SIZE=8000
"@ | Set-Content -Path $VoiceEnvironmentPath -Encoding UTF8
    } finally {
        $hfToken = $null
        $hfSecret.Dispose()
    }
}

Write-Host ""
Write-Host "KrisPoint setup completed successfully." -ForegroundColor Green
Write-Host "Start the application with: npm run dev"
if ($installVoice -match "^[Yy]$") {
    Write-Host "Start voice recognition with: vosk-server\START_VOICE_SERVER.bat"
}