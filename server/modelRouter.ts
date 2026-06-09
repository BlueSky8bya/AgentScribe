// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 8] provider-parameterized + matrix allowlist
// Server-only routing. budget/effective_scale/risk pick a tier; the (provider, tier)
// pair resolves to a concrete model via the Capability Matrix allowlist — the client
// can NEVER name a model directly. The API key is not part of the decision.
// ===========================================================================
import type { ScaleMode } from "../src/core/schemas/seedSettings.js";
import { getEntry, type ProviderId, type ModelTier } from "./providers/capabilityMatrix.js";

export type { ModelTier };

export interface RouteDecision {
  provider: ProviderId;
  model: string;
  tier: ModelTier;
}

export interface RouteInput {
  provider?: ProviderId;
  effective_scale: ScaleMode;
  risk_level?: "low" | "high";
  budget_class?: "save" | "normal";
  quality_pref?: "high" | "balanced";
}

function decideTier(input: RouteInput): ModelTier {
  if (input.budget_class === "save") return "cheap";
  if (input.quality_pref === "high") return "quality";
  if (input.risk_level === "high") return "quality";
  if (input.effective_scale === "long" || input.effective_scale === "series") return "quality";
  return "cheap";
}

/** Resolve to a concrete model via the matrix allowlist. Throws on unknown provider/tier. */
export function route(input: RouteInput): RouteDecision {
  const provider: ProviderId = input.provider ?? "openai";
  const tier = decideTier(input);
  const entry = getEntry(provider, tier);
  if (!entry) throw new Error(`no_model_for_${provider}_${tier}`);
  return { provider, model: entry.model_id, tier };
}
