# Shared implementation for the Windows-first Hospital deployment scripts.
# This file deliberately keeps the environment file outside the Git checkout.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-DeploymentLog {
    param([string]$Message, [string]$LogPath)
    $line = '{0:u} {1}' -f (Get-Date), $Message
    Write-Host $line
    if ($LogPath) {
        $directory = Split-Path -Parent $LogPath
        if ($directory) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
        Add-Content -Path $LogPath -Value $line -Encoding UTF8
    }
}

function Invoke-Checked {
    param([string]$Description, [scriptblock]$Command, [string]$LogPath)
    Write-DeploymentLog $Description $LogPath
    try {
        $global:LASTEXITCODE = 0
        & $Command 2>&1 | Tee-Object -FilePath $LogPath -Append | Out-Host
    } catch {
        throw "$Description failed: $($_.Exception.Message)"
    }
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        throw "$Description failed with exit code $LASTEXITCODE. See $LogPath"
    }
}

function Invoke-PsqlScalar {
    param([string]$Query, [string]$LogPath)
    $psql = Get-Command psql.exe -ErrorAction SilentlyContinue
    if (-not $psql) {
        $candidate = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending | Select-Object -First 1
        if ($candidate) { $psql = $candidate.FullName }
    }
    if (-not $psql) { throw 'psql.exe was not found. Install PostgreSQL command-line tools before deployment.' }
    $output = & $psql --dbname=$env:DATABASE_URL --tuples-only --no-align --set ON_ERROR_STOP=1 --command $Query 2>&1
    if ($LASTEXITCODE -ne 0) {
        ($output | Out-String) | Add-Content -Path $LogPath -Encoding UTF8
        throw "PostgreSQL inspection failed. See $LogPath"
    }
    return ($output | Out-String).Trim()
}

function Get-DatabaseTableState {
    param([string]$LogPath)
    $countQuery = @'
SELECT count(*)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  AND table_name NOT IN ('__drizzle_migrations');
'@
    $count = [int](Invoke-PsqlScalar $countQuery $LogPath)
    if ($count -eq 0) {
        Write-DeploymentLog 'PostgreSQL public schema has zero application tables (clean initialization allowed).' $LogPath
        return 'empty'
    }
    $missingQuery = @'
SELECT string_agg(required_table, ',')
FROM (VALUES ('roles'), ('users'), ('patients'), ('reports')) AS required(required_table)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_name = required.required_table
);
'@
    $missing = Invoke-PsqlScalar $missingQuery $LogPath
    if ($missing -and $missing -ne '') {
        throw "The existing PostgreSQL database has application tables but is missing required base tables: $missing. Refusing db:push; restore a compatible database or complete a reviewed migration."
    }
    Write-DeploymentLog 'PostgreSQL public schema is initialized; db:push is prohibited for this deployment.' $LogPath
    return 'initialized'
}

function Invoke-SchemaInitializationAndMigration {
    param([string]$ReleasePath, [string]$LogPath)
    $state = Get-DatabaseTableState $LogPath
    if ($state -eq 'empty') {
        Push-Location $ReleasePath
        try {
            # --force prevents drizzle-kit from asking an interactive question.
            Invoke-Checked 'Initializing the empty PostgreSQL schema with pnpm db:push' {
                & pnpm --filter @workspace/krispoint run db:push -- --force
            } $LogPath
        } finally { Pop-Location }
    }
    Invoke-HospitalMigration $ReleasePath $LogPath
}

function Get-DeploymentPaths {
    param([string]$InstallRoot)
    $root = [IO.Path]::GetFullPath($InstallRoot)
    [pscustomobject]@{
        Root = $root
        Releases = Join-Path $root 'releases'
        Backups = Join-Path $root 'backups'
        Logs = Join-Path $root 'logs'
        Current = Join-Path $root 'current.txt'
        Previous = Join-Path $root 'previous.txt'
        ServiceRunner = Join-Path $root 'run-service.ps1'
    }
}

