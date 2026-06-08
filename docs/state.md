<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_phase2_editorial_room_v001.md] Phase 2 (approved + implemented) -->
# Runtime State (Blackboard)

> Read first at session start. Agents update after work.

## Current state

| Field | Value |
|---|---|
| current_phase | Phase 3A — minimal seed + auto-expansion (deterministic) IMPLEMENTED |
| design_status | Pipeline Foundation v001 APPROVED 2026-06-08, archived |
| phase1_status | done 2026-06-08 (foundation data and seed) |
| phase2_status | done 2026-06-08 (design assets, deterministic gates/canary, lock, doc-lang guard) |
| phase3a_status | done 2026-06-08 (minimal seed, scale guard, rule-based expander, mixed-initiative review) |
| active_task | none (Phase 3B = LLM + server model_router needs its own proposal) |
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

## Phase 3A delivered

- Minimal seed wizard (title/genre/mood/background/characters[name,role,gender,brief]/world rules/length). Smart default (genre -> mood), scale picker (single button), advanced fields hidden.
- Scale Consistency Guard: declared vs effective_scale, easy guidance message + override reason (internal fields never shown raw).
- Rule-based expander (`DeterministicExpander`) drafts CharacterBible/Cast/Relationship/Theme/Foreshadow + private backstory drafts (firewalled).
- `bootstrapWork` orchestration; Wizard -> ExpandReview (accept/delete) -> Preflight Room.
- CLAUDE.md section 2: added nontechnical-owner proposal rules.
- Tests: 28 pass (scale, expander, migration 0.3, plus prior).

## Out of scope (deferred)

3B = real LLM expander + Node server model_router (keys server-side only). Scene Board (Phase 4), episode generation, Creative Review, LLM semantic gates (Phase 5).

## Next

Phase 3B (LLM expander + server model_router + firewall routing) needs its own proposal (DOC BEFORE CODE, constitution section 3).

> State enum (idle/working/blocked/done) to be formalized in schemas.
