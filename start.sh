#!/usr/bin/env bash
# Start the Stint Interview Ready Check server.
# Usage: ./start.sh            -> production (node server.js)
#        ./start.sh --dev      -> auto-restart on file changes (node --watch)
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is not installed. Install Node.js >= 18 first." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "No .env found. Creating one from .env.example ..."
  cp .env.example .env
  echo "Edit .env and set GEMINI_API_KEY before using the AI review." >&2
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies ..."
  npm install
fi

PORT="${PORT:-$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2 || true)}"
PORT="${PORT:-3000}"

echo "Starting server on http://localhost:${PORT}"
if [ "${1:-}" = "--dev" ]; then
  exec npm run dev
else
  exec npm start
fi
