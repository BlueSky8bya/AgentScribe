// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §10] Phase 1 Prompt Firewall test
// Critical Phase-1 rule: Writer payload must NOT contain private_backstory / secrets.
import { describe, it, expect } from "vitest";
import {
  WorkRecord,
  SeedSettings,
  AuthorialIntent,
  NarrativeShape,
  CharacterPublicSeed,
  CharacterPrivate,
  BasicSeriesBlueprint,
} from "../src/core/schemas/index.js";
import { packForWriter, assertNoPrivateLeak } from "../src/core/firewall/contextPackager.js";
import { seedValid } from "./fixtures/seed.fixtures.js";

function makeWork() {
  return WorkRecord.parse({
    schema_version: "0.2.0",
    public: {
      seed: SeedSettings.parse(seedValid),
      intent: AuthorialIntent.parse({
        work_id: seedValid.work_id,
        lasting_feeling: "x", why_this_story: "x", desired_emotion: "x", final_image: "x",
      }),
      shape: NarrativeShape.parse({ work_id: seedValid.work_id, mode: "conflict_arc" }),
      characters: [CharacterPublicSeed.parse({ character_id: "c1", name: "A", role: "protagonist", one_line: "a swordsman" })],
      blueprint: BasicSeriesBlueprint.parse({ work_id: seedValid.work_id, shape_ref: "conflict_arc" }),
      episode_cards: [],
    },
    private: {
      characters: [CharacterPrivate.parse({ character_id: "c1", private_backstory: "TOP SECRET PAST", secrets: ["hidden murder"] })],
    },
  });
}

describe("Prompt Firewall", () => {
  it("packForWriter excludes private fields", () => {
    const payload = packForWriter(makeWork());
    const json = JSON.stringify(payload);
    expect(json).not.toContain("TOP SECRET PAST");
    expect(json).not.toContain("hidden murder");
    expect(json).not.toContain("private_backstory");
    expect(json).not.toContain("secrets");
  });

  it("assertNoPrivateLeak passes clean payload and throws on leak", () => {
    const payload = packForWriter(makeWork());
    expect(() => assertNoPrivateLeak(payload)).not.toThrow();
    expect(() => assertNoPrivateLeak({ secrets: ["x"] })).toThrow(/private field leaked/);
  });
});
