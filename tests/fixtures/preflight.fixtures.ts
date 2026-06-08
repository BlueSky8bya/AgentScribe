// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 10] Phase 2 preflight fixtures
import { WorkRecord, type WorkRecord as WR } from "../../src/core/schemas/index.js";

/** A clean, lockable work (pass + canary clean, no warns). */
export function cleanWork(): WR {
  return WorkRecord.parse({
    schema_version: "0.3.0",
    public: {
      seed: {
        work_id: "w1", genre: "wuxia", mood: "tragic", background: "war world",
        pov: "third_observer", scale: "long", target_episodes: 30, episode_length: 2000,
      },
      intent: { work_id: "w1", lasting_feeling: "x", why_this_story: "x", desired_emotion: "x", final_image: "x" },
      shape: { work_id: "w1", mode: "conflict_arc" },
      characters: [],
      blueprint: { work_id: "w1", shape_ref: "conflict_arc" },
      episode_cards: [{ episode_id: "w1_ep_001", index: 1, status: "stub" }],
      character_bibles: [
        { character_id: "A", name: "A", role: "protagonist", importance_level: "core", species_or_type: "human", public_summary: "a swordsman" },
      ],
      cast_registry: [
        { character_id: "A", importance_level: "core", introduced_by: "user_seed", allowed_scope: "core", can_affect_main_plot: true },
      ],
      relationship_map: [],
      reveal_schedule: [],
      foreshadowing: [],
    },
    private: { characters: [] },
  });
}
