# Git Workflow Skill

Use this skill for branch strategy, commit hygiene, PR preparation, conflict handling, and safe Git operations during development.

## Goals
- Keep history understandable and review-friendly.
- Minimize destructive actions and accidental data loss.
- Match the team's branch/PR conventions.

## Workflow
1. Inspect repo state (`status`, branch, staged/unstaged changes).
2. Separate user changes from task-specific changes.
3. Propose safe commands for branching, commits, and sync.
4. Prepare PR-ready changes (clear commits, test notes, risk summary).
5. Handle conflicts conservatively with explicit file review.

## Output Rules
- Prefer non-destructive commands.
- State assumptions before using potentially risky Git commands.
- When reviewing, prioritize bugs/regressions over style notes.

## Guardrails
- Never use destructive commands (`reset --hard`, force push, checkout --`) unless explicitly requested.
- Do not rewrite user history without approval.
- Do not revert unrelated local changes.
