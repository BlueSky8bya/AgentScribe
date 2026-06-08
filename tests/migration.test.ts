// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 10] Phase 2 WorkRecord 0.1.0 -> 0.2.0 migration
import { describe, it, expect } from "vitest";
import { migrateWork } from "../src/core/schemas/index.js";

describe("migrateWork", () => {
  it("upgrades a 0.1.0 record to 0.2.0 with default Phase 2 fields", () => {
    const old = {
      schema_version: "0.1.0",
      public: {
        seed: { work_id: "w", genre: "g", mood: "m", background: "b", pov: "third_observer", scale: "long", target_episodes: 10, episode_length: 1000 },
        intent: { work_id: "w", lasting_feeling: "x", why_this_story: "x", desired_emotion: "x", avoid_cliches: [], final_image: "x", negative_space: [] },
        shape: { work_id: "w", mode: "conflict_arc" },
        characters: [],
        blueprint: { work_id: "w", shape_ref: "conflict_arc", arc_outline: [], character_ids: [], theme_ref: false },
        episode_cards: [],
      },
      private: { characters: [] },
    };
    const w = migrateWork(old);
    expect(w.schema_version).toBe("0.2.0");
    expect(w.public.character_bibles).toEqual([]);
    expect(w.public.lock.status).toBe("unlocked");
  });
});
