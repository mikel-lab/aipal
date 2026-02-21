#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BOT_NAME="${BOT_NAME:-aipal-bot}"
PM2_BIN="${PM2_BIN:-$ROOT_DIR/node_modules/.bin/pm2}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"

if [[ ! -x "$PM2_BIN" || -z "$NODE_BIN" ]]; then
  echo "errored"
  exit 0
fi

STATUS="$(
  { "$PM2_BIN" jlist 2>/dev/null || echo "__PM2_JLIST_ERROR__"; } | "$NODE_BIN" -e '
let data = "";
process.stdin.on("data", chunk => data += chunk);
process.stdin.on("end", () => {
  const name = process.argv[1];
  if (data.trim() === "__PM2_JLIST_ERROR__") {
    process.stdout.write("errored");
    return;
  }
  try {
    const list = JSON.parse(data || "[]");
    const proc = list.find(p => p.name === name);
    const raw = proc?.pm2_env?.status || "missing";
    if (raw === "online") process.stdout.write("online");
    else if (raw === "stopped") process.stdout.write("stopped");
    else if (raw === "missing") process.stdout.write("missing");
    else process.stdout.write("errored");
  } catch {
    process.stdout.write("errored");
  }
});' "$BOT_NAME"
)"

echo "$STATUS"
