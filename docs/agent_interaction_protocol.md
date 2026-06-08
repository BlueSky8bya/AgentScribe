<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# Agent Interaction Protocol (Blackboard + RACI)

> Agents coordinate via shared state (Blackboard), not direct calls. Concise English.
> Authority for who-does-what: RACI (proposal §10.5.1, summarized in `docs/agents.md`).

## Blackboard

| Board | File | Writer |
|---|---|---|
| Runtime state | `docs/state.md` | all agents (own cells) |
| Canonical + Entity State | `docs/world_bible.json` | Planner (Canonical: seed-only, no edit) |
| Backlog | `docs/backlog.md` | Director |

## Message (draft)

```json
{ "from": "director", "to": "planner",
  "type": "assign | submit | reject | done | repair_plan",
  "task_id": "PENDING", "trace_id": "PENDING", "payload": {} }
```

## Handoff (episode loop)

1. Director assigns episode goal from Locked Blueprint/Episode Card → updates `state.md`.
2. Planner: state extract + beat plan + Retrieval → Episode Contract material.
3. Context Packager / Prompt Firewall builds Writer-safe payload (allowed_* + public_summary only; private/secret redacted).
4. (Scene Board →) Writer drafts.
5. Creative Review Room (deferred) → Immersion Gates (10 axes).
6. Reject → Writer rework (max 2) → Director repair plan → partial-failure stop. PASS only → NMK commit.

## Order enforcement

Preflight design → Candidate Gates → Lock → only then episode generation. Writer cannot run without a Locked Blueprint.

> Trigger mechanism (polling/event) finalized in implementation phase.
