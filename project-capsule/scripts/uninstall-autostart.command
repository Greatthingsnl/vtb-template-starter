#!/bin/bash
# Verwijdert de Project Capsule LaunchAgent.
set -eu

AGENT_LABEL="nl.projectcapsule.agent"
PLIST="$HOME/Library/LaunchAgents/${AGENT_LABEL}.plist"

if [ -f "$PLIST" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "✓  Auto-start verwijderd ($PLIST)."
else
  echo "ℹ  Geen auto-start geïnstalleerd. Niets te doen."
fi

# Probeer ook een eventueel draaiende instantie te stoppen
PID=$(pgrep -f "node.*project-capsule/server.js" || true)
if [ -n "$PID" ]; then
  echo "→  Actieve server stoppen (PID $PID)…"
  kill "$PID" 2>/dev/null || true
fi

read -p "Druk op Enter om te sluiten." _
