#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$ROOT_DIR/.data/db" "$ROOT_DIR/.data/logs"

exec "$ROOT_DIR/.tools/mongodb/bin/mongod" \
  --dbpath "$ROOT_DIR/.data/db" \
  --logpath "$ROOT_DIR/.data/logs/mongod.log" \
  --bind_ip 127.0.0.1 \
  --port 27017