function Import-MachineEnvironment {
    param([string]$EnvironmentFile)
    if (-not (Test-Path -LiteralPath $EnvironmentFile)) {
        throw "Environment file not found: $EnvironmentFile. Copy .env.example there and keep it outside Git."
    }
    foreach ($line in Get-Content -LiteralPath $EnvironmentFile) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        $separator = $trimmed.IndexOf('=')
        if ($separator -lt 1) { continue }
        $name = $trimmed.Substring(0, $separator).Trim()
        $value = $trimmed.Substring($separator + 1).Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

function New-SecureToken {
    $bytes = New-Object byte[] 48
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function New-SecureHex {
    $bytes = New-Object byte[] 32
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    return ([BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
}

function Set-EnvironmentValue {
    param([string]$EnvironmentFile, [string]$Name, [string]$Value)
    $escaped = [regex]::Escape($Name)
    $lines = if (Test-Path -LiteralPath $EnvironmentFile) {
        @(Get-Content -LiteralPath $EnvironmentFile)
    } else { @() }
    $found = $false
    $updated = foreach ($line in $lines) {
        if ($line -match "^\s*$escaped\s*=") {
            $found = $true
            "$Name=$Value"
        } else { $line }
    }
    if (-not $found) { $updated += "$Name=$Value" }
    Set-Content -LiteralPath $EnvironmentFile -Value $updated -Encoding UTF8
    Protect-EnvironmentFile $EnvironmentFile
}

function Ensure-HospitalEnvironment {
    param(
        [string]$EnvironmentFile,
        [Nullable[int]]$Port = $null,
        [string]$SslCertPath,
        [string]$SslKeyPath
    )
    $initialPort = if ($null -ne $Port) { [int]$Port } else { 5000 }
    $directory = Split-Path -Parent $EnvironmentFile
    if ($directory) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $EnvironmentFile)) {
        @(
            '# Machine-local KrisPoint Hospital production configuration.',
            '# Protect this file; it is never copied into a release directory.',
            'DATABASE_URL=',
            'ENCRYPTION_KEY=',
            'VOICE_CLIENT_TOKEN=',
            'VITE_VOSK_SERVER_URL=',
            'NODE_ENV=production',
            'VITE_KRISPOINT_EDITION=hospital',
            'LICENSE_SERVER_URL=https://license.krispoint.com.gh',
            'HOST=0.0.0.0',
            "PORT=$initialPort",
            'SSL_CERT_PATH=',
            'SSL_KEY_PATH=',
            'REQUIRE_HTTPS=true',
            'ENABLE_HTTP_REDIRECT=false'
        ) | Set-Content -LiteralPath $EnvironmentFile -Encoding UTF8
        Protect-EnvironmentFile $EnvironmentFile
    }
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $EnvironmentFile) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { $values[$matches[1]] = $matches[2] }
    }
    if ([string]::IsNullOrWhiteSpace([string]$values['VOICE_CLIENT_TOKEN'])) {
        Set-EnvironmentValue $EnvironmentFile 'VOICE_CLIENT_TOKEN' (New-SecureToken)
    }
    if ([string]::IsNullOrWhiteSpace([string]$values['ENCRYPTION_KEY'])) {
        Set-EnvironmentValue $EnvironmentFile 'ENCRYPTION_KEY' (New-SecureHex)
    }
    if (-not $values.ContainsKey('SSL_CERT_PATH')) { Set-EnvironmentValue $EnvironmentFile 'SSL_CERT_PATH' '' }
    if (-not $values.ContainsKey('SSL_KEY_PATH')) { Set-EnvironmentValue $EnvironmentFile 'SSL_KEY_PATH' '' }
    if ($SslCertPath) { Set-EnvironmentValue $EnvironmentFile 'SSL_CERT_PATH' $SslCertPath }
    if ($SslKeyPath) { Set-EnvironmentValue $EnvironmentFile 'SSL_KEY_PATH' $SslKeyPath }
    Set-EnvironmentValue $EnvironmentFile 'REQUIRE_HTTPS' 'true'
    if (-not $values.ContainsKey('ENABLE_HTTP_REDIRECT')) { Set-EnvironmentValue $EnvironmentFile 'ENABLE_HTTP_REDIRECT' 'false' }
    Set-EnvironmentValue $EnvironmentFile 'VITE_KRISPOINT_EDITION' 'hospital'
    Set-EnvironmentValue $EnvironmentFile 'LICENSE_SERVER_URL' 'https://license.krispoint.com.gh'
    Set-EnvironmentValue $EnvironmentFile 'HOST' '0.0.0.0'
    if ($null -ne $Port) {
        Set-EnvironmentValue $EnvironmentFile 'PORT' ([string][int]$Port)
    }
    Set-EnvironmentValue $EnvironmentFile 'NODE_ENV' 'production'
    Import-MachineEnvironment $EnvironmentFile
    if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
        throw "DATABASE_URL is empty in $EnvironmentFile. Set it and rerun the deployment."
    }
    if ([string]::IsNullOrWhiteSpace($env:ENCRYPTION_KEY) -or $env:ENCRYPTION_KEY -notmatch '^[0-9a-fA-F]{64}$') {
        throw "ENCRYPTION_KEY must be a 64-character hexadecimal value in $EnvironmentFile."
    }
    if ([string]::IsNullOrWhiteSpace($env:SSL_CERT_PATH) -or -not (Test-Path -LiteralPath $env:SSL_CERT_PATH)) {
        throw "SSL_CERT_PATH must point to an existing organisation-approved certificate file. Hospital production refuses plaintext LAN service."
    }
    if ([string]::IsNullOrWhiteSpace($env:SSL_KEY_PATH) -or -not (Test-Path -LiteralPath $env:SSL_KEY_PATH)) {
        throw "SSL_KEY_PATH must point to an existing protected private-key file. Hospital production refuses plaintext LAN service."
    }
}

