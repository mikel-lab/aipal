# Aipal Runbook (Local Ops)

## Paths
- Repo: `/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva`
- Postiz: `/Users/mikelcobian/Repositorios Trabajo/postiz-app`
- Public URL: `https://social.mikelcobian.com`

## Start/Health
```bash
# Bot status
cd "/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva"
npx pm2 status
/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva/scripts/bot-status.sh

# Full system check (Docker + Postiz + tunnel + PM2)
/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva/scripts/check-all.sh
```

Expected parser output from `bot-status.sh`: `online|stopped|missing|errored`.

## Bot Operations
```bash
cd "/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva"

# Logs
npx pm2 logs aipal-bot

# Restart bot
npx pm2 restart aipal-bot

# Restore saved PM2 processes
npx pm2 resurrect
```

## Watchdog Behavior (Healthcheck)
- Script: `scripts/healthcheck-telegram.sh`
- Trigger: cron every 2 minutes
- Behavior:
  - If bot is `online`: no alert spam.
  - If bot moves to down state: sends one `DOWN` alert.
  - If auto-restart succeeds: sends one `RECOVERED` alert.
  - While state is unchanged (still down or still up): no repeated alerts.
- Auto-restart controls from `.env`:
  - `HEALTHCHECK_AUTORESTART=true`
  - `HEALTHCHECK_RESTART_COOLDOWN_SEC=120`
  - `HEALTHCHECK_MAX_RETRIES=1`

## Healthcheck Log Taxonomy
```bash
tail -n 100 /tmp/aipal-healthcheck.log
```
You should see lines like:
- `state=down reason=status_stopped`
- `state=down reason=pm2_unavailable_or_parse_error`
- `action=restart result=ok attempt=1`
- `action=restart result=ok_but_still_down:stopped attempt=1`
- `state=recovered`

## Postiz Operations
```bash
docker compose -f "/Users/mikelcobian/Repositorios Trabajo/postiz-app/docker-compose.yaml" ps
docker compose -f "/Users/mikelcobian/Repositorios Trabajo/postiz-app/docker-compose.yaml" up -d
docker logs --tail 200 postiz
```

## Tunnel Check
```bash
ps -ax | grep cloudflared
curl -I https://social.mikelcobian.com
```

Expected: `cloudflared tunnel run --token ...` active and URL returns `307` or `200`.

## Recovery After Reboot
1. Open Docker Desktop and wait until running.
2. Run:
```bash
/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva/scripts/check-all.sh
```
3. If bot is down:
```bash
cd "/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva"
npx pm2 resurrect
npx pm2 restart aipal-bot
```
4. Validate tunnel:
```bash
ps -ax | grep cloudflared
curl -I https://social.mikelcobian.com
```
5. Validate Telegram by sending `/start` or any message.

## Alerts
- Cron (every 2 min):
```bash
crontab -l
```
- Expected alert flow:
  - one `🚨 ... is down ...`
  - one `✅ ... recovered ...`
  - no repetitive heartbeats

## Incident Checklist
1. Check PM2:
```bash
cd "/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva"
npx pm2 status
/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva/scripts/bot-status.sh
```
2. Check cloudflared:
```bash
ps -ax | grep cloudflared
```
3. Check Postiz public URL:
```bash
curl -I https://social.mikelcobian.com
```
4. Tail watchdog logs:
```bash
tail -n 150 /tmp/aipal-healthcheck.log
```

## If Alert Repeats
- Repeated `DOWN` usually means restart cannot recover root cause.
- Run:
```bash
cd "/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva"
npx pm2 logs aipal-bot --lines 200
```
- Then validate in order:
  1. PM2 daemon is alive (`npx pm2 status`).
  2. Bot process exists (`bot-status.sh` not `missing`).
  3. Tunnel process is running.
  4. Postiz URL responds (`200/302/307`).

## Known Caveat
- `terms-documentation` is currently committed as embedded git repo (gitlink/submodule-like entry). If needed, convert to normal folder in a future commit.
