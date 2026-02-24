# GitHub Actions CI Quality Gates Skill

Use this skill for GitHub Actions workflows, CI checks, branch protections, and release quality gates.

## Goals
- Make CI deterministic and fast enough to trust.
- Enforce meaningful quality gates before merge/deploy.
- Reduce flaky checks and unclear pipeline failures.

## Workflow
1. Inspect existing workflows and triggers (`push`, `pull_request`, tags).
2. Identify current gates (lint, test, build, security, coverage).
3. Propose or implement missing gates with minimal duplication.
4. Ensure clear failure output and artifact/log visibility.
5. Validate branch-protection compatibility (required checks naming).

## Quality Gate Baseline
- Lint / format validation
- Unit tests
- Build verification
- Optional: typecheck, integration tests, security scan

## Output Rules
- Prefer concrete workflow YAML edits with rationale.
- Name checks consistently for branch protection.
- Call out runtime cost tradeoffs (slow vs blocking vs non-blocking jobs).

## Guardrails
- Do not add expensive gates without noting CI time impact.
- Avoid secrets leakage in workflow logs.
- Avoid duplicate jobs across multiple workflow files unless intentional.
