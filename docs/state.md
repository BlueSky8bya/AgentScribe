<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# Runtime State (Blackboard)

> Read first at session start. Agents update after work.

## Current state

| Field | Value |
|---|---|
| current_phase | Phase 1 (MVP) — foundation data & seed IMPLEMENTED |
| design_status | Pipeline Foundation v001 APPROVED 2026-06-08, archived |
| phase1_status | APPROVED + implemented 2026-06-08 (build/lint/test pass) |
| active_task | none (Phase 2 needs its own proposal) |
| director_status | idle |
| planner_status | idle |
| writer_status | idle |
| qa_status | idle |
| last_updated | 2026-06-08 |

## Phase 1 delivered

- `src/core/schemas/*` (9 zod schemas), `store/` (StoreAdapter + LocalStore), `firewall/contextPackager`, `preflight/basicBlueprint`, `obs/span`, `createWork`.
- `src/ui/NewWorkWizard` (4-step) mounted in `App.tsx`.
- `tests/` (5 tests pass): schema valid/invalid, save→load round-trip, firewall private-exclusion.
- `npm test` / `npm run build` / `npm run lint` all green.

## Phase 1 scope (approved)

Seed + Authorial Intent + Narrative Shape + basic Blueprint/Episode Card storage; MVP-required schemas only (`docs/schemas.md`); Prompt Firewall "no private/secret to Writer" rule from day one. Craft Trait / Character-Cast detail / Creative Review / Reader Probe / operational architecture = direction only (see `docs/backlog.md`).

## Next

Phase 1 implementation needs its own proposal (DOC BEFORE CODE, constitution §3).

> State enum (idle/working/blocked/done) to be formalized in schemas.
