#!/usr/bin/env bash
set -euo pipefail

required=(
  APPLE_CERTIFICATE_BASE64
  APPLE_CERTIFICATE_PASSWORD
  APPLE_SIGNING_IDENTITY
  APPLE_API_KEY_BASE64
  APPLE_API_KEY_ID
  APPLE_API_ISSUER
  KRISPOINT_LICENSE_PUBLIC_KEY
)
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Required release secret ${name} is missing" >&2
    exit 1
  fi
done

keychain_path="${RUNNER_TEMP}/krispoint-signing.keychain-db"
keychain_password="$(openssl rand -hex 24)"
certificate_path="${RUNNER_TEMP}/krispoint-signing.p12"
api_key_path="${RUNNER_TEMP}/AuthKey_${APPLE_API_KEY_ID}.p8"

printf '%s' "${APPLE_CERTIFICATE_BASE64}" | base64 --decode > "${certificate_path}"
printf '%s' "${APPLE_API_KEY_BASE64}" | base64 --decode > "${api_key_path}"
chmod 600 "${certificate_path}" "${api_key_path}"

security create-keychain -p "${keychain_password}" "${keychain_path}"
security set-keychain-settings -lut 21600 "${keychain_path}"
security unlock-keychain -p "${keychain_password}" "${keychain_path}"
security import "${certificate_path}" \
  -k "${keychain_path}" \
  -P "${APPLE_CERTIFICATE_PASSWORD}" \
  -T /usr/bin/codesign \
  -T /usr/bin/security
security set-key-partition-list \
  -S apple-tool:,apple:,codesign: \
  -s \
  -k "${keychain_password}" \
  "${keychain_path}"
security list-keychains -d user -s "${keychain_path}"

node - <<'NODE'
const fs = require('node:fs');
const source = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
source.bundle.macOS.signingIdentity = process.env.APPLE_SIGNING_IDENTITY;
fs.writeFileSync('src-tauri/tauri.signed.conf.json', `${JSON.stringify(source, null, 2)}\n`);
NODE

{
  echo "config=src-tauri/tauri.signed.conf.json"
  echo "api-key-path=${api_key_path}"
  echo "keychain-path=${keychain_path}"
} >> "${GITHUB_OUTPUT}"

rm -f "${certificate_path}"