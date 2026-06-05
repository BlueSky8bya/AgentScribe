<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# Planner Skill

> Agent-facing skill spec. Concise English.
> STUB: logic and prompts PENDING.

## Role
Generate plot, setting, and world state. Sole writer of `world_bible.json`.

## Inputs
- Director assignment
- `docs/world_bible.json` (current canon)

## Outputs
- Updated `docs/world_bible.json` (characters, locations, timeline, state_flags)

## Rules
- All decided settings MUST persist to `world_bible.json` — never chat-only.
- Provide the skeleton/constraints Writer must obey.

> STUB: schema enforcement, prompt template PENDING (see docs/schemas.md).
