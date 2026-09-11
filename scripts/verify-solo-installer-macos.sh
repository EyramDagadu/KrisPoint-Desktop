#!/bin/bash
set -euo pipefail

dmg="$(find src-tauri/target/release/bundle/dmg -name '*.dmg' -print -quit)"
[ -n "$dmg" ] || { echo "DMG installer was not produced" >&2; exit 1; }
mount_dir="$(mktemp -d)"
install_dir="$RUNNER_TEMP/KrisPoint-install"
cleanup() {
  sudo pfctl -a com.apple/krispoint-offline-smoke -F all 2>/dev/null || true
  if [ "${pf_was_enabled:-1}" = 0 ]; then sudo pfctl -d 2>/dev/null || true; fi
  hdiutil detach "$mount_dir" -quiet 2>/dev/null || true
  rm -rf "$mount_dir" "$install_dir"
}
trap cleanup EXIT

hdiutil attach "$dmg" -mountpoint "$mount_dir" -nobrowse -quiet
app="$(find "$mount_dir" -maxdepth 1 -name '*.app' -print -quit)"
[ -n "$app" ] || { echo "Application bundle is missing from DMG" >&2; exit 1; }
# The PyInstaller voice runtime is sealed as a resource tree. --deep treats
# its standalone Mach-O files as nested bundles; strict bundle verification
# checks the app signature and complete resource envelope correctly.
codesign --verify --strict "$app"
app_executable="$app/Contents/MacOS/krispoint"
voice_executable="$(find "$app/Contents/Resources" -name krispoint-voice -type f -print -quit)"
file "$app_executable" | grep -q "arm64"
[ -n "$voice_executable" ] || { echo "Bundled MedASR executable is missing" >&2; exit 1; }
file "$voice_executable" | grep -q "arm64"
mkdir -p "$install_dir"

# Clean install, launch, rerun/upgrade replacement, and uninstall.
ditto "$app" "$install_dir/KrisPoint.app"
env -i HOME="$HOME" PATH="/usr/bin:/bin" \
  "$install_dir/KrisPoint.app/Contents/MacOS/krispoint" >/dev/null 2>&1 &
app_pid=$!
sleep 10
kill -0 "$app_pid"
kill "$app_pid" || true
wait "$app_pid" 2>/dev/null || true

installed_voice="$(find "$install_dir/KrisPoint.app/Contents/Resources" -name krispoint-voice -type f -print -quit)"
[ -n "$installed_voice" ] || { echo "Installed MedASR executable is missing" >&2; exit 1; }
pf_was_enabled=0
sudo pfctl -s info 2>/dev/null | grep -q '^Status: Enabled' && pf_was_enabled=1
printf 'pass quick on lo0\nblock drop out all\n' | sudo pfctl -a com.apple/krispoint-offline-smoke -f -
[ "$pf_was_enabled" = 1 ] || sudo pfctl -e
python scripts/verify-installed-voice.py \
  --application "$install_dir/KrisPoint.app/Contents/MacOS/krispoint" \
  --audio training_data/audio/1/session_1766430738966_1urld97w9.wav
sudo pfctl -a com.apple/krispoint-offline-smoke -F all
[ "$pf_was_enabled" = 1 ] || sudo pfctl -d

ditto "$app" "$install_dir/KrisPoint.app"
test -x "$install_dir/KrisPoint.app/Contents/MacOS/krispoint"
rm -rf "$install_dir/KrisPoint.app"
test ! -e "$install_dir/KrisPoint.app"