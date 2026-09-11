#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
VOICE_PYTHON="$ROOT/vosk-server/.venv/bin/python"

if [ ! -x "$VOICE_PYTHON" ]; then
  echo "Voice recognition is not installed."
  echo "Run setup-local-macos.command first."
  read -r -p "Press Enter to close."
  exit 1
fi

cd "$ROOT/vosk-server/src"
exec "$VOICE_PYTHON" websocket_server.py