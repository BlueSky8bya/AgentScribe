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
npm run build        # client tsc -b + vite
npm run build:server # server typecheck
npm run lint         # eslint + doc-language guard
npm test             # vitest (unit)
```

## Provider Contract Canary (Phase 3C-2b)

Real-API smoke canary for ONE gated-live provider. Owner runs it; the agent only builds tooling and records results.

```text
# dev only — keys in server .env, never on the CLI
ALLOW_GATED_LIVE_CANARY=1 npm run canary:provider -- claude
ALLOW_GATED_LIVE_CANARY=1 npm run canary:provider -- gemini
```
- Caps: <=10 calls/provider, <=$5/run; aborts before breaching.
- Promotion gate (smoke): `private_secret_leak_count=0` AND `schema_success_rate=1.0` AND `fallback_rate=0` AND `payload_class_ok`. Pass -> `user_selectable=true` (status `beta`); fail -> stays `experimental`/`user_selectable=false`. (Internal bars, not an industry standard.)
- Output is REDACTED: numbers/booleans/model ids + first/subsequent latency only. Never a key, raw prompt, or raw payload.
- `can_generate_real_output` is a derived invariant (`adapter_mode==="live" && user_selectable`), enforced by a unit test.

> Reports: `docs/test_reports/YYYY-MM-DD/test_provider_canary_<provider>_vNNN.md` (CanaryReport + latency + payload_class_ok + pass/fail; no raw payload/key).
