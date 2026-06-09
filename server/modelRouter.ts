// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Server-only routing. Provider is fixed (OpenAI, selected at approval). Inside
// that provider, budget/effective_scale/risk pick a model tier. The API key is
// NOT part of the decision — it is read from env inside the expander, never here.
// ===========================================================================
import type { ScaleMode } from "../src/core/schemas/seedSettings.js";

export type ModelTier = "cheap" | "quality";

export interface RouteDecision {
  provider: "openai";
  model: string;
  tier: ModelTier;
}

export interface RouteInput {
  effective_scale: ScaleMode;
  risk_level?: "low" | "high";
  budget_class?: "save" | "normal";
  quality_pref?: "high" | "balanced";
}

// Verified OpenAI model ids (see providerPricing.ts, snapshot 2026-06-09).
const CHEAP_MODEL = "gpt-5.4-mini";
const QUALITY_MODEL = "gpt-5.4";

function decideTier(input: RouteInput): ModelTier {
  // Cost savings wins when explicitly requested.
  if (input.budget_class === "save") return "cheap";
  if (input.quality_pref === "high") return "quality";
  if (input.risk_level === "high") return "quality";
  // Long / series design expansion is higher stakes -> quality.
  if (input.effective_scale === "long" || input.effective_scale === "series") return "quality";
  return "cheap";
}

export function route(input: RouteInput): RouteDecision {
  const tier = decideTier(input);
  return { provider: "openai", model: tier === "quality" ? QUALITY_MODEL : CHEAP_MODEL, tier };
}
