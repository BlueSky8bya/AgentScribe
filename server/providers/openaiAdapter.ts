// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md] file created under this proposal
// Live OpenAI adapter. Wraps the OpenAI SDK chat.completions JSON-object call.
// The API key is read from env here only; never logged or returned.
// ===========================================================================
import OpenAI from "openai";
import type { ProviderAdapter, AdapterPrompt, AdapterResult } from "./types.js";

export class OpenaiAdapter implements ProviderAdapter {
  id = "openai" as const;
  private client: OpenAI;

  constructor(client?: OpenAI) {
    const key = process.env.OPENAI_API_KEY;
    if (!client && !key) throw new Error("openai_key_missing");
    this.client = client ?? new OpenAI({ apiKey: key });
  }

  async generate(prompt: AdapterPrompt, model: string): Promise<AdapterResult> {
    const completion = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      response_format: { type: "json_object" },
    });
    const u = completion.usage;
    return {
      rawJson: completion.choices[0]?.message?.content ?? "{}",
      usage: {
        input_tokens: u?.prompt_tokens ?? 0,
        output_tokens: u?.completion_tokens ?? 0,
        cached_tokens: u?.prompt_tokens_details?.cached_tokens ?? 0,
        reasoning_tokens: u?.completion_tokens_details?.reasoning_tokens ?? 0,
      },
    };
  }
}
