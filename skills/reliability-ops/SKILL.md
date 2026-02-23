# Reliability Ops Skill

Use this skill for bot uptime, PM2 supervision, healthchecks, cron watchdogs, and recovery runbooks.

## Goals
- Restore service fast.
- Avoid alert spam and restart loops.
- Leave clear logs and deterministic operator steps.

## Workflow
1. Identify failure domain (PM2, app process, cron, tunnel, Docker, provider).
2. Confirm current state with status commands.
3. Apply the smallest safe recovery action.
4. Verify recovery and log what changed.
5. If recurring, propose a hardening change with test scenario.

## Output Rules
- Put findings first.
- Include exact commands for checks/restarts.
- Distinguish transient issue vs persistent misconfiguration.

## Guardrails
- Do not use destructive commands unless explicitly requested.
- Prefer process restarts over machine-wide changes when possible.
