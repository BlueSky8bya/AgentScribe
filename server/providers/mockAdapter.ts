// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md] file created under this proposal
// Mock adapter for prepared (not-yet-live) providers. Returns a small canned
// LlmDraft JSON — NO external API call. Selectable for real generation only in
// dev/test (ALLOW_MOCK_PROVIDERS=1). Used by the canary harness in 3C-1.
// ===========================================================================
import type { ProviderId } from "./capabilityMatrix.js";
import type { ProviderAdapter, AdapterPrompt, AdapterResult } from "./types.js";

export class MockAdapter implements ProviderAdapter {
  id: ProviderId;

  constructor(id: ProviderId) {
    this.id = id;
  }

  async generate(_prompt: AdapterPrompt, _model: string): Promise<AdapterResult> {
    // Minimal valid LlmDraft. Empty arrays/strings -> expander keeps the
    // deterministic skeleton (still schema-valid). Zero usage.
    const rawJson = JSON.stringify({
      characters: [],
      theme: { central_question: "", opposing_values: [] },
      relationships: [],
    });
    return { rawJson, usage: { input_tokens: 0, output_tokens: 0 } };
  }
}
