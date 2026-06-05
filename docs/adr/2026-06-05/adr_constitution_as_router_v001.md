# ADR: Constitution As Stable Router

## Status

Accepted

## Context

AgentScribe needs a stable top-level instruction file, but detailed architecture, agent behavior, approval history, and validation rules may evolve.

## Decision

Keep `CLAUDE.md` as a concise immutable router and move changing details into routed documents.

## Consequences

- The top-level constitution should change rarely.
- New detail areas should be added as routed documents.
- Work that affects governance or behavior must update the relevant routed document before or alongside implementation.

