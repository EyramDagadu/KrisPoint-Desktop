[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InstallRoot,
    [Parameter(Mandatory = $true)][string]$EnvironmentFile
)

$ErrorActionPreference = 'Stop'
$currentFile = Join-Path $InstallRoot 'current.txt'
if (-not (Test-Path -LiteralPath $currentFile)) { throw "Missing deployment pointer: $currentFile" }
foreach ($line in Get-Content -LiteralPath $EnvironmentFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $separator = $trimmed.IndexOf('=')
    if ($separator -lt 1) { continue }
    $name = $trimmed.Substring(0, $separator).Trim()
    $value = $trimmed.Substring($separator + 1).Trim().Trim('"').Trim("'")
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
}
$release = (Get-Content -LiteralPath $currentFile -Raw).Trim()
$entry = Join-Path $release 'server-https.js'
if (-not (Test-Path -LiteralPath $entry)) { throw "Current release has no root server entrypoint: $entry" }
Set-Location $release
& node $entry
exit $LASTEXITCODE