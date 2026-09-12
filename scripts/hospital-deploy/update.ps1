#requires -RunAsAdministrator
[CmdletBinding()]
param(
    [string]$Repository = (Get-Location).Path,
    [Parameter(Mandatory = $true)][string]$Revision,
    [string]$InstallRoot = 'C:\KrisPoint-Hospital',
    [string]$EnvironmentFile = 'C:\ProgramData\KrisPoint\hospital.env',
    [string]$ServiceName = 'KrisPointHospital',
    [string]$NssmPath,
    [Nullable[int]]$Port = $null,
    [string]$HealthUrl
)

. (Join-Path $PSScriptRoot 'common.ps1')
$paths = Get-DeploymentPaths $InstallRoot
$log = Join-Path $paths.Logs 'update.log'
$previous = Get-CurrentRelease $paths
$previousRollback = Get-PreviousRelease $paths
$release = $null
$wasRunning = $false
$switched = $false

try {
    if (-not $previous) { throw 'No current release exists. Run install.ps1 first.' }
    $serviceBeforeUpdate = Get-HospitalService $ServiceName
    if (-not $serviceBeforeUpdate) {
        throw "Windows service $ServiceName is not installed. Run install.ps1 before updating."
    }
    if ($serviceBeforeUpdate.Status -ne 'Running') {
        throw "Windows service $ServiceName is not running. Start it and verify health before updating."
    }
    $wasRunning = $true
    Ensure-HospitalEnvironment $EnvironmentFile $Port
    Protect-EnvironmentFile $EnvironmentFile
    $effectivePort = [int]$env:PORT
    # Build first while the known-good service continues serving patients.
    $release = New-Release $paths $Repository $Revision $EnvironmentFile $log
    Stop-HospitalService $ServiceName $log | Out-Null
    $backup = Invoke-DatabaseBackup $paths $log
    Invoke-SchemaInitializationAndMigration $release $log
    Set-PreviousRelease $paths $previous
    Set-CurrentRelease $paths $release
    $switched = $true
    Start-HospitalService $ServiceName $log
    Wait-HospitalHealthy $effectivePort $HealthUrl $log
    Write-DeploymentLog "Hospital update complete. Revision $Revision; database backup $backup" $log
} catch {
    Write-DeploymentLog "UPDATE FAILED: $($_.Exception.Message)" $log
    if ($release -and -not $switched -and (Test-Path -LiteralPath $release)) {
        Remove-Item -LiteralPath $release -Recurse -Force -ErrorAction SilentlyContinue
        Write-DeploymentLog "Removed incomplete release $release" $log
    }
    # Keep the old pointer and bring the old service back whenever possible.
    if ($switched -and $previous) {
        try { Stop-HospitalService $ServiceName $log | Out-Null } catch { Write-DeploymentLog "Could not stop failed new service: $($_.Exception.Message)" $log }
        try { Set-CurrentRelease $paths $previous } catch { Write-DeploymentLog "Could not restore current pointer: $($_.Exception.Message)" $log }
        if ($previousRollback) {
            try { Set-PreviousRelease $paths $previousRollback } catch { Write-DeploymentLog "Could not restore previous-release pointer: $($_.Exception.Message)" $log }
        } elseif (Test-Path -LiteralPath $paths.Previous) {
            Remove-Item -LiteralPath $paths.Previous -Force -ErrorAction SilentlyContinue
        }
    }
    if ($wasRunning) {
        try {
            Start-HospitalService $ServiceName $log
            Wait-HospitalHealthy $effectivePort $HealthUrl $log
        } catch { Write-DeploymentLog "Could not restart prior healthy service: $($_.Exception.Message)" $log }
    }
    Write-Host "Update failed; the prior release was retained. Review $log" -ForegroundColor Red
    exit 1
}