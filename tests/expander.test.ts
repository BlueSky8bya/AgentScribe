// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 10] Phase 3A deterministic expander tests
import { describe, it, expect } from "vitest";
import { DeterministicExpander } from "../src/core/expand/deterministicExpander.js";
import { bootstrapWork } from "../src/core/bootstrapWork.js";
import { LocalStore, MemoryKv } from "../src/core/store/localStore.js";
import { SeedSettings, NarrativeShape, CharacterPublicSeed } from "../src/core/schemas/index.js";

const seed = SeedSettings.parse({
  work_id: "w", genre: "wuxia", mood: "tragic", background: "war world",
  pov: "third_observer", scale: "long", target_episodes: 60, episode_length: 5000,
});
const chars = [
  CharacterPublicSeed.parse({ character_id: "A", name: "A", role: "protagonist", one_line: "a cold swordsman", gender: "male", personality_brief: "cold" }),
  CharacterPublicSeed.parse({ character_id: "B", name: "B", role: "ally", one_line: "a loyal friend", gender: "female" }),
];

describe("DeterministicExpander", () => {
  it("drafts bibles, cast, relationships, theme, foreshadow", () => {
    const r = new DeterministicExpander().expand({ seed, characters: chars, effective_scale: "long" });
    expect(r.character_bibles).toHaveLength(2);
    expect(r.character_bibles[0].importance_level).toBe("core"); // protagonist
    expect(r.relationship_map).toHaveLength(1); // A <-> B
    expect(r.foreshadowing.length).toBeGreaterThan(0);
    expect(r.theme_ledger.work_id).toBe("w");
  });

  it("keeps private drafts out of the public group via bootstrap", async () => {
    const store = new LocalStore(new MemoryKv());
    const shape = NarrativeShape.parse({ work_id: "w", mode: "conflict_arc" });
    const work = await bootstrapWork({ seed, shape, characters: chars }, store);
    expect(work.public.scale_check?.effective_scale).toBe("long");
    expect(work.private.characters.length).toBe(2);
    // Public group must not contain the drafted private backstory text.
    expect(JSON.stringify(work.public)).not.toContain("hidden motive");
  });
});
