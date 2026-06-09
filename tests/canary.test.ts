// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 13] canary harness (mock) + aggregation
import { describe, it, expect } from "vitest";
import { runCanary, aggregateCanary, type CanaryCaseResult } from "../server/canary/runner.js";
import { CANARY_VERSION } from "../server/canary/seedBank.js";
import { DeterministicExpander } from "../src/core/expand/deterministicExpander.js";
import type { ExpandInput } from "../src/core/expand/ExpanderAdapter.js";

const det = new DeterministicExpander();
const expand = async (input: ExpandInput) => det.expand(input);

describe("Contract Canary", () => {
  it("runs the seed bank with a clean expander: no leak, schema 100%, caps ok, version recorded", async () => {
    const report = await runCanary(expand, {
      provider_id: "openai", model_id: "gpt-5.4-mini", adapter_mode: "live", status_before: "stable",
    });
    expect(report.canary_version).toBe(CANARY_VERSION);
    expect(report.case_count).toBeGreaterThan(0);
    expect(report.private_secret_leak_count).toBe(0);
    expect(report.schema_success_rate).toBe(1);
    expect(report.cap_compliance_rate).toBe(1);
    expect(report.status_after).toBe("stable");
  });

  it("any secret leak forces status_after = disabled (internal bar)", () => {
    const leaky: CanaryCaseResult[] = [
      { fixture_id: "f1", schema_ok: true, json_parse_failed: false, caps_ok: true, secret_leak_count: 1 },
    ];
    const report = aggregateCanary(leaky, {
      provider_id: "deepseek", model_id: "deepseek-pending-cheap", adapter_mode: "mock", status_before: "experimental",
    });
    expect(report.private_secret_leak_count).toBe(1);
    expect(report.status_after).toBe("disabled");
  });

  it("mock adapter (non-live) never auto-promotes to stable", () => {
    const ok: CanaryCaseResult[] = Array.from({ length: 5 }, (_, i) => ({
      fixture_id: `f${i}`, schema_ok: true, json_parse_failed: false, caps_ok: true, secret_leak_count: 0,
    }));
    const report = aggregateCanary(ok, {
      provider_id: "gemini", model_id: "gemini-pending-cheap", adapter_mode: "mock", status_before: "experimental",
    });
    expect(report.schema_success_rate).toBe(1);
    expect(report.status_after).toBe("experimental"); // mock stays experimental
  });
});
