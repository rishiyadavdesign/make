#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$ROOT_DIR/.tools/bin:$PATH"

if [[ ! -x "$ROOT_DIR/.tools/bin/node" ]]; then
  echo "Local Node is missing. Install dependencies first."
  exit 1
fi

if [[ ! -x "$ROOT_DIR/.tools/mongodb/bin/mongod" ]]; then
  echo "Local MongoDB is missing. Run the MongoDB install step first."
  exit 1
fi

if ! lsof -nP -iTCP:27017 -sTCP:LISTEN >/dev/null 2>&1; then
  "$ROOT_DIR/scripts/start-mongo.sh" &
  echo "Started MongoDB on 127.0.0.1:27017"
else
  echo "MongoDB is already running on 27017"
fi

exec npm run dev
