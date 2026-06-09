// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md section 13] cost from price table; no key/prompt in ledger
import { describe, it, expect } from "vitest";
import { buildLedgerEntry } from "../server/cost/costLedger.js";

describe("costLedger.buildLedgerEntry", () => {
  it("computes USD cost from the price table and token counts", () => {
    const e = buildLedgerEntry({
      work_id: "w", phase: "phase3b_expansion", provider: "openai", model: "gpt-5.4-mini",
      usage: { input_tokens: 1_000_000, output_tokens: 1_000_000 }, fallback_used: false,
    });
    // gpt-5.4-mini: $0.75 input + $4.50 output per 1M -> 5.25
    expect(e.estimated_cost_usd).toBeCloseTo(5.25, 5);
    expect(e.total_tokens).toBe(2_000_000);
    expect(e.price_snapshot_date).toBe("2026-06-09");
    expect(e.fallback_used).toBe(false);
  });

  it("never stores key or raw prompt fields", () => {
    const e = buildLedgerEntry({
      work_id: "w", phase: "phase3b_expansion", provider: "openai", model: "gpt-5.4",
      usage: { input_tokens: 10, output_tokens: 10 }, fallback_used: false,
    });
    const keys = Object.keys(e);
    for (const bad of ["api_key", "apiKey", "key", "prompt", "messages", "authorization"]) {
      expect(keys).not.toContain(bad);
    }
    expect(JSON.stringify(e)).not.toMatch(/sk-/);
  });

  it("records fallback with reason and zero cost", () => {
    const f = buildLedgerEntry({
      work_id: "w", phase: "phase3b_expansion", provider: "none", model: "deterministic_fallback",
      usage: { input_tokens: 0, output_tokens: 0 }, fallback_used: true, fallback_reason: "no_api_key",
    });
    expect(f.fallback_used).toBe(true);
    expect(f.fallback_reason).toBe("no_api_key");
    expect(f.estimated_cost_usd).toBe(0);
  });
});
