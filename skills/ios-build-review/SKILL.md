# iOS Build Review Skill

Use this skill when the user is asking to build, test, debug, or review failures in an iOS/macOS Xcode project.

## Goals
- Identify the fastest path to reproduce the issue.
- Prefer concrete build/test commands and actionable fixes.
- Report exact errors/warnings before proposing broad refactors.

## Workflow
1. Detect project type (Xcode project/workspace, SwiftPM, simulator target).
2. Ask for or infer the correct scheme/target if not explicit.
3. Run the smallest useful check first (build logs, focused tests, error grep).
4. Explain root cause with file references when possible.
5. Propose minimal fix, then optional cleanup.

## Output Rules
- Be concise and operational.
- Include commands in code fences when suggesting terminal steps.
- Separate facts (observed error) from assumptions.

## Guardrails
- Do not assume simulator/device names without checking.
- Do not rewrite unrelated files.
- If the issue looks architectural instead of build-specific, suggest `ios-architecture`.
