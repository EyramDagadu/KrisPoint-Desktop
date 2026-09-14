$ErrorActionPreference = 'Stop'

foreach ($name in @(
  'WINDOWS_SIGNING_CERTIFICATE_BASE64',
  'WINDOWS_SIGNING_CERTIFICATE_PASSWORD',
  'KRISPOINT_LICENSE_PUBLIC_KEY'
)) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    throw "Required release secret $name is missing"
  }
}

$certificatePath = Join-Path $env:RUNNER_TEMP 'krispoint-signing.pfx'
try {
  [IO.File]::WriteAllBytes(
    $certificatePath,
    [Convert]::FromBase64String($env:WINDOWS_SIGNING_CERTIFICATE_BASE64)
  )
  $password = ConvertTo-SecureString $env:WINDOWS_SIGNING_CERTIFICATE_PASSWORD -AsPlainText -Force
  $certificate = Import-PfxCertificate `
    -FilePath $certificatePath `
    -CertStoreLocation 'Cert:\CurrentUser\My' `
    -Password $password `
    -Exportable:$false |
      Where-Object HasPrivateKey |
      Select-Object -First 1
  if (-not $certificate) {
    throw 'The Windows signing certificate did not include an accessible private key'
  }

  $configPath = 'src-tauri/tauri.signed.conf.json'
  $config = Get-Content 'src-tauri/tauri.conf.json' -Raw | ConvertFrom-Json
  $config.bundle.windows.certificateThumbprint = $certificate.Thumbprint
  $config.bundle.windows.digestAlgorithm = 'sha256'
  $config.bundle.windows.timestampUrl = 'http://timestamp.digicert.com'
  $config | ConvertTo-Json -Depth 100 | Set-Content $configPath -Encoding utf8
  "config=$configPath" | Out-File -FilePath $env:GITHUB_OUTPUT -Append -Encoding utf8
} finally {
  Remove-Item $certificatePath -Force -ErrorAction SilentlyContinue
}