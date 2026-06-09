// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2c_canary_fallback_fix_v001.md section 11] classify + diagnose + timeout (no network)
import { describe, it, expect } from "vitest";
import { extractJsonObject, classifyDraftFailure, parseDraft } from "../server/canary/classify.js";
import { diagnoseProvider } from "../server/canary/diagnose.js";
import { withTimeout } from "../server/providers/timeout.js";
import type { ProviderAdapter } from "../server/providers/types.js";

const VALID = '{"characters":[],"theme":{"central_question":"q","opposing_values":[]},"relationships":[]}';

describe("extractJsonObject", () => {
  it("strips ```json fences and leading prose", () => {
    expect(extractJsonObject("Here you go:\n```json\n" + VALID + "\n```")).toBe(VALID);
  });
  it("returns null when no object present", () => {
    expect(extractJsonObject("no json here")).toBeNull();
  });
});

describe("classifyDraftFailure", () => {
  it("ok for valid draft", () => {
    expect(classifyDraftFailure(VALID).type).toBe("ok");
  });
  it("empty for blank output", () => {
    expect(classifyDraftFailure("   ").type).toBe("empty");
  });
  it("json_parse for malformed json", () => {
    expect(classifyDraftFailure("{ broken: ").type).toBe("json_parse");
  });
  it("zod_invalid with issue codes + schema paths (no user data)", () => {
    // character_id wrong type -> zod invalid_type at characters.0.character_id
    const bad = '{"characters":[{"character_id":123}],"theme":{"central_question":"q","opposing_values":[]},"relationships":[]}';
    const c = classifyDraftFailure(bad);
    expect(c.type).toBe("zod_invalid");
    if (c.type === "zod_invalid") {
      expect(c.zod_paths?.some((p) => p.includes("character_id"))).toBe(true);
      expect(c.zod_issue_codes?.length).toBeGreaterThan(0);
    }
  });
  it("parseDraft returns the parsed draft on success", () => {
    const r = parseDraft("```json\n" + VALID + "\n```");
    expect(r.ok).toBe(true);
  });
});

describe("withTimeout", () => {
  it("rejects with 'timeout' when slow", async () => {
    const slow = new Promise((res) => setTimeout(res, 50));
    await expect(withTimeout(slow, 5, "timeout")).rejects.toThrow("timeout");
  });
  it("resolves when fast", async () => {
    await expect(withTimeout(Promise.resolve(42), 50)).resolves.toBe(42);
  });
});

describe("diagnoseProvider (injected adapter — no network)", () => {
  it("classifies a provider that returns malformed JSON every time", async () => {
    const badAdapter: ProviderAdapter = {
      id: "gemini",
      generate: async () => ({ rawJson: "not json at all", usage: { input_tokens: 1, output_tokens: 1 } }),
    };
    const report = await diagnoseProvider("gemini", { adapter: badAdapter });
    expect(report.case_count).toBeGreaterThan(0);
    expect(report.counts.json_parse).toBe(report.case_count);
    expect(report.top_failures[0].type).toBe("json_parse");
  });

  it("classifies all-ok when adapter returns valid drafts", async () => {
    const goodAdapter: ProviderAdapter = {
      id: "claude",
      generate: async () => ({ rawJson: VALID, usage: { input_tokens: 1, output_tokens: 1 } }),
    };
    const report = await diagnoseProvider("claude", { adapter: goodAdapter });
    expect(report.counts.ok).toBe(report.case_count);
    expect(report.top_failures.length).toBe(0);
  });
});
