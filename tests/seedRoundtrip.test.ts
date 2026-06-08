// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §10] Phase 1 save→load round-trip test
import { describe, it, expect } from "vitest";
import {
  SeedSettings,
  AuthorialIntent,
  NarrativeShape,
  CharacterPublicSeed,
  CharacterPrivate,
} from "../src/core/schemas/index.js";
import { createWork } from "../src/core/createWork.js";
import { LocalStore, MemoryKv } from "../src/core/store/localStore.js";
import { seedValid } from "./fixtures/seed.fixtures.js";

describe("create + round-trip", () => {
  it("saves and loads an identical work, with deterministic episode cards", async () => {
    const store = new LocalStore(new MemoryKv());
    const seed = SeedSettings.parse(seedValid);
    const intent = AuthorialIntent.parse({
      work_id: seed.work_id,
      lasting_feeling: "loss",
      why_this_story: "honor in a broken world",
      desired_emotion: "melancholy",
      final_image: "an empty courtyard at dawn",
    });
    const shape = NarrativeShape.parse({ work_id: seed.work_id, mode: "conflict_arc" });
    const pub = [CharacterPublicSeed.parse({ character_id: "c1", name: "A", role: "protagonist", one_line: "a swordsman" })];
    const priv = [CharacterPrivate.parse({ character_id: "c1", private_backstory: "betrayed his sect", secrets: ["killed his master"] })];

    const work = await createWork({ seed, intent, shape, publicCharacters: pub, privateCharacters: priv }, store);
    expect(work.public.episode_cards).toHaveLength(50);
    expect(work.public.blueprint.arc_outline).toEqual(["setup", "rising", "climax", "resolution"]);

    const loaded = await store.load(seed.work_id);
    expect(loaded).toEqual(work);
  });
});
