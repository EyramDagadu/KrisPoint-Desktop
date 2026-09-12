#requires -RunAsAdministrator
[CmdletBinding()]
param(
    [string]$Release,
    [string]$InstallRoot = 'C:\KrisPoint-Hospital',
    [string]$ServiceName = 'KrisPointHospital',
    [string]$EnvironmentFile = 'C:\ProgramData\KrisPoint\hospital.env',
    [Nullable[int]]$Port = $null,
    [string]$HealthUrl
)

. (Join-Path $PSScriptRoot 'common.ps1')
$paths = Get-DeploymentPaths $InstallRoot
$log = Join-Path $paths.Logs 'rollback.log'
$previous = Get-CurrentRelease $paths
$previousRollback = Get-PreviousRelease $paths
$wasRunning = $false

try {
    if (-not $previous) { throw 'No current release exists.' }
    $serviceBeforeRollback = Get-HospitalService $ServiceName
    if (-not $serviceBeforeRollback) {
        throw "Windows service $ServiceName is not installed. Run install.ps1 before rollback."
    }
    if ($serviceBeforeRollback.Status -ne 'Running') {
        throw "Windows service $ServiceName is not running. Start it and verify health before rollback."
    }
    $wasRunning = $true
    Ensure-HospitalEnvironment $EnvironmentFile $Port
    Import-MachineEnvironment $EnvironmentFile
    $effectivePort = [int]$env:PORT
    if ($Release) {
        $target = if ([IO.Path]::IsPathRooted($Release)) { [IO.Path]::GetFullPath($Release) } else { Join-Path $paths.Releases $Release }
    } else {
        $target = $previousRollback
    }
    if (-not $target -or -not (Test-Path -LiteralPath $target)) {
        throw 'No earlier release is available. Supply -Release <release-directory-name>.'
    }
    Stop-HospitalService $ServiceName $log | Out-Null
    Set-CurrentRelease $paths $target
    Start-HospitalService $ServiceName $log
    Wait-HospitalHealthy $effectivePort $HealthUrl $log
    Set-PreviousRelease $paths $previous
    Write-DeploymentLog "Rolled application back to $target. Database schema was not reversed; use a reviewed pg_restore only when required." $log
} catch {
    Write-DeploymentLog "ROLLBACK FAILED: $($_.Exception.Message)" $log
    if ($previous) {
        try { Set-CurrentRelease $paths $previous } catch { Write-DeploymentLog "Could not restore current pointer: $($_.Exception.Message)" $log }
    }
    if ($previousRollback) {
        try { Set-PreviousRelease $paths $previousRollback } catch { Write-DeploymentLog "Could not restore previous-release pointer: $($_.Exception.Message)" $log }
    }
    if ($wasRunning) {
        try {
            Stop-HospitalService $ServiceName $log | Out-Null
            Start-HospitalService $ServiceName $log
            Wait-HospitalHealthy $effectivePort $HealthUrl $log
        } catch { Write-DeploymentLog "Could not restart prior healthy service: $($_.Exception.Message)" $log }
    }
    Write-Host "Rollback failed; the prior release was retained. Review $log" -ForegroundColor Red
    exit 1
}