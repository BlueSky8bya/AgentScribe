// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2_live_provider_rollout_v001.md section 9] live adapters via injected mock client (no network)
import { describe, it, expect } from "vitest";
import { ClaudeAdapter } from "../server/providers/claudeAdapter.js";
import { GeminiAdapter } from "../server/providers/geminiAdapter.js";
import { parseDraft } from "../server/canary/classify.js";
import type Anthropic from "@anthropic-ai/sdk";
import type { GoogleGenAI } from "@google/genai";

const DRAFT = '{"characters":[],"theme":{"central_question":"q","opposing_values":[]},"relationships":[]}';

describe("ClaudeAdapter", () => {
  it("parses text + normalizes usage; strips code fences", async () => {
    const fake = {
      messages: {
        create: async () => ({
          content: [{ type: "text", text: "```json\n" + DRAFT + "\n```" }],
          usage: { input_tokens: 120, output_tokens: 60, cache_read_input_tokens: 10 },
        }),
      },
    } as unknown as Anthropic;
    const r = await new ClaudeAdapter(fake).generate({ system: "s", user: "u" }, "claude-sonnet-4-6");
    // Adapter returns RAW text (with fences); central parseDraft handles extraction.
    expect(parseDraft(r.rawJson).ok).toBe(true);
    expect(r.usage.input_tokens).toBe(120);
    expect(r.usage.output_tokens).toBe(60);
    expect(r.usage.cached_tokens).toBe(10);
  });
});

describe("GeminiAdapter", () => {
  it("reads text + usageMetadata", async () => {
    const fake = {
      models: {
        generateContent: async () => ({
          text: DRAFT,
          usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 80 },
        }),
      },
    } as unknown as GoogleGenAI;
    const r = await new GeminiAdapter(fake).generate({ system: "s", user: "u" }, "gemini-3.5-flash");
    expect(JSON.parse(r.rawJson)).toHaveProperty("theme");
    expect(r.usage.input_tokens).toBe(200);
    expect(r.usage.output_tokens).toBe(80);
  });
});
