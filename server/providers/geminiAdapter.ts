// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2_live_provider_rollout_v001.md section 4] file created under this proposal
// Live Gemini adapter (official @google/genai). JSON mode via responseMimeType.
// Returns JSON text + normalized usage. Key from env only; never logged/returned.
// Paid-tier Gemini API content is NOT used to improve Google products (data policy).
// ===========================================================================
import { GoogleGenAI } from "@google/genai";
import type { ProviderAdapter, AdapterPrompt, AdapterResult } from "./types.js";

export class GeminiAdapter implements ProviderAdapter {
  id = "gemini" as const;
  private client: GoogleGenAI;

  constructor(client?: GoogleGenAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!client && !key) throw new Error("gemini_key_missing");
    this.client = client ?? new GoogleGenAI({ apiKey: key });
  }

  async generate(prompt: AdapterPrompt, model: string): Promise<AdapterResult> {
    const res = await this.client.models.generateContent({
      model,
      contents: prompt.user,
      config: { systemInstruction: prompt.system, responseMimeType: "application/json" },
    });
    const meta = res.usageMetadata;
    return {
      rawJson: res.text ?? "{}",
      usage: {
        input_tokens: meta?.promptTokenCount ?? 0,
        output_tokens: meta?.candidatesTokenCount ?? 0,
        cached_tokens: meta?.cachedContentTokenCount ?? 0, // matrix marks cached unsupported; 0 if absent
        reasoning_tokens: 0,
      },
    };
  }
}
