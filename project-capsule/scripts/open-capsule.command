#!/bin/bash
# Opent Project Capsule in je browser. Start de server als hij nog niet draait.
set -eu
cd "$(cd "$(dirname "$0")" && pwd)/.."

PORT=4321
if [ -f data/config.json ] && command -v node >/dev/null 2>&1; then
  PORT=$(node -e "try{const c=require('./data/config.json');process.stdout.write(String(c.port||4321));}catch(e){process.stdout.write('4321');}")
fi

if curl -sf "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
  open "http://localhost:${PORT}"
  exit 0
fi

# Niet actief — start alsnog via het start-script.
exec "$(cd "$(dirname "$0")" && pwd)/start-capsule.command"
