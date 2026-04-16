#!/bin/bash
# Project Capsule launcher — dubbelklik dit bestand om de tool te starten.
# Opent automatisch je browser zodra de server draait.
set -eu

# Ga naar de project-capsule map (één niveau boven scripts/).
cd "$(cd "$(dirname "$0")" && pwd)/.."
APP_ROOT="$(pwd)"

# Mooi venster-label in Terminal
echo -ne "\033]0;Project Capsule\007"
cat <<'BANNER'
  ____            _           _     ____                        _
 |  _ \ _ __ ___ (_) ___  ___| |_  / ___|__ _ _ __  ___ _   _| | ___
 | |_) | '__/ _ \| |/ _ \/ __| __|| |   / _` | '_ \/ __| | | | |/ _ \
 |  __/| | | (_) | |  __/ (__| |_ | |__| (_| | |_) \__ \ |_| | |  __/
 |_|   |_|  \___// |\___|\___|\__| \____\__,_| .__/|___/\__,_|_|\___|
               |__/                           |_|
BANNER

# Zoek een bruikbare node
if ! command -v node >/dev/null 2>&1; then
  for CANDIDATE in /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.nvm/versions/node/*/bin/node"; do
    if [ -x "$CANDIDATE" ]; then PATH="$(dirname "$CANDIDATE"):$PATH"; break; fi
  done
fi
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "❌  Node.js is niet gevonden."
  echo "    Installeer via https://nodejs.org of met Homebrew: brew install node"
  echo ""
  read -p "Druk op Enter om te sluiten." _
  exit 1
fi

# Lees de poort uit data/config.json (default 4321)
PORT=$(node -e "try{const c=require('./data/config.json');process.stdout.write(String(c.port||4321));}catch(e){process.stdout.write('4321');}")

# Installeer dependencies als nodig
if [ ! -d node_modules ]; then
  echo ""
  echo "→  Eerste keer opstarten — afhankelijkheden installeren…"
  npm install --silent
fi

# Draait hij al? Dan alleen browser openen.
if curl -sf "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
  echo ""
  echo "✓  Project Capsule draait al op http://localhost:${PORT}"
  echo "   Browser openen…"
  open "http://localhost:${PORT}"
  sleep 1
  exit 0
fi

echo ""
echo "→  Starten op http://localhost:${PORT}"
echo "   Sluit dit venster of druk Ctrl-C om te stoppen."
echo ""

# Open browser zodra de server reageert (met kleine timeout).
(
  for i in $(seq 1 40); do
    if curl -sf "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
      open "http://localhost:${PORT}"
      exit 0
    fi
    sleep 0.25
  done
) &

exec node server.js
