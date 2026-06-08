<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_auto_verify_commit_push_v001.md] Auto verify/commit/push (approved) -->
# Runbook — Operations & Recovery

> Agent-facing operational procedures. Concise English (constitution §2).

## Code Change Checklist (constitution §9 detail)

**Scope:** code changes inside an `APPROVE: proceed` approved scope. (Exploration, reading, and proposal writing are out of scope.)

**Verify (in order; all must pass before commit):**
1. Add a `[PROPOSAL: <doc> §<n>] <reason>` traceability comment at the change site (§3.1).
2. Update the related design `.md` in the same change (DOC BEFORE CODE).
3. `npm run build` passes.
4. `npm run lint` passes.
5. `npm test` passes (if tests exist; add tests for new logic).

**Commit unit:** one per code change by default. Small, related changes inside the same approved scope MAY be grouped into one verification unit (avoid commit sprawl).

**Commit:**
6. `git status` — confirm changed files; do NOT stage/commit files outside the approved scope.
7. Confirm the diff contains no `.env`, secret, API key, token, or bulk story-text logs.
8. `git add <specific files>` → review `git diff --cached` → `git commit` (Conventional Commits).

**Push (auto, only when ALL hold):**
9. Current branch is not `main`/`master`, OR is a branch the user explicitly allowed. (This repo: `main` is the explicitly-allowed branch.)
10. Verify steps 3–5 pass and the secret check (7) passes.
11. `git push origin <branch>`. NO force push.

**Push failure:** on network/permission failure, do NOT retry in a loop — report the local-commit state and the failure cause, then stop.

**Verify failure:** if build/lint/test fails, do not commit or push; fix the root cause and retry.

## Session start

1. Read `docs/state.md` — current state.
2. Read `docs/world_bible.json` — world/canonical.
3. Skim `docs/backlog.md`.
4. Check the last unfinished task.
5. If changes are needed, enter the Ouroboros protocol.

## Rollback

- Proposal-level: see `docs/proposals/archive/YYYY-MM-DD/`.
- State-level: see `docs/state_snapshots/YYYY-MM-DD/`.

## Incident response

| Situation | Action |
|---|---|
| Same error twice | Stop editing; report option A/B (constitution). |
| Garbled Korean file | Verify/fix UTF-8 first. |
| Doc–code mismatch | Stop both; fix the doc first. |

> Build/run/deploy commands: PENDING.
