# AI Implementation Playbook (Plan → Implement → Review → Fix)

## 0. Purpose

Systematize AI-assisted development so quality remains stable across all phases:
- Planning
- Implementation
- Review
- Fixing

Focus principles:
- DRY (single source of truth, no duplicated logic)
- KISS (minimum moving parts, explicit control flow)

## 1. Community-Informed Operating Principles

Based on broadly shared engineering practices from developer communities and platform docs:
- Keep changes small and focused for better review quality.
- Prefer explicit, deterministic behavior over adaptive complexity.
- Do not rely on client-side checks as security boundaries.
- Treat AI suggestions as drafts; always validate by tests and manual scenarios.

## 2. Stage-by-Stage Protocol

### 2.1 Planning Stage

Required outputs:
1. Problem statement (symptom, impact, reproducibility)
2. Root-cause hypotheses (ranked)
3. Minimal design (KISS) with one primary decision path
4. DRY map (which function/file is SSOT)
5. Verification matrix (success/failure/regression)
6. Rollback strategy

Planning guardrails:
- No speculative abstractions.
- No future-proofing without immediate use case.
- State transitions must be listed explicitly.

### 2.2 Implementation Stage

Rules:
1. Small commits, one concern per commit.
2. One condition function per critical behavior (e.g., stop detection).
3. Remove obsolete branches instead of stacking new ones.
4. No temporary debug leftovers in final diff.
5. Maintain backward compatibility for persisted data.

### 2.3 Review Stage

Review checklist (mandatory):
1. Correctness: Does code satisfy exact user intent?
2. Simplicity: Can behavior be explained in one paragraph?
3. Duplication: Any duplicated conditions/constants/branches?
4. State safety: Any stuck states or unreachable transitions?
5. Failure behavior: Permissions/network/storage errors handled?
6. Web constraints: Client-side anti-cheat and APIs not over-trusted?

### 2.4 Fix Stage

Fix protocol:
1. Reproduce with minimal scenario.
2. Identify single faulty decision point.
3. Apply smallest possible correction first.
4. Re-run full verification matrix.
5. Document what changed and why previous logic failed.

## 3. KISS/DRY Enforcement Checklist

Before merge, all answers must be YES:
1. One SSOT function per critical rule exists.
2. Critical rule has one timer path and one finalize path.
3. State transition graph is finite and explicit.
4. No hidden fallback that changes normal UX behavior.
5. Error handling exists for browser permission-sensitive APIs.
6. Inputs from storage/network are type-normalized.

## 4. Web-App Specific Risk Controls

1. Clipboard/Web Share:
- Must handle unsupported/denied paths without crash.

2. Input measurement:
- Prevent race conditions by re-checking latest state at timer fire.

3. Storage:
- Parse and normalize all persisted numeric fields.

4. Security:
- Client validation is UX aid, not trust boundary.

## 5. Minimal Artifact Requirements per Task

Every task should leave:
1. Plan note
2. Code diff
3. Verification evidence (`lint`, `build`, manual checks)
4. Known limitations

## 6. Reference Policy (for this repo)

At the start of each new substantial task, reference:
- `docs/AI-Implementation-Playbook.md`
- task-specific plan doc (e.g., scroll-stop refactor plan)

This keeps behavior consistent across turns and reduces regressions.

## 7. External References (Community / Docs)

- GitHub Docs: Copilot review and PR workflow guidance
  - https://docs.github.com/en/copilot/tutorials/optimize-code-reviews
  - https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/drive-downstream-impact/accelerate-pull-requests
- Atlassian (PR writing/review quality practices)
  - https://www.atlassian.com/blog/git/written-unwritten-guide-pull-requests
- Stack Overflow discussion (KISS/YAGNI distinctions in practice)
  - https://stackoverflow.com/questions/25999724/whats-the-difference-between-principles-yagni-and-kiss
- MDN Clipboard API security constraints
  - https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
  - https://developer.mozilla.org/docs/Web/API/Clipboard_API
- OWASP proactive control on validation/trust boundaries
  - https://top10proactive.owasp.org/the-top-10/c3-validate-input-and-handle-exceptions/
