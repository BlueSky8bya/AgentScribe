# Decision: CLAUDE Language And Archive Policy

## Summary

`CLAUDE.md` is now agent-facing and written in concise English to reduce recurring context cost.
Developer-facing approval reports remain Korean, plain, and analogy-based.

Approved proposal copies and important project-history artifacts are stored by date and version.

## Why

The top-level constitution is read repeatedly by coding agents, so it should be short and token-efficient.
The developer reviews proposals and decisions, so those documents should be Korean and easy to judge.

`LATEST_PROPOSAL.md` alone is not enough because it overwrites past approval context.

## Policy

- Agent-facing instructions: concise English.
- Developer-facing reports: Korean with plain examples and easy analogies.
- Current proposal: `docs/proposals/LATEST_PROPOSAL.md`.
- Archived proposal: `docs/proposals/archive/YYYY-MM-DD/proposal_<topic>_vNNN.md`.
- Decision logs: `docs/decision_logs/YYYY-MM-DD/decision_<topic>_vNNN.md`.
- State snapshots: `docs/state_snapshots/YYYY-MM-DD/state_<topic>_vNNN.md`.
- Test reports: `docs/test_reports/YYYY-MM-DD/test_<topic>_vNNN.md`.

## Status

Approved by developer with `APPROVE: proceed` on 2026-06-05.

