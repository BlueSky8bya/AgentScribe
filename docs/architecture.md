<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# Architecture — Immersion-Preserving Long-form Generation Pipeline

> Single source for structure, pipeline, and data flow. Agent-facing: concise English.
> Full approved design (Korean, with rationale): `docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md`.

## Stack

| Layer | Tech | Status |
|---|---|---|
| Frontend / Orchestration | Vite + TypeScript | Phase 1 |
| QA / Gates | server-side (lang TBD) | deferred |
| Shared state | `.md` / `.json` (Blackboard), DB later | Phase 1 files; PostgreSQL deferred |

## End-to-end pipeline

```text
World Seed → Authorial Intent Bible → Narrative Shape Mode
  → Craft Trait Selection (stub/direction in Phase 1)
  → Editorial Room / Preflight (Theme Ledger, Series Blueprint, Character Bible/Cast/
       Relationship/Reveal, Episode Cards, Masterpiece Candidate Gates, Locked Blueprint)
  → [Episode loop: Director → Planner(+Retrieval) → Scene Board → Writer
       → Creative Review Room → Immersion Gates(10 axes) → NMK Commit]
  → completion
```
Order is enforced: design → candidate gates → lock → only then episode generation. Failed drafts are never committed (reject → 2 retries → Director repair plan → partial-failure stop).

## Core agents (4)

Director / Planner / Writer / QA are the only core agents. Critics, Chief Editor, Producer, and modules (Context Packager, Prompt Firewall, Retrieval, Memory Committer, Observability) are judge/operational roles or tools, promoted to standalone agents only later. Responsibility detail: `docs/agents.md` (RACI).

## Narrative Memory Kernel (NMK, 7 components)

Canonical Store / Entity State Store / Event Ledger (append-only, no delete) / Rolling·Arc Summary / Retrieval Index / Episode Contract (derived) / Immersion Gates. Sources of truth: Canonical, Entity State, Event Ledger only. See `docs/schemas.md`.

## Information separation

Prompt Firewall: Writer receives only Episode Contract `allowed_*` + `public_summary`. `private_backstory`/`secrets`/`hidden_truth`/`forbidden_*` are redacted (id-level log). This is a Phase-1 hard rule even before full Character Bible exists.

## Phase roadmap (MVP cut)

- **Phase 1 (MVP)**: Seed + Intent + Shape + basic Blueprint/Episode Card storage. MVP schemas only (`docs/schemas.md`). Craft Trait / Character Firewall detail / Creative Review / Reader Probe = direction only.
- Phase 2+: Preflight rooms, Character/Cast/Firewall detail, gates 2/3-tier, NMK full, Scale Mode, operational architecture (eval/routing/DB/UI/latency).

Each phase ships under its own proposal (DOC BEFORE CODE). Folder layout: `src/agents/{director,planner,writer}`, `src/python_engine/qa`, `src/ui` (Phase 1), `docs/`.
