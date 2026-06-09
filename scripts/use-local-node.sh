#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$ROOT_DIR/.tools/bin:$PATH"

echo "Local Node: $(node --version)"
echo "Local npm: $(npm --version)"
echo "Run commands from this shell, for example: npm run dev"
