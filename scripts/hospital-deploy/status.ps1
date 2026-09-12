[CmdletBinding()]
param(
    [string]$InstallRoot = 'C:\KrisPoint-Hospital',
    [string]$ServiceName = 'KrisPointHospital',
    [string]$EnvironmentFile = 'C:\ProgramData\KrisPoint\hospital.env',
    [Nullable[int]]$Port = $null,
    [string]$HealthUrl
)

. (Join-Path $PSScriptRoot 'common.ps1')
$paths = Get-DeploymentPaths $InstallRoot
$current = Get-CurrentRelease $paths
$service = Get-HospitalService $ServiceName
Write-Host "KrisPoint Hospital deployment: $($paths.Root)"
Write-Host "Current release: $(if ($current) { $current } else { 'none' })"
Write-Host "Service ${ServiceName}: $(if ($service) { $service.Status } else { 'not installed' })"
if (-not (Test-Path -LiteralPath $EnvironmentFile)) {
    Write-Error "Environment file not found: $EnvironmentFile"
    exit 1
}
Import-MachineEnvironment $EnvironmentFile
$effectivePort = if ($null -ne $Port) { [int]$Port } else { [int]$env:PORT }
if (-not $service -or $service.Status -ne 'Running') {
    Write-Error 'KrisPoint service is not running.'
    exit 1
}
if (-not (Test-HospitalHealth $effectivePort $HealthUrl (Join-Path $paths.Logs 'status.log'))) {
    Write-Error 'KrisPoint /api/health is not HTTP 200 healthy.'
    exit 1
}
if ($current -and (Test-Path -LiteralPath (Join-Path $current 'deployment.json'))) {
    Write-Host 'Release metadata:'
    Get-Content -LiteralPath (Join-Path $current 'deployment.json')
}
$latestBackup = Get-ChildItem -LiteralPath $paths.Backups -Filter '*.dump' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Latest PostgreSQL backup: $(if ($latestBackup) { $latestBackup.FullName } else { 'none' })"
Write-Host "Logs: $($paths.Logs)"