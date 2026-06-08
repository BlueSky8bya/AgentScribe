<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_phase2_editorial_room_v001.md] Phase 2 (approved + implemented) -->
# Runtime State (Blackboard)

> Read first at session start. Agents update after work.

## Current state

| Field | Value |
|---|---|
| current_phase | Phase 2 — Editorial Room / Preflight IMPLEMENTED |
| design_status | Pipeline Foundation v001 APPROVED 2026-06-08, archived |
| phase1_status | done 2026-06-08 (foundation data and seed) |
| phase2_status | done 2026-06-08 (design assets, deterministic gates/canary, lock, doc-lang guard) |
| active_task | none (Phase 3 needs its own proposal) |
| director_status | idle |
| planner_status | idle |
| writer_status | idle |
| last_updated | 2026-06-08 |

## Phase 2 delivered

- Schemas: CharacterBible, CastEntry, Relationship, RevealItem, ThemeLedger, Foreshadow, CraftSelection (stub); SeriesBlueprint/EpisodeCard extended; WorkRecord 0.2.0 + `migrateWork` (0.1.0 -> 0.2.0).
- Preflight (deterministic, no LLM): `candidateGates`, `schemaCanary`, `lockBlueprint` (Hard/Soft/Fluid; pure warns need acknowledge), `revisionImpact`; `editorialRoom` orchestration.
- UI: `PreflightRoom` (gate results, acknowledge, lock button); Wizard -> Preflight Room routing.
- Guard: `scripts/check-doc-lang.mjs` wired into `npm run lint` (agent-facing files must be English).
- Tests: 21 pass. `npm test` / `npm run build` / `npm run lint` all green.

## Out of scope (deferred)

LLM gates (Phase 5 semantic axes), Scene Board (Phase 4), episode generation, Creative Review, Cast Promotion automation. See `docs/backlog.md`.

## Next

Phase 3 (Director + episode loop + Creation/Promotion Gate + model_router + firewall routing) needs its own proposal (DOC BEFORE CODE, constitution section 3).

> State enum (idle/working/blocked/done) to be formalized in schemas.
