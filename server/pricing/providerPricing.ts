// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 7] extended: price_status + 4 providers
// Server-only price table. Prices are NOT hardcoded in logic — they live here
// with a source_url and a price_snapshot_date. price_status=placeholder prices are
// NEVER used in cost estimates (usable_for_cost_estimate=false).
// ===========================================================================

export type PriceStatus = "verified" | "placeholder";

export interface PricingEntry {
  provider: string;
  model: string;
  input_price_per_1m_tokens: number;
  output_price_per_1m_tokens: number;
  cached_input_price_per_1m_tokens: number;
  source_url: string;
  price_snapshot_date: string;
  price_status: PriceStatus;
  usable_for_cost_estimate: boolean;
}

// Verified against OpenAI official pricing on this date. Re-confirm before relying on cost.
const OPENAI_SRC = "https://developers.openai.com/api/docs/pricing";
const SNAPSHOT = "2026-06-09";

export const PROVIDER_PRICING: PricingEntry[] = [
  // OpenAI (verified)
  {
    provider: "openai", model: "gpt-5.4",
    input_price_per_1m_tokens: 2.5, output_price_per_1m_tokens: 15.0, cached_input_price_per_1m_tokens: 0.25,
    source_url: OPENAI_SRC, price_snapshot_date: SNAPSHOT, price_status: "verified", usable_for_cost_estimate: true,
  },
  {
    provider: "openai", model: "gpt-5.4-mini",
    input_price_per_1m_tokens: 0.75, output_price_per_1m_tokens: 4.5, cached_input_price_per_1m_tokens: 0.075,
    source_url: OPENAI_SRC, price_snapshot_date: SNAPSHOT, price_status: "verified", usable_for_cost_estimate: true,
  },
  // Gemini / Claude / DeepSeek (placeholder — confirm official pricing at Phase 3C-2, then flip to verified)
  ...placeholders("gemini", ["gemini-pending-cheap", "gemini-pending-quality"], "https://ai.google.dev/gemini-api/docs/pricing"),
  ...placeholders("claude", ["claude-pending-cheap", "claude-pending-quality"], "https://platform.claude.com/docs/en/about-claude/models/overview"),
  ...placeholders("deepseek", ["deepseek-pending-cheap", "deepseek-pending-quality"], "https://api-docs.deepseek.com/quick_start/pricing-details-usd/"),
];

function placeholders(provider: string, models: string[], src: string): PricingEntry[] {
  return models.map((model) => ({
    provider, model,
    input_price_per_1m_tokens: 0, output_price_per_1m_tokens: 0, cached_input_price_per_1m_tokens: 0,
    source_url: src, price_snapshot_date: "pending", price_status: "placeholder" as const, usable_for_cost_estimate: false,
  }));
}

export function findPricing(model: string): PricingEntry | undefined {
  return PROVIDER_PRICING.find((p) => p.model === model);
}
