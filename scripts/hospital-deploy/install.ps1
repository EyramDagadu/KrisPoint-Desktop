#requires -RunAsAdministrator
[CmdletBinding()]
param(
    [string]$Repository = (Get-Location).Path,
    [string]$Revision = 'HEAD',
    [string]$InstallRoot = 'C:\KrisPoint-Hospital',
    [string]$EnvironmentFile = 'C:\ProgramData\KrisPoint\hospital.env',
    [string]$ServiceName = 'KrisPointHospital',
    [string]$NssmPath,
    [int]$Port = 5000,
    [string]$SslCertPath,
    [string]$SslKeyPath,
    [string]$HealthUrl,
    [Parameter(Mandatory = $true)][string]$FirewallRemoteSubnet
)

. (Join-Path $PSScriptRoot 'common.ps1')
$paths = Get-DeploymentPaths $InstallRoot
$log = Join-Path $paths.Logs 'install.log'
$serviceCreated = $false
$serviceStartAttempted = $false
$serviceWasPresent = [bool](Get-HospitalService $ServiceName)

try {
    New-Item -ItemType Directory -Path $paths.Root, $paths.Logs -Force | Out-Null
    $databaseUnset = -not (Test-Path -LiteralPath $EnvironmentFile) -or
        [bool](Select-String -LiteralPath $EnvironmentFile -Pattern '^\s*DATABASE_URL\s*=\s*$' -Quiet -ErrorAction SilentlyContinue)
    if ($databaseUnset) {
        Write-Host "No machine-local environment file exists yet."
        $secret = Read-Host 'PostgreSQL DATABASE_URL (input is hidden)' -AsSecureString
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        try { $databaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer); $secret.Dispose() }
        if ([string]::IsNullOrWhiteSpace($databaseUrl)) { throw 'A PostgreSQL DATABASE_URL is required.' }
        if (-not (Test-Path -LiteralPath $EnvironmentFile)) {
            $environmentDirectory = Split-Path -Parent $EnvironmentFile
            if ($environmentDirectory) {
                New-Item -ItemType Directory -Path $environmentDirectory -Force | Out-Null
            }
            New-Item -ItemType File -Path $EnvironmentFile -Force | Out-Null
            Protect-EnvironmentFile $EnvironmentFile
        }
        Set-EnvironmentValue $EnvironmentFile 'DATABASE_URL' $databaseUrl
    }
    if ([string]::IsNullOrWhiteSpace($FirewallRemoteSubnet)) {
        throw 'FirewallRemoteSubnet is required. Supply the clinical LAN subnet, for example 192.168.10.0/24.'
    }
    Ensure-HospitalEnvironment $EnvironmentFile $Port $SslCertPath $SslKeyPath
    Protect-EnvironmentFile $EnvironmentFile
    $release = New-Release $paths $Repository $Revision $EnvironmentFile $log
    $backup = Invoke-DatabaseBackup $paths $log
    Invoke-SchemaInitializationAndMigration $release $log
    Set-CurrentRelease $paths $release
    # The runner follows current.txt, so the service never needs to be
    # reconfigured for an update or rollback.
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'run-service.ps1') -Destination $paths.ServiceRunner -Force
    $serviceCreated = Install-HospitalService $ServiceName $paths $EnvironmentFile $NssmPath $log
    Configure-HospitalFirewall $FirewallRemoteSubnet $Port $log
    $serviceStartAttempted = $true
    Start-HospitalService $ServiceName $log
    Wait-HospitalHealthy $Port $HealthUrl $log
    Write-DeploymentLog "Hospital install complete. Revision $Revision; database backup $backup" $log
} catch {
    Write-DeploymentLog "INSTALL FAILED: $($_.Exception.Message)" $log
    if ($serviceStartAttempted) {
        try { Stop-HospitalService $ServiceName $log | Out-Null } catch { Write-DeploymentLog "Recovery stop failed: $($_.Exception.Message)" $log }
    }
    if ($serviceCreated) {
        try { Remove-HospitalService $ServiceName $NssmPath $log } catch { Write-DeploymentLog "Recovery service removal failed: $($_.Exception.Message)" $log }
    } elseif (-not $serviceWasPresent -and (Get-HospitalService $ServiceName)) {
        try { Remove-HospitalService $ServiceName $NssmPath $log } catch { Write-DeploymentLog "Recovery partial-service removal failed: $($_.Exception.Message)" $log }
    }
    Write-Host "Install recovery: service was stopped$(if ($serviceCreated) { ' and removed' } else { '' }); current pointer is $($paths.Current). Review $log before retrying." -ForegroundColor Yellow
    Write-Host "Deployment failed. Review $log" -ForegroundColor Red
    exit 1
}