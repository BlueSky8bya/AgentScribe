<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# Data Schemas

> All schemas freeze in `docs/schemas.md` before code. Agent-facing: concise English.
> Full field detail: archived proposal §3.4b, §3.5, §3.6, §5, §6, §10.2.

## MVP schemas (Phase 1 — IMPLEMENTED, zod, `src/core/schemas/`)

9 schemas (8 MVP-required + Character split into Public/Private = firewall boundary):

- `SeedSettings` (seedSettings.ts) — Canonical seed; work_id, genre, mood, background, pov, scale, target_episodes, episode_length.
- `AuthorialIntent` (authorialIntent.ts) — lasting_feeling, why_this_story, desired_emotion, avoid_cliches, final_image, negative_space.
- `NarrativeShape` (narrativeShape.ts) — mode (5 shapes).
- `CharacterPublicSeed` (character.ts) — Writer-safe: character_id, name, role, one_line.
- `CharacterPrivate` (character.ts) — **firewalled**: private_backstory, secrets. Never to Writer.
- `BasicSeriesBlueprint` (seriesBlueprint.ts) — deterministic skeleton; shape_ref, arc_outline.
- `BasicEpisodeCard` (episodeCard.ts) — stub; episode_id, index, status="stub".
- `TelemetrySpan` (telemetry.ts) — trace_id/span_id/parent_span_id, run_id, step, duration_ms — **never logs keys**.
- `Fixture` (fixture.ts) — golden fixture format.
- `WorkRecord` (index.ts) — assembled work: `public` group (Writer-safe) + `private` group (firewalled).

## Phase 2 schemas (IMPLEMENTED, `src/core/schemas/`)

Editorial Room design assets + lock. `WorkRecord` bumped to `0.2.0` (back-compatible; `migrateWork()` upgrades 0.1.0).

- `CharacterBible` (characterBible.ts) — public group: importance_level, species_or_type, public_summary, species_rules.
- `CastEntry` (castRegistry.ts) — importance, introduced_by, allowed_scope, can_affect_main_plot, promotion_status.
- `Relationship` (relationshipMap.ts) — from/to, relationship_type, planned_turns.
- `RevealItem` (revealSchedule.ts) — allowed_episode_range, reveal_mode, forbidden_before, payoff_episode.
- `ThemeLedger` (themeLedger.ts) — central_question, opposing_values, episode_pressure.
- `Foreshadow` (foreshadowing.ts) — plant_episode, payoff_episode (missing => orphan).
- `CraftSelection` (craftSelection.ts) — STUB; selected/rejected trait ids only (no author imitation).
- `LockState` + extended `SeriesBlueprint`/`BasicEpisodeCard` (lock zones Hard/Soft/Fluid; reveal/relationship refs).

Deterministic preflight (`src/core/preflight/`): `candidateGates` (severity fatal/reject/blocking_warn/warn/skip), `schemaCanary` (orphan/missing/duplicate), `lockBlueprint` (refuse on reject/blocking_warn/canary-error; pure warns need acknowledge), `revisionImpact`.

## Phase 3A schemas (IMPLEMENTED) — minimal seed + auto-expansion

`WorkRecord` 0.2.0 -> 0.3.0 (chained `migrateWork`). No LLM (deterministic).

- `CharacterPublicSeed` + `gender`, `personality_brief`.
- `WorldRule` (worldRule.ts) — Canonical world rules.
- `ScaleCheck` (scaleCheck.ts) — INTERNAL, never shown raw to user: declared_scale, target_episodes, episode_length, episode_length_unit (ko_chars), planned_total_length, effective_scale, scale_consistency (ok/warn/blocking_warn), scale_override_reason.
- `WorkRecord.public` + `world_rules`, `scale_check`.

Logic (`src/core/`):
- `scale/scaleCheck.ts` — episode-count bands (AgentScribe initial defaults, NOT a literary standard; default 5000 ko_chars/episode). `computeScaleCheck`, `scaleFromEpisodes`, `defaultEpisodes`, `scaleGuidanceMessage`.
- `expand/ExpanderAdapter.ts` + `deterministicExpander.ts` — rule-based draft generator (3A; LLM swap is 3B). Produces editable proposals (provenance agent_preflight); private drafts go to the firewalled private group.
- `bootstrapWork.ts` — minimal seed -> scale check -> expander -> assembled WorkRecord (effective_scale drives blueprint/gates/expander).

## Deferred stub schemas (direction only; freeze in their Phase)

`craft_trait_schema`, `craft_selection_schema`, `craft_decision_log_schema`, `character_bible_schema`, `cast_registry_schema`, `relationship_map_schema`, `character_reveal_schedule_schema`, `character_creation_gate_schema`, `cast_promotion_gate_schema`, `prompt_firewall_schema`, `character_info_grade/lifecycle_schema`, `cross_link/schema_canary`, `reader_probe_schema`, `subjective_evaluation_rubric_schema`, `judge_calibration_schema`, `model_routing_schema`, `llm_call_policy_schema`, `database_storage_schema`, `ui_screen_skeleton_schema`, `ui_latency_metrics_schema`, `character/cast_observability_schema`.

## NMK truth-source schemas (skeleton)

- **world_bible.json** → Canonical (immutable, agent-no-edit) + Entity State (current: location/alive/relationships) + Inferred (confidence+source).
- **Event Ledger** — append-only; fields: event_id, episode, subject/predicate/object, summary, provenance, source_text, schema_version, confidence; correction via `supersedes`/`superseded_by`/`status`; temporal (before/after) + knowledge (known_by/audience_knows/info_status).
- **Episode Contract** — derived per episode; carries `allowed_character_reveals`, `forbidden_character_reveals`, `active_relationship_beats`, `allowed_new_characters`, `reader_experience_goals`.

## Storage

Phase 1: `.md`/`.json` + optional SQLite. Production (deferred): PostgreSQL JSONB+GIN, pgvector for Retrieval Index, append-only `events`, snapshot `entity_states`, draft text NOT stored (hash/snippet/ref only). Table list: archived proposal §10.5.6.

> Schema changes carry migration rules + `schema_version`.
