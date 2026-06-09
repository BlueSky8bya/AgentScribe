// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md] file created under this proposal
// Resolves a provider id to an adapter. 3C-1: openai = live; others = mock.
// Live rollout (real Gemini/Claude/DeepSeek adapters) = Phase 3C-2.
// ===========================================================================
import type { ProviderId } from "./capabilityMatrix.js";
import type { ProviderAdapter } from "./types.js";
import { OpenaiAdapter } from "./openaiAdapter.js";
import { ClaudeAdapter } from "./claudeAdapter.js";
import { GeminiAdapter } from "./geminiAdapter.js";
import { MockAdapter } from "./mockAdapter.js";
import { getEntry } from "./capabilityMatrix.js";

/** Returns the adapter for a provider, honoring its adapter_mode in the matrix. */
export function resolveAdapter(provider: ProviderId): ProviderAdapter {
  const entry = getEntry(provider, "cheap") ?? getEntry(provider, "quality");
  if (entry?.adapter_mode === "live") {
    // 3C-2: OpenAI / Claude / Gemini have live adapters.
    switch (provider) {
      case "openai": return new OpenaiAdapter();
      case "claude": return new ClaudeAdapter();
      case "gemini": return new GeminiAdapter();
      default: break;
    }
  }
  // deepseek (and any non-live) -> mock until its 3C-2 live step.
  return new MockAdapter(provider);
}
