// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Shared types for the /api/expand contract. Imported by BOTH the browser
// (RemoteExpander, WorkCostPanel) and the server (costLedger). No secrets here.
// ===========================================================================
import type { ExpansionResult } from "./ExpanderAdapter.js";

/** Which pipeline stage spent the tokens. Phase 3B only records design-draft cost. */
export type ExpandPhase = "phase3b_expansion" | "later_writer" | "later_review";

/** Per-call cost/token record (proposal section 9B.1). NEVER carries key or raw prompt. */
export interface CostLedgerEntry {
  work_id: string;
  phase: ExpandPhase;
  provider: string;
  model: string;
  call_count: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
  total_tokens: number;
  unit_price_input: number;
  unit_price_output: number;
  estimated_cost_usd: number;
  actual_cost_usd: number | null;
  price_snapshot_date: string;
  fallback_used: boolean;
  fallback_reason: string | null;
}

/** Optional routing hints the user can toggle (cost vs quality). */
export interface ExpandOptions {
  quality_pref?: "high" | "balanced";
  budget_class?: "save" | "normal";
}

/** Response shape of POST /api/expand. */
export interface ExpandResponse {
  expansion: ExpansionResult;
  cost: CostLedgerEntry;
}

/** Build a zero-cost ledger entry for a client-side deterministic fallback. */
export function fallbackCost(work_id: string, reason: string): CostLedgerEntry {
  return {
    work_id,
    phase: "phase3b_expansion",
    provider: "none",
    model: "deterministic_fallback",
    call_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    cached_tokens: 0,
    reasoning_tokens: 0,
    total_tokens: 0,
    unit_price_input: 0,
    unit_price_output: 0,
    estimated_cost_usd: 0,
    actual_cost_usd: 0,
    price_snapshot_date: "n/a",
    fallback_used: true,
    fallback_reason: reason,
  };
}
