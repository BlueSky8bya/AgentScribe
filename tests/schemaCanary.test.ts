// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 10] Phase 2 schema canary tests
import { describe, it, expect } from "vitest";
import { schemaCanary } from "../src/core/preflight/schemaCanary.js";
import { cleanWork } from "./fixtures/preflight.fixtures.js";

describe("schemaCanary", () => {
  it("is clean on a valid work", () => {
    expect(schemaCanary(cleanWork()).ok).toBe(true);
  });

  it("detects orphan reveal referenced by an episode card", () => {
    const w = cleanWork();
    w.public.episode_cards[0].reveal_ids = ["missing_rev"];
    const r = schemaCanary(w);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.code === "orphan_reveal")).toBe(true);
  });

  it("detects orphan relationship referenced by an episode card", () => {
    const w = cleanWork();
    w.public.episode_cards[0].relationship_beats = ["missing_rel"];
    const r = schemaCanary(w);
    expect(r.errors.some((e) => e.code === "orphan_relationship")).toBe(true);
  });

  it("detects a reveal pointing at a missing character", () => {
    const w = cleanWork();
    w.public.reveal_schedule = [{ reveal_id: "r1", character_id: "ghost", allowed_episode_range: [10, 12], reveal_mode: "full", forbidden_before: 10 }];
    const r = schemaCanary(w);
    expect(r.errors.some((e) => e.code === "missing_reveal_character")).toBe(true);
  });
});
