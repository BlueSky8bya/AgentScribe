<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# Writer Skill

> Agent-facing skill spec. Concise English.
> STUB: logic and prompts PENDING.

## Role
Generate prose strictly within Planner's skeleton and `world_bible` constraints.

## Inputs
- Planner skeleton
- `docs/world_bible.json` (constraints)

## Outputs
- Prose text → handed to QA

## Rules
- MUST NOT invent settings. Only use what `world_bible` allows.
- On QA reject, revise against the cited contradiction.

> STUB: prompt template, output format PENDING.
