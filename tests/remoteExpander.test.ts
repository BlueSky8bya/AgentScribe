// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md section 13] remote expander fallback on failure
import { describe, it, expect } from "vitest";
import { RemoteExpander } from "../src/core/expand/remoteExpander.js";
import type { ExpandInput } from "../src/core/expand/ExpanderAdapter.js";
import { SeedSettings, CharacterPublicSeed } from "../src/core/schemas/index.js";

const seed = SeedSettings.parse({
  work_id: "w", genre: "wuxia", mood: "tragic", background: "war world",
  pov: "third_observer", scale: "short", target_episodes: 5, episode_length: 5000,
});
const chars = [
  CharacterPublicSeed.parse({ character_id: "A", name: "A", role: "protagonist", one_line: "cold", gender: "male" }),
  CharacterPublicSeed.parse({ character_id: "B", name: "B", role: "ally", one_line: "loyal", gender: "female" }),
];
const input: ExpandInput = { seed, characters: chars, effective_scale: "short" };

describe("RemoteExpander", () => {
  it("falls back to deterministic when fetch throws", async () => {
    const r = new RemoteExpander({ fetchImpl: (() => Promise.reject(new Error("network"))) as typeof fetch });
    const res = await r.expand(input);
    expect(res.character_bibles).toHaveLength(2);
    expect(r.lastCost?.fallback_used).toBe(true);
  });

  it("falls back to deterministic on non-2xx (429)", async () => {
    const r = new RemoteExpander({ fetchImpl: (() => Promise.resolve({ ok: false, status: 429 } as Response)) as typeof fetch });
    const res = await r.expand(input);
    expect(res.character_bibles).toHaveLength(2);
    expect(r.lastCost?.fallback_used).toBe(true);
    expect(r.lastCost?.fallback_reason).toContain("429");
  });

  it("returns server expansion + cost on success", async () => {
    const expansion = {
      character_bibles: [], cast_registry: [], relationship_map: [],
      theme_ledger: { work_id: "w", central_question: "q", opposing_values: ["a", "b"], episode_pressure: [] },
      foreshadowing: [], private_characters: [],
    };
    const cost = {
      work_id: "w", phase: "phase3b_expansion", provider: "openai", model: "gpt-5.4-mini",
      call_count: 1, input_tokens: 100, output_tokens: 50, cached_tokens: 0, reasoning_tokens: 0,
      total_tokens: 150, unit_price_input: 0.75, unit_price_output: 4.5,
      estimated_cost_usd: 0.0003, actual_cost_usd: null, price_snapshot_date: "2026-06-09",
      fallback_used: false, fallback_reason: null,
    };
    const fetchOk = (() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ expansion, cost }) } as unknown as Response)) as typeof fetch;
    const r = new RemoteExpander({ fetchImpl: fetchOk });
    const res = await r.expand(input);
    expect(res).toBe(expansion);
    expect(r.lastCost?.fallback_used).toBe(false);
    expect(r.lastCost?.model).toBe("gpt-5.4-mini");
  });
});
