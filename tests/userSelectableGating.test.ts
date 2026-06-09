// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2_live_provider_rollout_v001.md section 1.1,13] live != user-selectable; canary caps
import { describe, it, expect, afterEach } from "vitest";
import { CAPABILITY_MATRIX, canRunRealGeneration } from "../server/providers/capabilityMatrix.js";
import { withinCaps, DEFAULT_CANARY_CAPS, runCanaryBounded } from "../server/canary/runner.js";
import { DeterministicExpander } from "../src/core/expand/deterministicExpander.js";
import type { ExpandInput } from "../src/core/expand/ExpanderAdapter.js";

const SAVE = { ...process.env };
afterEach(() => { process.env = { ...SAVE }; });

describe("live != user-selectable", () => {
  it("Gemini is adapter_mode=live but NOT user_selectable (still gated); Claude promoted", () => {
    for (const e of CAPABILITY_MATRIX.filter((x) => x.provider_id === "gemini")) {
      expect(e.adapter_mode).toBe("live");
      expect(e.user_selectable).toBe(false);
      expect(e.can_generate_real_output).toBe(false);
    }
    for (const e of CAPABILITY_MATRIX.filter((x) => x.provider_id === "claude")) {
      expect(e.user_selectable).toBe(true);
      expect(e.can_generate_real_output).toBe(true);
    }
  });

  it("gated-live provider (gemini) rejected in normal use; allowed only with dev override + key", () => {
    process.env.GEMINI_API_KEY = "x";
    delete process.env.ALLOW_MOCK_PROVIDERS;
    expect(canRunRealGeneration("gemini")).toBe(false); // gated, no override
    process.env.ALLOW_MOCK_PROVIDERS = "1";
    expect(canRunRealGeneration("gemini")).toBe(true); // dev override
  });

  it("promoted provider (claude) runs with key, no override needed", () => {
    process.env.ANTHROPIC_API_KEY = "x";
    delete process.env.ALLOW_MOCK_PROVIDERS;
    expect(canRunRealGeneration("claude")).toBe(true);
  });

  it("openai stays user-selectable/stable", () => {
    const e = CAPABILITY_MATRIX.find((x) => x.provider_id === "openai");
    expect(e?.user_selectable).toBe(true);
    expect(e?.can_generate_real_output).toBe(true);
  });
});

describe("canary caps", () => {
  it("withinCaps respects call and cost ceilings", () => {
    expect(withinCaps(30, 5, DEFAULT_CANARY_CAPS)).toBe(true);
    expect(withinCaps(31, 0, DEFAULT_CANARY_CAPS)).toBe(false);
    expect(withinCaps(1, 5.01, DEFAULT_CANARY_CAPS)).toBe(false);
  });

  it("runCanaryBounded aborts once the cost cap is breached", async () => {
    const det = new DeterministicExpander();
    // Each call reports $3 -> 2nd call pushes cumulative to $6 > $5 cap.
    const expandCost = async (input: ExpandInput) => ({ out: det.expand(input), cost_usd: 3 });
    const res = await runCanaryBounded(expandCost, {
      provider_id: "openai", model_id: "gpt-5.4", adapter_mode: "live", status_before: "stable",
    });
    expect(res.aborted).toBe(true);
    expect(res.cost_usd).toBeLessThanOrEqual(6);
    expect(res.calls).toBeLessThan(5); // stopped early, not all 5 fixtures
  });
});
