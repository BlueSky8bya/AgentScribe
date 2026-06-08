// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 10] Phase 2 candidate gates tests
import { describe, it, expect } from "vitest";
import { candidateGates } from "../src/core/preflight/candidateGates.js";
import { cleanWork } from "./fixtures/preflight.fixtures.js";

describe("candidateGates", () => {
  it("passes a clean design (only the deferred skip finding)", () => {
    const r = candidateGates(cleanWork());
    expect(r.verdict).toBe("pass");
    expect(r.findings.every((f) => f.severity === "skip")).toBe(true);
  });

  it("fatal-rejects when a core character has no Character Bible", () => {
    const w = cleanWork();
    w.public.character_bibles = [];
    const r = candidateGates(w);
    expect(r.verdict).toBe("reject");
    expect(r.findings.some((f) => f.axis === "character_bible_completeness" && f.severity === "fatal")).toBe(true);
  });

  it("rejects orphan foreshadow (plant without payoff)", () => {
    const w = cleanWork();
    w.public.foreshadowing = [{ foreshadow_id: "fs1", plant_episode: 2 }];
    const r = candidateGates(w);
    expect(r.verdict).toBe("reject");
    expect(r.findings.some((f) => f.axis === "foreshadow_payoff" && f.severity === "reject")).toBe(true);
  });

  it("warns on high early-reveal density", () => {
    const w = cleanWork();
    w.public.reveal_schedule = [1, 2, 3].map((n) => ({
      reveal_id: `rev${n}`, character_id: "A", allowed_episode_range: [1, 5] as [number, number],
      reveal_mode: "hint" as const, forbidden_before: 1,
    }));
    const r = candidateGates(w);
    expect(r.verdict).toBe("warn");
    expect(r.findings.some((f) => f.axis === "early_reveal_density" && f.severity === "warn")).toBe(true);
  });
});