function Protect-EnvironmentFile {
    param([string]$EnvironmentFile)
    # LocalSystem (the default NSSM account) and Administrators can read secrets;
    # inherited access for ordinary LAN users is removed.
    & icacls.exe $EnvironmentFile /inheritance:r /grant:r 'SYSTEM:(F)' 'Administrators:(F)' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not restrict ACLs on $EnvironmentFile" }
}

function Test-HospitalHealth {
    param([int]$Port = 5000, [string]$HealthUrl, [string]$LogPath)
    if (-not $HealthUrl) {
        $hasTlsFiles = -not [string]::IsNullOrWhiteSpace($env:SSL_CERT_PATH) -and
            -not [string]::IsNullOrWhiteSpace($env:SSL_KEY_PATH) -and
            (Test-Path -LiteralPath $env:SSL_CERT_PATH) -and
            (Test-Path -LiteralPath $env:SSL_KEY_PATH)
        $scheme = if ($env:REQUIRE_HTTPS -eq 'true' -or $hasTlsFiles) { 'https' } else { 'http' }
        $HealthUrl = "${scheme}://127.0.0.1:${Port}/api/health"
    }
    $request = @{ Uri = $HealthUrl; UseBasicParsing = $true; TimeoutSec = 15 }
    $healthUri = [Uri]$HealthUrl
    $isLoopbackProbe = $healthUri.IsLoopback -or $healthUri.Host -eq 'localhost'
    $legacyCertificateCallback = $null
    if ($healthUri.Scheme -eq 'https' -and $isLoopbackProbe -and $PSVersionTable.PSVersion.Major -ge 7) {
        $request.SkipCertificateCheck = $true
    } elseif ($healthUri.Scheme -eq 'https' -and $isLoopbackProbe) {
        # Windows PowerShell 5.1 has no per-request SkipCertificateCheck.
        # Scope its process-wide callback to this loopback request and always
        # restore the previous callback in finally.
        $legacyCertificateCallback = [Net.ServicePointManager]::ServerCertificateValidationCallback
        [Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    }
    try {
        $response = Invoke-WebRequest @request
        if ($response.StatusCode -ne 200) {
            throw "HTTP status $($response.StatusCode)"
        }
        $payload = $response.Content | ConvertFrom-Json
        if ($payload.status -ne 'healthy') {
            throw "health status '$($payload.status)'"
        }
        Write-DeploymentLog "Health check passed: $HealthUrl" $LogPath
        return $true
    } catch {
        Write-DeploymentLog "Health check failed for ${HealthUrl}: $($_.Exception.Message)" $LogPath
        return $false
    } finally {
        if ($healthUri.Scheme -eq 'https' -and $isLoopbackProbe -and $PSVersionTable.PSVersion.Major -lt 7) {
            [Net.ServicePointManager]::ServerCertificateValidationCallback = $legacyCertificateCallback
        }
    }
}

function Wait-HospitalHealthy {
    param([int]$Port = 5000, [string]$HealthUrl, [string]$LogPath)
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        if (Test-HospitalHealth $Port $HealthUrl $LogPath) { return }
        Start-Sleep -Seconds 2
    }
    throw "KrisPoint did not become healthy after 60 seconds. Review $LogPath and the service logs."
}

