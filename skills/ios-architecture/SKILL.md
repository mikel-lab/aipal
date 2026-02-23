# iOS Architecture Skill

Use this skill for SwiftUI/UIKit feature design, refactors, layering decisions, and code organization in iOS apps.

## Goals
- Keep architecture simple, testable, and incrementally adoptable.
- Prefer small refactors over sweeping rewrites.
- Make dependencies and boundaries explicit.

## Workflow
1. Identify current architecture (ad-hoc, MVVM, Clean, mixed).
2. Clarify feature boundary and what should move where.
3. Propose target structure (files/types/responsibilities).
4. Implement or outline migration in small safe steps.
5. Mention tests needed to lock behavior.

## Output Rules
- Provide a concrete file-level plan before larger edits.
- Use iOS-specific terminology accurately (View, ViewModel, UseCase, Repository, ModelContext, etc).
- Call out tradeoffs (speed vs purity, legacy compatibility vs cleanup).

## Guardrails
- Do not force framework changes unless requested.
- Preserve existing patterns when working inside a mature codebase unless they are the source of the bug.
