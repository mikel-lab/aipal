#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-mikel-lab/spendly}"

ensure_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  gh label create "$name" --repo "$REPO" --color "$color" --description "$description" --force >/dev/null
  printf 'label ok: %s\n' "$name"
}

ensure_label "audit:code" "1D76DB" "Created or updated by code audit cron"
ensure_label "audit:ui" "5319E7" "Created or updated by UI quality audit cron"
ensure_label "audit:security" "B60205" "Created or updated by security audit cron"

ensure_label "agent:ready" "0E8A16" "Approved for autonomous agent execution"
ensure_label "agent:in-progress" "FBCA04" "Currently being worked by the autonomous agent"
ensure_label "agent:managed" "C2E0C6" "PR or issue managed by the autonomous agent"
ensure_label "agent:ci-failed" "D93F0B" "Managed PR failed CI and needs retry/fix"
ensure_label "agent:blocked" "E99695" "Blocked by ambiguity, conflict, or external dependency"
ensure_label "agent:needs-human" "7057FF" "Needs human decision or unsafe for autonomous changes"

ensure_label "priority:high" "B60205" "High priority issue"
ensure_label "priority:medium" "FBCA04" "Medium priority issue"
ensure_label "priority:low" "0E8A16" "Low priority issue"

ensure_label "type:bug" "D73A4A" "Behavioral bug or regression"
ensure_label "type:refactor" "A2EEEF" "Refactor or cleanup task"
ensure_label "type:ui" "C5DEF5" "UI/UX quality issue"
ensure_label "type:security" "B60205" "Security hardening or exposure issue"