function Get-CurrentRelease {
    param([pscustomobject]$Paths)
    if (-not (Test-Path -LiteralPath $Paths.Current)) { return $null }
    $value = (Get-Content -LiteralPath $Paths.Current -Raw).Trim()
    if (-not $value) { return $null }
    return [IO.Path]::GetFullPath($value)
}

function Get-PreviousRelease {
    param([pscustomobject]$Paths)
    if (-not (Test-Path -LiteralPath $Paths.Previous)) { return $null }
    $value = (Get-Content -LiteralPath $Paths.Previous -Raw).Trim()
    if (-not $value) { return $null }
    return [IO.Path]::GetFullPath($value)
}

function Set-ReleasePointer {
    param([string]$PointerPath, [string]$ReleasePath)
    if (-not (Test-Path -LiteralPath (Join-Path $ReleasePath 'server-https.js')) -or
        -not (Test-Path -LiteralPath (Join-Path $ReleasePath 'artifacts\krispoint\build\index.js'))) {
        throw "Release is missing the root server-https.js or production adapter-node build: $ReleasePath"
    }
    $pointerDirectory = Split-Path -Parent $PointerPath
    New-Item -ItemType Directory -Path $pointerDirectory -Force | Out-Null
    $temporary = "$PointerPath.$([Guid]::NewGuid().ToString('N')).tmp"
    Set-Content -LiteralPath $temporary -Value ([IO.Path]::GetFullPath($ReleasePath)) -NoNewline -Encoding UTF8
    # File.Replace is an atomic same-volume replacement on NTFS, so readers
    # see either the old or new pointer and never a partial pointer.
    if (Test-Path -LiteralPath $PointerPath) {
        [IO.File]::Replace($temporary, $PointerPath, $null)
    } else {
        [IO.File]::Move($temporary, $PointerPath)
    }
}

function Set-CurrentRelease {
    param([pscustomobject]$Paths, [string]$ReleasePath)
    Set-ReleasePointer $Paths.Current $ReleasePath
}

function Set-PreviousRelease {
    param([pscustomobject]$Paths, [string]$ReleasePath)
    Set-ReleasePointer $Paths.Previous $ReleasePath
}

function Find-Nssm {
    param([string]$NssmPath)
    if ($NssmPath -and (Test-Path -LiteralPath $NssmPath)) { return (Resolve-Path $NssmPath).Path }
    $command = Get-Command nssm.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    throw 'NSSM is required for the Hospital service. Install nssm.exe as an administrator and pass -NssmPath, or put it on PATH.'
}

function Get-HospitalService {
    param([string]$ServiceName)
    return Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
}

