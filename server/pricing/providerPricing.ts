// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Server-only price table. Prices are NOT hardcoded in logic — they live here
// with a source_url and a price_snapshot_date. Update this file when prices move.
// ===========================================================================

export interface PricingEntry {
  provider: "openai";
  model: string;
  input_price_per_1m_tokens: number;
  output_price_per_1m_tokens: number;
  cached_input_price_per_1m_tokens: number;
  source_url: string;
  price_snapshot_date: string;
}

// Verified against OpenAI official pricing on this date. Re-confirm before relying on cost.
const SOURCE_URL = "https://developers.openai.com/api/docs/pricing";
const SNAPSHOT = "2026-06-09";

export const PROVIDER_PRICING: PricingEntry[] = [
  {
    provider: "openai",
    model: "gpt-5.4",
    input_price_per_1m_tokens: 2.5,
    output_price_per_1m_tokens: 15.0,
    cached_input_price_per_1m_tokens: 0.25,
    source_url: SOURCE_URL,
    price_snapshot_date: SNAPSHOT,
  },
  {
    provider: "openai",
    model: "gpt-5.4-mini",
    input_price_per_1m_tokens: 0.75,
    output_price_per_1m_tokens: 4.5,
    cached_input_price_per_1m_tokens: 0.075,
    source_url: SOURCE_URL,
    price_snapshot_date: SNAPSHOT,
  },
];

export function findPricing(model: string): PricingEntry | undefined {
  return PROVIDER_PRICING.find((p) => p.model === model);
}
