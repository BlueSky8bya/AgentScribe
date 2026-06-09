<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_phase2_editorial_room_v001.md] Phase 2 (approved + implemented) -->
# Runtime State (Blackboard)

> Read first at session start. Agents update after work.

## Current state

| Field | Value |
|---|---|
| current_phase | Phase 3C-2 — live Claude + Gemini adapters (gated; DeepSeek deferred) IMPLEMENTED |
| design_status | Pipeline Foundation v001 APPROVED 2026-06-08, archived |
| phase1_status | done 2026-06-08 (foundation data and seed) |
| phase2_status | done 2026-06-08 (design assets, deterministic gates/canary, lock, doc-lang guard) |
| phase3a_status | done 2026-06-08 (minimal seed, scale guard, rule-based expander, mixed-initiative review) |
| phase3b_status | done 2026-06-09 (Node backend, OpenAI model_router, input firewall, LLM expander, cost ledger, fallback) |
| phase3c1_status | done 2026-06-09 (provider adapter foundation, capability matrix, /api/providers, allowlist, mock adapters, pricing price_status, canary harness) |
| phase3c2_status | done 2026-06-09 (live Claude+Gemini adapters gated by user_selectable; verified pricing; first-request latency; canary caps; DeepSeek still placeholder/mock) |
| phase3c2b_status | tooling done 2026-06-09 (canary:provider CLI, caps, payload-class check, latency split, promotion verdict, invariant test). REAL-API canary + promotion PENDING owner run with keys (Claude then Gemini) |
| active_task | await owner real-API canary run (ALLOW_GATED_LIVE_CANARY=1 + key) -> on PASS, promote provider user_selectable=true |
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

## Phase 3B delivered

- Node + Express backend (`server/`): `POST /api/expand` with CORS(localhost) + body-size limit + simple rate limit.
- `inputFirewall` (public/writer-safe only; private/secret and user free-text-as-instructions blocked).
- `modelRouter` (provider fixed = OpenAI; budget/effective_scale/risk -> model tier cheap=`gpt-5.4-mini` / quality=`gpt-5.4`; key never in decision).
- `llmExpander` (OpenAI SDK; structured/JSON output -> zod-validated `LlmDraft` -> assembled into Phase-2 schemas; 1 retry; generation caps per scale).
- `obs/llmLog` + `cost/costLedger` + `pricing/providerPricing` (source_url + price_snapshot_date 2026-06-09; NEVER key/raw prompt).
- Frontend `RemoteExpander` (async; falls back to `DeterministicExpander` on any failure) + UI `ExternalSendNotice` / `ExpandProgress` / `WorkCostPanel`.
- `OPENAI_API_KEY` server env only; `.env.example` committed; provider key never in client bundle / `VITE_` / logs / responses.
- package scripts: `dev:client`, `dev:server`, `build:server`; Vite `/api` dev proxy.

## Out of scope (deferred)

Multi-provider fallback (Gemini/Claude/DeepSeek). Scene Board / episode generation (Phase 4), Creative Review, LLM semantic gates (Phase 5). Public deployment auth/usage limits.

## Next

Phase 4 (Writer episode generation) needs its own proposal (DOC BEFORE CODE, constitution section 3).

> State enum (idle/working/blocked/done) to be formalized in schemas.
