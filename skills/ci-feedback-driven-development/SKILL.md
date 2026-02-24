# CI Feedback-Driven Development Skill

Use this skill when iterating on a change by repeatedly using CI/test/build feedback to converge on a stable solution.

## Goals
- Shorten debug loops using the most informative failing signal first.
- Convert CI output into precise next actions.
- Avoid random edits when failures are already diagnostic.

## Workflow
1. Start from the first failing check (not all failures at once).
2. Extract exact failure signal (error message, file, stack, check name).
3. Form the smallest hypothesis and patch only that scope.
4. Re-run the narrowest relevant check locally when possible.
5. Repeat until green, then run broader validation.

## Output Rules
- Report observed CI facts before proposing fixes.
- Keep a clear loop: failure -> hypothesis -> change -> validation.
- Mention when a failure is likely unrelated/pre-existing.

## Guardrails
- Do not bundle unrelated fixes into one patch during CI triage.
- Do not mark something fixed without a verification step.
- Escalate if CI flakiness is suspected instead of overfitting code changes.
