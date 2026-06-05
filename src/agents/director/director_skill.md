<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# Director Skill

> Agent-facing skill spec. Concise English.
> STUB: logic and prompts PENDING.

## Role
Assignment, progress tracking, backlog review. Top-level coordinator.

## Inputs
- `docs/state.md` (current state)
- `docs/backlog.md` (deferred ideas)

## Outputs
- Task assignments → `state.md` active_task
- Backlog triage → `backlog.md`

## Triggers
- Session start, task completion, escalation (same error 2x).

## Rules
- Defend the main loop: new ideas → backlog, not immediate work.
- On repeated failure (2x), stop and report A/B options.

> STUB: prompt template, message handling PENDING (see docs/agent_interaction_protocol.md).
