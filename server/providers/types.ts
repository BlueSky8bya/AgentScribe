// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md] file created under this proposal
// Common provider adapter contract. generate() returns raw JSON text + token usage;
// the expander parses/validates it the same way for every provider.
// ===========================================================================
import type { ProviderId } from "./capabilityMatrix.js";

export interface AdapterPrompt {
  system: string;
  user: string;
}

export interface AdapterUsage {
  input_tokens: number;
  output_tokens: number;
  cached_tokens?: number;
  reasoning_tokens?: number;
}

export interface AdapterResult {
  rawJson: string;
  usage: AdapterUsage;
}

export interface ProviderAdapter {
  id: ProviderId;
  /** Real-output adapters call an external API; mock adapters return canned JSON. */
  generate(prompt: AdapterPrompt, model: string): Promise<AdapterResult>;
}
