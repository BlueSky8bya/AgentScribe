// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 10] Phase 2 lock + revision-impact tests
import { describe, it, expect } from "vitest";
import { lockBlueprint } from "../src/core/preflight/lockBlueprint.js";
import { revisionImpact } from "../src/core/preflight/revisionImpact.js";
import { cleanWork } from "./fixtures/preflight.fixtures.js";

describe("lockBlueprint", () => {
  it("locks a clean work and tags zones", () => {
    const r = lockBlueprint(cleanWork());
    expect(r.locked).toBe(true);
    expect(r.work?.public.lock.status).toBe("locked");
    expect(r.work?.public.lock.zones.theme_statement).toBe("hard");
  });

  it("refuses to lock on reject (orphan foreshadow)", () => {
    const w = cleanWork();
    w.public.foreshadowing = [{ foreshadow_id: "fs1", plant_episode: 2 }];
    const r = lockBlueprint(w);
    expect(r.locked).toBe(false);
    expect(r.reasons.some((s) => s.includes("foreshadow_payoff"))).toBe(true);
  });

  it("blocks a pure warn until acknowledged, then locks", () => {
    const w = cleanWork();
    w.public.relationship_map = [{ relationship_id: "rel1", from: "A", to: "A", relationship_type: "ally", initial_state: "x", planned_turns: [] }];
    const first = lockBlueprint(w);
    expect(first.locked).toBe(false);
    expect(first.needs_ack).toContain("relationship_planned_turns");

    const second = lockBlueprint(w, ["relationship_planned_turns"]);
    expect(second.locked).toBe(true);
  });

  it("refuses to lock on a canary error", () => {
    const w = cleanWork();
    w.public.episode_cards[0].reveal_ids = ["missing_rev"];
    const r = lockBlueprint(w);
    expect(r.locked).toBe(false);
    expect(r.reasons.some((s) => s.startsWith("canary:"))).toBe(true);
  });
});

describe("revisionImpact", () => {
  it("lists impacted episode cards for a changed reveal", () => {
    const w = cleanWork();
    w.public.reveal_schedule = [{ reveal_id: "rev1", character_id: "A", allowed_episode_range: [18, 25], reveal_mode: "full", forbidden_before: 18 }];
    w.public.episode_cards = [{ episode_id: "w1_ep_020", index: 20, status: "stub", reveal_ids: ["rev1"], relationship_beats: [] }];
    const r = revisionImpact(w, { kind: "reveal", id: "rev1" });
    expect(r.impacted.episode_cards).toContain("w1_ep_020");
    expect(r.recheck_scope).toContain("rerun:candidate_gates");
  });
});