function Stop-HospitalService {
    param([string]$ServiceName, [string]$LogPath)
    $service = Get-HospitalService $ServiceName
    $wasRunning = $service -and $service.Status -ne 'Stopped'
    if ($wasRunning) {
        Write-DeploymentLog "Stopping Windows service $ServiceName" $LogPath
        Stop-Service -Name $ServiceName -Force
        $service.WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
    }
    return [bool]$wasRunning
}

function Start-HospitalService {
    param([string]$ServiceName, [string]$LogPath)
    Write-DeploymentLog "Starting Windows service $ServiceName" $LogPath
    Start-Service -Name $ServiceName
    (Get-Service -Name $ServiceName).WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
}

function Install-HospitalService {
    param(
        [string]$ServiceName, [pscustomobject]$Paths, [string]$EnvironmentFile,
        [string]$NssmPath, [string]$LogPath
    )
    $nssm = Find-Nssm $NssmPath
    if (Get-HospitalService $ServiceName) { return $false }
    $powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
    $parameters = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$($Paths.ServiceRunner)`" -InstallRoot `"$($Paths.Root)`" -EnvironmentFile `"$EnvironmentFile`""
    function Invoke-NssmChecked([string[]]$Arguments) {
        Invoke-Checked ("NSSM " + ($Arguments -join ' ')) {
            & $nssm @Arguments
        } $LogPath
    }
    Invoke-NssmChecked @('install', $ServiceName, $powershell)
    Invoke-NssmChecked @('set', $ServiceName, 'AppParameters', $parameters)
    Invoke-NssmChecked @('set', $ServiceName, 'AppDirectory', $Paths.Root)
    Invoke-NssmChecked @('set', $ServiceName, 'DisplayName', 'KrisPoint Hospital')
    Invoke-NssmChecked @('set', $ServiceName, 'Start', 'SERVICE_AUTO_START')
    Invoke-NssmChecked @('set', $ServiceName, 'ObjectName', 'LocalSystem')
    Invoke-NssmChecked @('set', $ServiceName, 'AppExit', 'Default', 'Restart')
    Invoke-NssmChecked @('set', $ServiceName, 'AppStdout', (Join-Path $Paths.Logs 'service.out.log'))
    Invoke-NssmChecked @('set', $ServiceName, 'AppStderr', (Join-Path $Paths.Logs 'service.err.log'))
    $checks = @{
        Application = $powershell
        AppDirectory = $Paths.Root
        AppParameters = $parameters
        AppExit = 'Restart'
        AppStdout = (Join-Path $Paths.Logs 'service.out.log')
        AppStderr = (Join-Path $Paths.Logs 'service.err.log')
    }
    foreach ($key in $checks.Keys) {
        $actual = & $nssm get $ServiceName $key 2>&1
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($actual | Out-String))) {
            throw "NSSM verification failed for $ServiceName parameter $key. See $LogPath"
        }
        if (($actual | Out-String).Trim() -notlike "*$($checks[$key])*") {
            throw "NSSM parameter $key is not configured as expected. See $LogPath"
        }
    }
    return $true
}

function Remove-HospitalService {
    param([string]$ServiceName, [string]$NssmPath, [string]$LogPath)
    $nssm = Find-Nssm $NssmPath
    Invoke-Checked "Removing failed-install service $ServiceName" {
        & $nssm remove $ServiceName confirm
    } $LogPath
}

