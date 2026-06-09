// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2_live_provider_rollout_v001.md section 4] file created under this proposal
// Live Claude adapter (official @anthropic-ai/sdk). Returns JSON text + normalized
// usage. The API key is read from env here only; never logged or returned.
// NOTE: Claude structured outputs compile/cache a schema grammar -> the FIRST request
// can be slower (see modelRouter/observability first_request_latency).
// ===========================================================================
import Anthropic from "@anthropic-ai/sdk";
import type { ProviderAdapter, AdapterPrompt, AdapterResult } from "./types.js";

export class ClaudeAdapter implements ProviderAdapter {
  id = "claude" as const;
  private client: Anthropic;

  constructor(client?: Anthropic) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!client && !key) throw new Error("anthropic_key_missing");
    this.client = client ?? new Anthropic({ apiKey: key });
  }

  async generate(prompt: AdapterPrompt, model: string): Promise<AdapterResult> {
    const msg = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: prompt.system + " Output ONLY a single JSON object, no prose, no markdown fences.",
      messages: [{ role: "user", content: prompt.user }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return {
      rawJson: stripFences(text),
      usage: {
        input_tokens: msg.usage?.input_tokens ?? 0,
        output_tokens: msg.usage?.output_tokens ?? 0,
        cached_tokens: msg.usage?.cache_read_input_tokens ?? 0,
        reasoning_tokens: 0,
      },
    };
  }
}

/** Claude may wrap JSON in ```json fences despite instructions; strip them. */
function stripFences(s: string): string {
  const t = s.trim();
  if (t.startsWith("```")) return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return t;
}
