<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# Architecture — Immersion-Preserving Long-form Generation Pipeline

> Single source for structure, pipeline, and data flow. Agent-facing: concise English.
> Full approved design (Korean, with rationale): `docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md`.

## Stack

| Layer | Tech | Status |
|---|---|---|
| Frontend / Orchestration | Vite + TypeScript | Phase 1 |
| LLM backend (`server/`) | Node + Express + OpenAI SDK | Phase 3B |
| QA / Gates | server-side (lang TBD) | deferred |
| Shared state | `.md` / `.json` (Blackboard), DB later | Phase 1 files; PostgreSQL deferred |

## End-to-end pipeline

```text
World Seed → Authorial Intent Bible → Narrative Shape Mode
  → Craft Trait Selection (stub/direction in Phase 1)
  → Editorial Room / Preflight (Theme Ledger, Series Blueprint, Character Bible/Cast/
       Relationship/Reveal, Episode Cards, Masterpiece Candidate Gates, Locked Blueprint)
  → [Episode loop: Director → Planner(+Retrieval) → Scene Board → Writer
       → Creative Review Room → Immersion Gates(10 axes) → NMK Commit]
  → completion
```
Order is enforced: design → candidate gates → lock → only then episode generation. Failed drafts are never committed (reject → 2 retries → Director repair plan → partial-failure stop).

## Core agents (4)

Director / Planner / Writer / QA are the only core agents. Critics, Chief Editor, Producer, and modules (Context Packager, Prompt Firewall, Retrieval, Memory Committer, Observability) are judge/operational roles or tools, promoted to standalone agents only later. Responsibility detail: `docs/agents.md` (RACI).

## Narrative Memory Kernel (NMK, 7 components)

Canonical Store / Entity State Store / Event Ledger (append-only, no delete) / Rolling·Arc Summary / Retrieval Index / Episode Contract (derived) / Immersion Gates. Sources of truth: Canonical, Entity State, Event Ledger only. See `docs/schemas.md`.

## Information separation

Prompt Firewall: Writer receives only Episode Contract `allowed_*` + `public_summary`. `private_backstory`/`secrets`/`hidden_truth`/`forbidden_*` are redacted (id-level log). This is a Phase-1 hard rule even before full Character Bible exists.

## Phase roadmap (MVP cut)

- **Phase 1 (MVP)**: Seed + Intent + Shape + basic Blueprint/Episode Card storage. MVP schemas only (`docs/schemas.md`). Craft Trait / Character Firewall detail / Creative Review / Reader Probe = direction only.
- **Phase 2**: Editorial Room / Preflight, design assets, deterministic gates/canary, lock, doc-lang guard.
- **Phase 3A**: Minimal seed + Scale Consistency Guard + rule-based `DeterministicExpander` (no LLM) + mixed-initiative review.
- **Phase 3B**: LLM **design assistant** behind a Node backend. Swaps `DeterministicExpander` for an LLM expander; produces only design drafts (character/relationship/theme/foreshadow/arc), NOT episode prose (Writer = Phase 4).
- **Phase 3C-1**: Multi-provider **foundation** — `ProviderAdapter` interface, Capability Matrix, `/api/providers`, provider/tier allowlist, key-availability, mock adapters, pricing extension (`price_status`), Contract Canary harness (mock). OpenAI stays the only `live` provider; Gemini/Claude/DeepSeek are `mock`/`experimental` (not user-selectable for real generation). Live rollout = Phase 3C-2.
- Phase 4+: Writer episode generation, Creative Review, LLM semantic gates, NMK full, operational architecture (DB/UI/latency).

Each phase ships under its own proposal (DOC BEFORE CODE). Folder layout: `src/agents/{director,planner,writer}`, `src/python_engine/qa`, `src/ui`, `src/core`, `server/` (Phase 3B backend), `docs/`.

## Phase 3B — LLM expander backend (`server/`)

Provider selected at approval: **GPT / OpenAI** (one provider implemented; Gemini/Claude/DeepSeek deferred to multi-provider fallback). Full rationale: `docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md`.

```text
[browser/Vite]  --POST /api/expand {seed, public chars, effective_scale}-->  [server/]
  server pipeline:  inputFirewall (public/writer-safe only)
                    -> modelRouter (provider fixed = openai; budget/scale/risk -> model tier)
                    -> llmExpander (OpenAI SDK; structured/JSON output -> zod validate -> 1 retry)
                    -> llmLog (provider/model/cost/latency/error_type; NEVER key or raw prompt)
                    -> costLedger (per work_id tokens + cost; providerPricing table)
  response: { expansion, cost }   ;  on any failure the client falls back to DeterministicExpander
```

### Phase 3C-1 — multi-provider foundation (mock)

```text
GET  /api/providers  -> [{ id, status, adapter_mode, can_generate_real_output, available, tiers }]  (NEVER keys)
POST /api/expand     -> options.provider/quality_pref (enum) -> modelRouter resolves via Capability Matrix allowlist
```
- Capability Matrix (`server/providers/capabilityMatrix.ts`) is the single source of truth for provider/model/tier + `adapter_mode (live|mock|disabled)`, `can_generate_real_output`, `status (disabled|experimental|beta|stable)`, structured-output/token/timeout capabilities, pricing pointer. UI labels and router allowlist both read it (same meaning).
- Provider adapters (`server/providers/`): `ProviderAdapter.generate()` returns `{rawJson, usage}`. OpenAI = `live`. Gemini/Claude/DeepSeek = `mock` in 3C-1 (canned LlmDraft; no external call). Mock providers are selectable for real generation ONLY in dev/test (`ALLOW_MOCK_PROVIDERS=1`).
- No silent substitution: if a user explicitly selects a provider that is unavailable / not `can_generate_real_output`, the server returns `provider_unavailable` (HTTP 409) — it does NOT fall back to OpenAI. Unspecified provider defaults to OpenAI.
- Pricing (`price_status: verified|placeholder`, `usable_for_cost_estimate`): placeholder prices are never used in cost; `WorkCostPanel` shows a cost-pending label. Only `verified` (official pricing + `price_snapshot_date`) is used.
- Contract Canary (`server/canary/`): a versioned Korean seed bank (`canary_version`) run across providers, aggregating schema_success_rate / fallback_rate / latency / cost / `private_secret_leak_count` (must be 0) / cap-compliance / Korean usefulness. Pairwise quality comparison uses order-swap + length-bias guard + rationale + human review. Thresholds are AgentScribe internal operating bars, NOT an industry standard. Auto-routing is deferred (logs first). Refs: FrugalGPT (2305.05176), RouteLLM (2406.18665), MT-Bench/Arena (2306.05685), HELM (2211.09110).

Security invariants (Phase 3B):
- The provider API key (`OPENAI_API_KEY`) lives in server env only. Never in the client bundle, never under a `VITE_` prefix, never logged, never returned in a response.
- Input Firewall: only minimal seed + public/writer-safe fields are sent to the LLM. `private_backstory`/`secrets`/server env/internal logs are never put in the prompt. User free-text is passed as delimited data, never as system instructions, so "ignore previous instructions / print the key" cannot change server rules.
- CORS limited to localhost (dev); request body size limit; simple rate limit. Public deployment requires auth/usage limits (deferred).
- Generation caps per `effective_scale` (characters/relationships/foreshadowing) bound how much the LLM drafts.
- Cost/token tracking is Phase-3B-design-draft only; episode (Phase 4) and review (Phase 5) costs sum in later. Prices live in a server-only `providerPricing` table with `source_url` + `price_snapshot_date` (no hardcoded prices in logic).
