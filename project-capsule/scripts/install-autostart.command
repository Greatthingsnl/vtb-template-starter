#!/bin/bash
# Installeert een LaunchAgent zodat Project Capsule automatisch start bij inloggen.
# Dubbelklik dit bestand om te activeren.
set -eu

cd "$(cd "$(dirname "$0")" && pwd)/.."
APP_ROOT="$(pwd)"
AGENT_LABEL="nl.projectcapsule.agent"
PLIST="$HOME/Library/LaunchAgents/${AGENT_LABEL}.plist"
LOGS_DIR="$APP_ROOT/logs"

mkdir -p "$LOGS_DIR"
mkdir -p "$HOME/Library/LaunchAgents"

# Zoek node
NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
  for CANDIDATE in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$CANDIDATE" ]; then NODE_BIN="$CANDIDATE"; break; fi
  done
fi
if [ -z "$NODE_BIN" ]; then
  echo "❌  Node.js niet gevonden. Installeer via https://nodejs.org"
  read -p "Druk op Enter om te sluiten." _
  exit 1
fi

# Installeer afhankelijkheden als nodig
if [ ! -d node_modules ]; then
  echo "→  Afhankelijkheden installeren…"
  npm install --silent
fi

# Schrijf de plist
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${APP_ROOT}/server.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${APP_ROOT}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOGS_DIR}/capsule.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOGS_DIR}/capsule.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
PLIST

# Stop een eventueel oudere versie en herlaad
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo ""
echo "✓  Project Capsule auto-start geïnstalleerd."
echo "   Plist:   $PLIST"
echo "   Logs:    $LOGS_DIR"
echo ""
echo "   De server draait vanaf nu automatisch bij elke login."
echo "   Stoppen/verwijderen? Dubbelklik scripts/uninstall-autostart.command"
echo ""

# Wacht tot hij online is en open de browser
PORT=$(node -e "try{const c=require('./data/config.json');process.stdout.write(String(c.port||4321));}catch(e){process.stdout.write('4321');}")
for i in $(seq 1 40); do
  if curl -sf "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
    open "http://localhost:${PORT}"
    break
  fi
  sleep 0.25
done

read -p "Druk op Enter om dit venster te sluiten." _
