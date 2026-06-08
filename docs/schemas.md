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

## Deferred stub schemas (direction only; freeze in their Phase)

`craft_trait_schema`, `craft_selection_schema`, `craft_decision_log_schema`, `character_bible_schema`, `cast_registry_schema`, `relationship_map_schema`, `character_reveal_schedule_schema`, `character_creation_gate_schema`, `cast_promotion_gate_schema`, `prompt_firewall_schema`, `character_info_grade/lifecycle_schema`, `cross_link/schema_canary`, `reader_probe_schema`, `subjective_evaluation_rubric_schema`, `judge_calibration_schema`, `model_routing_schema`, `llm_call_policy_schema`, `database_storage_schema`, `ui_screen_skeleton_schema`, `ui_latency_metrics_schema`, `character/cast_observability_schema`.

## NMK truth-source schemas (skeleton)

- **world_bible.json** → Canonical (immutable, agent-no-edit) + Entity State (current: location/alive/relationships) + Inferred (confidence+source).
- **Event Ledger** — append-only; fields: event_id, episode, subject/predicate/object, summary, provenance, source_text, schema_version, confidence; correction via `supersedes`/`superseded_by`/`status`; temporal (before/after) + knowledge (known_by/audience_knows/info_status).
- **Episode Contract** — derived per episode; carries `allowed_character_reveals`, `forbidden_character_reveals`, `active_relationship_beats`, `allowed_new_characters`, `reader_experience_goals`.

## Storage

Phase 1: `.md`/`.json` + optional SQLite. Production (deferred): PostgreSQL JSONB+GIN, pgvector for Retrieval Index, append-only `events`, snapshot `entity_states`, draft text NOT stored (hash/snippet/ref only). Table list: archived proposal §10.5.6.

> Schema changes carry migration rules + `schema_version`.
