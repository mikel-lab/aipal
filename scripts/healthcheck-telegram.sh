#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BOT_NAME="${BOT_NAME:-aipal-bot}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
FLAG_FILE="${FLAG_FILE:-/tmp/${BOT_NAME}-down.flag}"
PM2_BIN="${PM2_BIN:-$ROOT_DIR/node_modules/.bin/pm2}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${ALERT_CHAT_ID:-}"

if [[ -z "$CHAT_ID" && -f "$HOME/.config/aipal/config.json" ]]; then
  CHAT_ID="$(node -e 'try{const fs=require("fs");const p=process.env.HOME+"/.config/aipal/config.json";const j=JSON.parse(fs.readFileSync(p,"utf8"));process.stdout.write(String(j.cronChatId||""));}catch{process.stdout.write("");}')"
fi

send_message() {
  local text="$1"
  curl -sS -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=${text}" >/dev/null 2>/dev/null || true
}

if [[ -z "$TOKEN" || -z "$CHAT_ID" ]]; then
  exit 0
fi

if [[ ! -x "$PM2_BIN" || -z "$NODE_BIN" ]]; then
  exit 0
fi

STATUS="$({ "$PM2_BIN" jlist 2>/dev/null || echo "[]"; } | "$NODE_BIN" -e '
let data="";
process.stdin.on("data", c => data += c);
process.stdin.on("end", () => {
  try {
    const list = JSON.parse(data || "[]");
    const name = process.argv[1];
    const proc = list.find(p => p.name === name);
    process.stdout.write(proc?.pm2_env?.status || "missing");
  } catch {
    process.stdout.write("error");
  }
});' "$BOT_NAME")"

if [[ "$STATUS" == "missing" || "$STATUS" == "error" ]]; then
  if pgrep -f "node src/index.js" >/dev/null 2>&1 || pgrep -f "aipal-bot" >/dev/null 2>&1; then
    STATUS="online"
  fi
fi

if [[ "$STATUS" == "online" ]]; then
  if [[ -f "$FLAG_FILE" ]]; then
    rm -f "$FLAG_FILE"
    send_message "✅ ${BOT_NAME} recovered and is online again."
  fi
  exit 0
fi

if [[ ! -f "$FLAG_FILE" ]]; then
  touch "$FLAG_FILE"
  send_message "🚨 ${BOT_NAME} is down (status: ${STATUS}). Check with: npx pm2 logs ${BOT_NAME}"
fi
