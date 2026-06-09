// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2b_provider_canary_promotion_v001.md section 9] invariant + canary promotion logic (no network)
import { describe, it, expect } from "vitest";
import { CAPABILITY_MATRIX, expectedCanGenerate } from "../server/providers/capabilityMatrix.js";
import { runProviderCanary } from "../server/canary/runCli.js";
import { payloadClassOk, splitLatency } from "../server/canary/runner.js";
import { DeterministicExpander } from "../src/core/expand/deterministicExpander.js";
import type { ExpandInput } from "../src/core/expand/ExpanderAdapter.js";

const det = new DeterministicExpander();
const latencies = [
  { latency_ms: 800, is_first_request: true },
  { latency_ms: 120, is_first_request: false },
  { latency_ms: 140, is_first_request: false },
];

describe("matrix invariant", () => {
  it("can_generate_real_output === (adapter_mode==='live' && user_selectable) for every entry", () => {
    for (const e of CAPABILITY_MATRIX) {
      expect(e.can_generate_real_output).toBe(expectedCanGenerate(e));
    }
  });
});

describe("payloadClassOk", () => {
  it("true for public-only canary inputs", () => {
    const input: ExpandInput = {
      seed: { work_id: "w", genre: "g", mood: "m", background: "b", pov: "third_observer", scale: "short", target_episodes: 5, episode_length: 5000 } as ExpandInput["seed"],
      characters: [],
      effective_scale: "short",
    };
    expect(payloadClassOk(input)).toBe(true);
  });
  it("false if a private field leaks into the payload object", () => {
    const bad = { seed: {}, characters: [{ private_backstory: "x" }], effective_scale: "short" } as unknown as ExpandInput;
    expect(payloadClassOk(bad)).toBe(false);
  });
});

describe("splitLatency", () => {
  it("separates first request from subsequent p50/p95", () => {
    const s = splitLatency(latencies);
    expect(s.first_request_latency_ms).toBe(800);
    expect(s.subsequent_p50_ms).toBeGreaterThan(0);
    expect(s.subsequent_p95_ms).toBeGreaterThanOrEqual(s.subsequent_p50_ms);
  });
});

describe("runProviderCanary (injected expandCost — no network)", () => {
  it("PASS when clean: leak=0, schema=100%, fallback=0, payload ok", async () => {
    const out = await runProviderCanary("claude", {
      expandCost: async (input: ExpandInput) => ({ out: det.expand(input), cost_usd: 0.01, fallback_used: false }),
      latencies,
    });
    expect(out.payload_class_ok).toBe(true);
    expect(out.report.private_secret_leak_count).toBe(0);
    expect(out.fallback_rate).toBe(0);
    expect(out.verdict.pass).toBe(true);
  });

  it("FAIL when any call fell back (fallback_rate>0)", async () => {
    const out = await runProviderCanary("gemini", {
      expandCost: async (input: ExpandInput) => ({ out: det.expand(input), cost_usd: 0, fallback_used: true }),
      latencies,
    });
    expect(out.verdict.pass).toBe(false);
    expect(out.verdict.reasons.some((r) => r.includes("fallback"))).toBe(true);
  });

  it("output carries no raw seed payload or key", async () => {
    const out = await runProviderCanary("claude", {
      expandCost: async (input: ExpandInput) => ({ out: det.expand(input), cost_usd: 0.01, fallback_used: false }),
      latencies,
    });
    const json = JSON.stringify(out);
    expect(json).not.toContain("몰락한"); // a seed background substring
    expect(json).not.toMatch(/sk-/);
  });
});
