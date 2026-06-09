// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 13] router resolves via matrix; mock adapter valid JSON
import { describe, it, expect } from "vitest";
import { route } from "../server/modelRouter.js";
import { MockAdapter } from "../server/providers/mockAdapter.js";

describe("modelRouter (multi-provider)", () => {
  it("resolves provider+tier to the matrix model (allowlist)", () => {
    expect(route({ provider: "openai", effective_scale: "short" })).toMatchObject({ provider: "openai", model: "gpt-5.4-mini", tier: "cheap" });
    expect(route({ provider: "openai", effective_scale: "long" })).toMatchObject({ provider: "openai", model: "gpt-5.4", tier: "quality" });
    expect(route({ effective_scale: "short" }).provider).toBe("openai"); // default provider
  });

  it("maps providers to their matrix model (gemini live, deepseek placeholder)", () => {
    expect(route({ provider: "gemini", effective_scale: "short" }).model).toBe("gemini-2.5-flash-lite");
    expect(route({ provider: "claude", effective_scale: "long" }).model).toBe("claude-sonnet-4-6");
    expect(route({ provider: "deepseek", effective_scale: "short" }).model).toBe("deepseek-pending-cheap");
  });

  it("decision never carries a key", () => {
    const d = route({ provider: "openai", effective_scale: "long" });
    expect(JSON.stringify(d)).not.toMatch(/sk-/);
    expect(Object.keys(d)).not.toContain("key");
  });
});

describe("MockAdapter", () => {
  it("returns parseable LlmDraft JSON with zero usage (no external call)", async () => {
    const r = await new MockAdapter("gemini").generate({ system: "s", user: "u" }, "gemini-pending-cheap");
    const parsed = JSON.parse(r.rawJson);
    expect(parsed).toHaveProperty("characters");
    expect(parsed).toHaveProperty("theme");
    expect(parsed).toHaveProperty("relationships");
    expect(r.usage.input_tokens).toBe(0);
    expect(r.usage.output_tokens).toBe(0);
  });
});
