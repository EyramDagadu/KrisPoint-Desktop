#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
export CI=1

# Keep the application dependencies reproducible after task merges. Lifecycle
# scripts must run so native modules such as better-sqlite3 are usable.
npm ci --no-audit --no-fund

# Keep the local Python/ASR environment aligned with the committed lockfile.
uv sync --locked --no-install-project