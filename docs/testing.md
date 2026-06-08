<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# Quality Gates & Testing

> Gate criteria + fixtures. No gate is implemented without fixtures first.
> Full detail: archived proposal §6, §10.1, §10.5.3-4.

## Constitution gates (always)

- **Gate 1 (state sync)**: code change ships with its design `.md` update + traceability comment.
- **Gate 2 (logic)**: QA cross-checks prose against NMK; 0 contradictions.

## Immersion Gates — 10 axes (cascade: deterministic → cheap model → expensive judge)

1 factual/world · 2 entity-state · 3 plot/repetition · 4 emotional continuity · 5 author-intent/seed · 6 genre/style · 7 language naturalness (Korean-primary) · 8 scene vividness (anti-summary) · 9 pacing · 10 character & exposition control (reveal_leak, cast_sprawl, unauthorized_major, relationship_jump, exposition_dump, species_rule_violation).

Severity: fatal (immediate reject) / major (reject) / minor (warn). Failure policy: reject never commits → 2 retries → Director repair plan → partial-failure report stop.

## Golden Fixtures / Canary (build before implementing gates)

- Negative (must catch) + Positive (good scenes must pass) fixtures per failure type.
- **Retrieval Canary**: verify the *right memory was retrieved*, not just final prose.
- Character/Cast, Prompt Firewall, Schema Canary (orphan reveal/relationship), access-separation fixtures.

## Subjective evaluation (deferred detail)

Rubric 1–5 with rationale + trace_id; never trust single judge; high-risk uses ≥2 judges / pairwise + shuffle (position bias) + verbosity penalty; thresholds calibrated against fixtures + human spot-check (G-Eval / MT-Bench / Prometheus direction). See proposal §10.5.3-4.

## Test commands

```text
PENDING: vitest / pytest after Phase 1 scaffolding.
```

> Reports: `docs/test_reports/YYYY-MM-DD/`.
