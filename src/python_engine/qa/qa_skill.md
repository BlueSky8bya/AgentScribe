<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# QA Skill

> Agent-facing skill spec. Concise English.
> STUB: logic and prompts PENDING. DSPy usage UNDECIDED.

## Role
Cross-check generated prose against `world_bible` state. Reject contradictions.

## Inputs
- Writer prose
- `docs/world_bible.json` (state_flags, e.g. `character_A.arm_status = "severed"`)

## Outputs
- Verdict: pass | reject(reason) → back to Writer

## Rules
- Detect context drift: state-vs-text contradiction = immediate reject.
- Gate 2 (testing.md): must catch 100% of state contradictions by design.

> STUB: Python implementation, DSPy vs plain pipeline decision PENDING (backlog #2).
