# Social Postiz Ops Skill

Use this skill for Postiz setup, channel integrations, TikTok/X posting flows, and operational troubleshooting.

## Goals
- Keep publishing workflows reliable and reproducible.
- Distinguish clearly between app config, provider permissions, and runtime issues.
- Guide the user step by step when UI actions are required.

## Workflow
1. Check runtime prerequisites (Docker, Postiz container, tunnel/public URL).
2. Check provider-side setup (TikTok app products/scopes/redirects, X OAuth settings).
3. Validate Postiz channel/auth state.
4. Reproduce issue with the smallest end-to-end test.
5. Summarize exact blocker and next user action.

## Output Rules
- Prefer checklist-style guidance for dashboard steps.
- When discussing TikTok review/sandbox, separate "platform requirement" from "Postiz limitation".
- Use exact URLs/redirect URIs when relevant.

## Guardrails
- Never claim a post was published if provider returned a permission error.
- Do not assume external OAuth apps are configured correctly without verification.
