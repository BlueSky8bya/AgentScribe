// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md section 13] model router tier selection + no key leak
import { describe, it, expect } from "vitest";
import { route } from "../server/modelRouter.js";

describe("modelRouter.route", () => {
  it("picks cheap for short/low-risk", () => {
    expect(route({ effective_scale: "short" }).tier).toBe("cheap");
    expect(route({ effective_scale: "medium" }).tier).toBe("cheap");
  });

  it("picks quality for long/series or high risk or quality_pref", () => {
    expect(route({ effective_scale: "long" }).tier).toBe("quality");
    expect(route({ effective_scale: "series" }).tier).toBe("quality");
    expect(route({ effective_scale: "short", risk_level: "high" }).tier).toBe("quality");
    expect(route({ effective_scale: "short", quality_pref: "high" }).tier).toBe("quality");
  });

  it("budget save wins (cost) even with quality preference", () => {
    expect(route({ effective_scale: "long", budget_class: "save" }).tier).toBe("cheap");
    expect(route({ effective_scale: "long", budget_class: "save", quality_pref: "high" }).tier).toBe("cheap");
  });

  it("never exposes the API key in the decision", () => {
    const d = route({ effective_scale: "long" });
    const keys = Object.keys(d);
    expect(keys).not.toContain("key");
    expect(keys).not.toContain("apiKey");
    expect(keys).not.toContain("api_key");
    expect(JSON.stringify(d)).not.toMatch(/sk-/);
    expect(d.provider).toBe("openai");
  });
});
