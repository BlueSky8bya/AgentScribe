<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# Agents — Roles & Responsibility (RACI)

> 4 core agents only. Critics/Chief Editor/Producer are judge/operational roles, not core agents.
> Full design: archived proposal §10.5.1. Detail per skill doc.

## Core agents (Responsible)

| Agent | Responsibility | Skill doc |
|---|---|---|
| Director | Accountable owner: routing, episode goals, Scale, repair plan, partial-failure decision | `src/agents/director/director_skill.md` |
| Planner | Design, retrieval, state assembly, Character Bible/Cast/Relationship/Reveal, Episode Contract prep | `src/agents/planner/planner_skill.md` |
| Writer | Prose only. No design change. Uses only Prompt-Firewall-passed info | `src/agents/writer/writer_skill.md` |
| QA | Gates, Canary, Reader Probe, schema checks, judge orchestration, NMK-commit approval | `src/python_engine/qa/qa_skill.md` |

## Roles (not core agents)

- Critics (Continuity / Emotion / Scene / Theme / Surprise / Language): judge roles under QA / Chief Editor.
- Chief Editor: final-judgment role (QA line).
- Producer: cost/speed/budget role under Director.
- Modules (Context Packager, Prompt Firewall, Retrieval, Scene Board Builder, Schema Canary, Reader Probe, Memory Committer, Observability Reporter): deterministic tools first; promote to standalone agents only when call volume / complexity / fault-isolation demands it.

## RACI

Process-level Responsible/Accountable/Consulted/Informed/Output is the authority for who-does-what. See archived proposal §10.5.1. On conflict with high-level summaries, RACI wins.

## Core principles

- Writer must not invent core settings (Locked Blueprint); micro-detail (dialogue, sensory, props, non-core action) allowed if non-conflicting.
- QA cross-checks prose against NMK; reject on contradiction. Same reject 2× → Director escalation.
- Every step updates `state.md`.
