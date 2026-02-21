#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BOT_NAME="${BOT_NAME:-aipal-bot}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
PM2_BIN="${PM2_BIN:-$ROOT_DIR/node_modules/.bin/pm2}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
BOT_STATUS_SCRIPT="${BOT_STATUS_SCRIPT:-$ROOT_DIR/scripts/bot-status.sh}"
STATE_FILE="${STATE_FILE:-/tmp/${BOT_NAME}-health.state}"
HEALTHCHECK_AUTORESTART="${HEALTHCHECK_AUTORESTART:-true}"
HEALTHCHECK_RESTART_COOLDOWN_SEC="${HEALTHCHECK_RESTART_COOLDOWN_SEC:-120}"
HEALTHCHECK_MAX_RETRIES="${HEALTHCHECK_MAX_RETRIES:-1}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${ALERT_CHAT_ID:-}"
LAST_STATE="unknown"
LAST_RESTART_EPOCH="0"

ts() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log() {
  local message="$1"
  printf "[%s] %s\n" "$(ts)" "$message"
}

load_state() {
  if [[ -f "$STATE_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$STATE_FILE" || true
  fi
  LAST_STATE="${LAST_STATE:-unknown}"
  LAST_RESTART_EPOCH="${LAST_RESTART_EPOCH:-0}"
}

save_state() {
  cat >"$STATE_FILE" <<EOF
LAST_STATE="${LAST_STATE}"
LAST_RESTART_EPOCH="${LAST_RESTART_EPOCH}"
EOF
}

if [[ -z "$CHAT_ID" && -f "$HOME/.config/aipal/config.json" && -n "$NODE_BIN" ]]; then
  CHAT_ID="$("$NODE_BIN" -e 'try{const fs=require("fs");const p=process.env.HOME+"/.config/aipal/config.json";const j=JSON.parse(fs.readFileSync(p,"utf8"));process.stdout.write(String(j.cronChatId||""));}catch{process.stdout.write("");}')"
fi

send_message() {
  local text="$1"
  curl -sS -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=${text}" >/dev/null 2>/dev/null || true
}

if [[ -z "$TOKEN" || -z "$CHAT_ID" ]]; then
  log "state=disabled reason=missing_telegram_token_or_chat"
  exit 0
fi

if [[ ! -x "$PM2_BIN" || -z "$NODE_BIN" ]]; then
  log "state=disabled reason=missing_pm2_or_node"
  exit 0
fi

if [[ ! -f "$BOT_STATUS_SCRIPT" ]]; then
  log "state=disabled reason=missing_bot_status_script"
  exit 0
fi

load_state

STATUS="$(/bin/bash "$BOT_STATUS_SCRIPT")"

if [[ "$STATUS" == "online" ]]; then
  log "state=online"
  if [[ "$LAST_STATE" == "down" ]]; then
    send_message "✅ ${BOT_NAME} recovered and is online again."
    log "state=recovered"
  fi
  LAST_STATE="online"
  save_state
  exit 0
fi

DOWN_REASON="status_${STATUS}"
if [[ "$STATUS" == "errored" ]]; then
  DOWN_REASON="pm2_unavailable_or_parse_error"
fi
log "state=down reason=${DOWN_REASON}"

if [[ "$LAST_STATE" != "down" ]]; then
  send_message "🚨 ${BOT_NAME} is down (status: ${STATUS}). Auto-heal is enabled. Check logs: npx pm2 logs ${BOT_NAME}"
  log "alert=down_sent"
fi

NOW_EPOCH="$(date +%s)"
COOLDOWN_PASSED="false"
if (( NOW_EPOCH - LAST_RESTART_EPOCH >= HEALTHCHECK_RESTART_COOLDOWN_SEC )); then
  COOLDOWN_PASSED="true"
fi

RESTART_ATTEMPTED="false"
RESTART_RESULT="skipped"
ATTEMPT_COUNT=0

if [[ "$HEALTHCHECK_AUTORESTART" == "true" && "$COOLDOWN_PASSED" == "true" ]]; then
  while (( ATTEMPT_COUNT < HEALTHCHECK_MAX_RETRIES )); do
    ATTEMPT_COUNT="$((ATTEMPT_COUNT + 1))"
    RESTART_ATTEMPTED="true"
    if "$PM2_BIN" restart "$BOT_NAME" >/dev/null 2>&1; then
      LAST_RESTART_EPOCH="$NOW_EPOCH"
      sleep 2
      NEW_STATUS="$(/bin/bash "$BOT_STATUS_SCRIPT")"
      if [[ "$NEW_STATUS" == "online" ]]; then
        send_message "✅ ${BOT_NAME} recovered automatically after watchdog restart."
        log "action=restart result=ok attempt=${ATTEMPT_COUNT}"
        log "state=recovered"
        LAST_STATE="online"
        save_state
        exit 0
      fi
      RESTART_RESULT="ok_but_still_down:${NEW_STATUS}"
      log "action=restart result=${RESTART_RESULT} attempt=${ATTEMPT_COUNT}"
    else
      RESTART_RESULT="failed"
      LAST_RESTART_EPOCH="$NOW_EPOCH"
      log "action=restart result=failed attempt=${ATTEMPT_COUNT}"
    fi
  done
elif [[ "$HEALTHCHECK_AUTORESTART" != "true" ]]; then
  RESTART_RESULT="disabled"
elif [[ "$COOLDOWN_PASSED" != "true" ]]; then
  RESTART_RESULT="cooldown"
fi

LAST_STATE="down"
save_state
log "action=watchdog restart_attempted=${RESTART_ATTEMPTED} restart_result=${RESTART_RESULT} attempts=${ATTEMPT_COUNT}"
