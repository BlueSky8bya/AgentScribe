// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Per-work_id token/cost ledger (proposal section 9B). Stores token counts and
// derived cost only — NEVER the key or the raw prompt. Cost = price table x tokens.
// ===========================================================================
import type { CostLedgerEntry, ExpandPhase } from "../../src/core/expand/remoteTypes.js";
import { findPricing } from "../pricing/providerPricing.js";

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cached_tokens?: number;
  reasoning_tokens?: number;
}

function round6(n: number): number {
  return Number(n.toFixed(6));
}

export interface BuildLedgerArgs {
  work_id: string;
  phase: ExpandPhase;
  provider: string;
  model: string;
  usage: TokenUsage;
  fallback_used: boolean;
  fallback_reason?: string | null;
  actual_cost_usd?: number | null;
}

/** Compute a ledger entry from token usage and the price table. */
export function buildLedgerEntry(args: BuildLedgerArgs): CostLedgerEntry {
  const pricing = findPricing(args.model);
  const input_tokens = args.usage.input_tokens;
  const output_tokens = args.usage.output_tokens;
  const cached_tokens = args.usage.cached_tokens ?? 0;
  const reasoning_tokens = args.usage.reasoning_tokens ?? 0;
  const unit_price_input = pricing?.input_price_per_1m_tokens ?? 0;
  const unit_price_output = pricing?.output_price_per_1m_tokens ?? 0;
  const estimated_cost_usd = round6(
    (input_tokens / 1_000_000) * unit_price_input + (output_tokens / 1_000_000) * unit_price_output,
  );
  return {
    work_id: args.work_id,
    phase: args.phase,
    provider: args.provider,
    model: args.model,
    call_count: 1,
    input_tokens,
    output_tokens,
    cached_tokens,
    reasoning_tokens,
    total_tokens: input_tokens + output_tokens,
    unit_price_input,
    unit_price_output,
    estimated_cost_usd,
    actual_cost_usd: args.actual_cost_usd ?? null,
    price_snapshot_date: pricing?.price_snapshot_date ?? "unknown",
    fallback_used: args.fallback_used,
    fallback_reason: args.fallback_reason ?? null,
  };
}

const ledgers = new Map<string, CostLedgerEntry[]>();

export function recordCost(entry: CostLedgerEntry): void {
  const list = ledgers.get(entry.work_id) ?? [];
  list.push(entry);
  ledgers.set(entry.work_id, list);
}

export function getCost(work_id: string): CostLedgerEntry[] {
  return ledgers.get(work_id) ?? [];
}
