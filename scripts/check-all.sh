#!/usr/bin/env bash
set -euo pipefail

POSTIZ_DIR="/Users/mikelcobian/Repositorios Trabajo/postiz-app"
AIPAL_DIR="/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva"
POSTIZ_URL="https://social.mikelcobian.com"
BOT_NAME="aipal-bot"

ok() { printf "✅ %s\n" "$1"; }
warn() { printf "⚠️  %s\n" "$1"; }
err() { printf "❌ %s\n" "$1"; }

echo "== System checks =="

# 1) Docker daemon + Postiz stack
if docker info >/dev/null 2>&1; then
  ok "Docker daemon reachable"
else
  err "Docker daemon is not reachable (open Docker Desktop)"
fi

if [[ -f "$POSTIZ_DIR/docker-compose.yaml" ]]; then
  if docker compose -f "$POSTIZ_DIR/docker-compose.yaml" ps >/tmp/check-all-postiz-ps.txt 2>&1; then
    if grep -q "postiz" /tmp/check-all-postiz-ps.txt; then
      ok "Postiz stack is present in docker compose"
    else
      warn "Postiz stack not found in compose output"
    fi
  else
    err "Failed to read Postiz docker compose status"
  fi
else
  err "Postiz compose file not found at $POSTIZ_DIR/docker-compose.yaml"
fi

# 2) Public Postiz URL
HTTP_CODE="$(curl -sS -o /dev/null -w "%{http_code}" "$POSTIZ_URL" || true)"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "307" || "$HTTP_CODE" == "302" ]]; then
  ok "Postiz URL reachable ($POSTIZ_URL -> HTTP $HTTP_CODE)"
else
  err "Postiz URL unreachable ($POSTIZ_URL -> HTTP $HTTP_CODE)"
fi

# 3) cloudflared tunnel
if pgrep -f "cloudflared tunnel run --token" >/dev/null 2>&1; then
  ok "Stable cloudflared tunnel process is running"
else
  err "Stable cloudflared tunnel process is NOT running"
fi

# 4) PM2 daemon + bot
cd "$AIPAL_DIR"
if npx pm2 status >/tmp/check-all-pm2-status.txt 2>&1; then
  ok "PM2 is available"
  if grep -q "$BOT_NAME" /tmp/check-all-pm2-status.txt && grep -q "online" /tmp/check-all-pm2-status.txt; then
    ok "Bot $BOT_NAME is online"
  else
    err "Bot $BOT_NAME is not online (run: npx pm2 restart $BOT_NAME)"
  fi
else
  err "PM2 status command failed"
fi

echo "== Done =="
