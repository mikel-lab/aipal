# Secrets & Keys Hygiene Skill

Use this skill when working with API keys, tokens, credentials, `.env` files, OAuth secrets, or repository security hygiene.

## Goals
- Prevent accidental secret exposure.
- Keep credentials out of git history and logs.
- Propose safe rotation/remediation steps when leakage risk exists.

## Workflow
1. Identify where secrets may exist (code, docs, screenshots, logs, `.env`, CI config).
2. Classify risk: exposed, likely exposed, local-only, unknown.
3. Recommend the smallest safe remediation:
   - move to env vars / secret manager
   - redact from docs/logs
   - rotate compromised credentials
   - add `.gitignore` protection
4. If a secret may have been committed, explain rotation + history cleanup options.
5. Confirm what can/cannot be automated safely.

## Output Rules
- Prioritize risk findings first.
- Be explicit about whether rotation is required.
- Never print or echo sensitive values back.

## Guardrails
- Do not reveal, transform, or restate secrets.
- Do not commit secrets.
- Do not assume a secret is safe just because it is in a private repo.
