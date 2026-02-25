# Spendly-iOS Cron Automation (Aipal)

This setup installs four Aipal cron jobs for `Spendly-iOS`:

- `spendly-audit-code` (`06:00`)
- `spendly-audit-ui` (`07:00`)
- `spendly-audit-security` (`08:00`)
- `spendly-issue-worker` (`09:00` then every 2h)

Timezone default: `Europe/Madrid`.

## What is versioned in this repo
- Prompt templates for each cron under `prompts/spendly-ios/`
- Cron job definitions/upsert logic in `src/spendly-ios-automation.js`
- Bootstrap script for `~/.config/aipal/cron.json`
- GitHub label bootstrap script for `mikel-lab/spendly`

## Install cron jobs into Aipal config
```bash
cd "/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva"
node scripts/setup-spendly-ios-crons.js
```

Optional (if you already know the topic ids):
```bash
node scripts/setup-spendly-ios-crons.js \
  --chat-id <telegram_chat_id> \
  --code-topic <topic_id> \
  --ui-topic <topic_id> \
  --security-topic <topic_id> \
  --worker-topic <topic_id>
```

Dry run:
```bash
node scripts/setup-spendly-ios-crons.js --dry-run
```

## Create/update GitHub labels
```bash
cd "/Users/mikelcobian/Repositorios Trabajo/IA/Asistente-codex-leiva"
scripts/ensure-spendly-ios-labels.sh
```

## Telegram topic setup (manual)
Create these 4 topics in the cron chat:
- `Spendly Audit Code`
- `Spendly Audit UI`
- `Spendly Audit Security`
- `Spendly Issue Worker`

Inside each topic:
```text
/agent codex
/workspace set /Users/mikelcobian/Repositorios Trabajo/Spendly-iOS
/skill auto off
```

Assign each cron from inside its topic:
```text
/cron assign spendly-audit-code
/cron assign spendly-audit-ui
/cron assign spendly-audit-security
/cron assign spendly-issue-worker
```

Then reload crons once:
```text
/cron reload
```

## Notes
- The issue worker merges PRs itself (merge commit) after CI tests pass.
- No GitHub auto-merge workflow is required for this flow.
- The worker prioritizes retaking open agent-managed PRs before taking a new issue.
