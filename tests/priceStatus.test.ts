// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 13] placeholder price not used for cost
import { describe, it, expect } from "vitest";
import { buildLedgerEntry } from "../server/cost/costLedger.js";

describe("costLedger price_status", () => {
  it("verified pricing computes real cost", () => {
    const e = buildLedgerEntry({
      work_id: "w", phase: "phase3b_expansion", provider: "openai", model: "gpt-5.4-mini",
      usage: { input_tokens: 1_000_000, output_tokens: 0 }, fallback_used: false,
    });
    expect(e.price_status).toBe("verified");
    expect(e.estimated_cost_usd).toBeCloseTo(0.75, 5);
  });

  it("placeholder pricing yields zero cost and placeholder status (not used)", () => {
    const e = buildLedgerEntry({
      work_id: "w", phase: "phase3b_expansion", provider: "gemini", model: "gemini-pending-cheap",
      usage: { input_tokens: 1_000_000, output_tokens: 1_000_000 }, fallback_used: false,
    });
    expect(e.price_status).toBe("placeholder");
    expect(e.estimated_cost_usd).toBe(0);
    expect(e.unit_price_input).toBe(0);
  });

  it("unknown model -> n/a status, zero cost", () => {
    const e = buildLedgerEntry({
      work_id: "w", phase: "phase3b_expansion", provider: "none", model: "deterministic_fallback",
      usage: { input_tokens: 0, output_tokens: 0 }, fallback_used: true, fallback_reason: "no_api_key",
    });
    expect(e.price_status).toBe("n/a");
    expect(e.estimated_cost_usd).toBe(0);
  });
});