function Configure-HospitalFirewall {
    param([string]$RemoteSubnet, [int]$Port, [string]$LogPath)
    if (-not $RemoteSubnet) { return }
    Invoke-Checked "Allowing only clinical subnet $RemoteSubnet to reach KrisPoint TCP $Port" {
        & New-NetFirewallRule -DisplayName 'KrisPoint Hospital LAN web' -Direction Inbound `
            -Action Allow -Protocol TCP -LocalPort $Port -RemoteAddress $RemoteSubnet
    } $LogPath
}

function New-Release {
    param(
        [pscustomobject]$Paths, [string]$Repository, [string]$Revision,
        [string]$EnvironmentFile, [string]$LogPath
    )
    New-Item -ItemType Directory -Path $Paths.Releases, $Paths.Logs -Force | Out-Null
    $commit = Resolve-GitCommit $Repository $Revision $LogPath
    $name = '{0}-{1}' -f $commit, (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
    $release = Join-Path $Paths.Releases $name
    Import-MachineEnvironment $EnvironmentFile
    try {
        Invoke-Checked "Cloning repository for immutable Git commit $commit into $release" {
            & git clone --no-checkout --quiet $Repository $release
        } $LogPath
        Invoke-Checked "Checking out immutable Git commit $commit" {
            & git -C $release checkout --quiet --detach $commit
        } $LogPath
        Push-Location $release
        try {
            Invoke-Checked 'Installing locked production dependencies with pnpm' {
                # NODE_ENV is already production for the build. --prod=false is
                # explicit so Vite, Drizzle Kit, and other locked build tools
                # are present in every fresh immutable release.
                & pnpm install --prod=false --frozen-lockfile
            } $LogPath
            Invoke-Checked 'Building the Hospital production adapter-node bundle' {
                & pnpm --filter @workspace/krispoint run build
            } $LogPath
            if (-not (Test-Path -LiteralPath (Join-Path $release 'server-https.js'))) {
                throw 'Build source is missing server-https.js'
            }
            if (-not (Test-Path -LiteralPath (Join-Path $release 'artifacts\krispoint\build\index.js'))) {
                throw 'Build completed without artifacts\krispoint\build\index.js'
            }
            @{
                revision = $commit
                createdAt = (Get-Date).ToUniversalTime().ToString('o')
                edition = 'hospital'
                adapter = 'adapter-node'
            } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $release 'deployment.json') -Encoding UTF8
            return $release
        } finally { Pop-Location }
    } catch {
        if (Test-Path -LiteralPath $release) { Remove-Item -LiteralPath $release -Recurse -Force -ErrorAction SilentlyContinue }
        throw
    }
}

function Resolve-GitCommit {
    param([string]$Repository, [string]$Revision, [string]$LogPath)
    $output = & git -C $Repository rev-parse --verify "$Revision^{commit}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        ($output | Out-String) | Add-Content -Path $LogPath -Encoding UTF8
        throw "Git revision '$Revision' could not be resolved to a commit."
    }
    $commit = ($output | Out-String).Trim()
    if ($commit -notmatch '^[0-9a-fA-F]{40}$') {
        throw "Git revision '$Revision' did not resolve to a full 40-character commit SHA."
    }
    return $commit.ToLowerInvariant()
}

function Invoke-DatabaseBackup {
    param([pscustomobject]$Paths, [string]$LogPath)
    $pgDump = Get-Command pg_dump.exe -ErrorAction SilentlyContinue
    if (-not $pgDump) {
        $candidate = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending | Select-Object -First 1
        if ($candidate) { $pgDump = $candidate.FullName }
    }
    if (-not $pgDump) { throw 'pg_dump.exe was not found. Install PostgreSQL command-line tools before migrating.' }
    New-Item -ItemType Directory -Path $Paths.Backups -Force | Out-Null
    $backup = Join-Path $Paths.Backups ('krispoint-{0}.dump' -f (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss'))
    Invoke-Checked "Creating PostgreSQL backup $backup before schema changes" {
        & $pgDump --dbname=$env:DATABASE_URL --format=custom --file=$backup --no-owner --no-privileges
    } $LogPath
    return $backup
}

function Invoke-HospitalMigration {
    param([string]$ReleasePath, [string]$LogPath)
    Push-Location $ReleasePath
    try {
        Invoke-Checked 'Applying the transactional Hospital database migration' {
            & pnpm run db:migrate:hospital
        } $LogPath
    } finally { Pop-Location }
}