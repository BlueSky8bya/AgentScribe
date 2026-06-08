// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schemas barrel (9 schemas)
// 9 = 8 MVP-required + Character split into Public/Private (firewall boundary).
export * from "./seedSettings.js";
export * from "./authorialIntent.js";
export * from "./narrativeShape.js";
export * from "./character.js";
export * from "./seriesBlueprint.js";
export * from "./episodeCard.js";
export * from "./telemetry.js";
export * from "./fixture.js";

import { z } from "zod";
import { SeedSettings } from "./seedSettings.js";
import { AuthorialIntent } from "./authorialIntent.js";
import { NarrativeShape } from "./narrativeShape.js";
import { CharacterPublicSeed, CharacterPrivate } from "./character.js";
import { BasicSeriesBlueprint } from "./seriesBlueprint.js";
import { BasicEpisodeCard } from "./episodeCard.js";

/** A complete stored work. Public group is Writer-safe; private group is firewalled. */
export const WorkRecord = z.object({
  schema_version: z.literal("0.1.0"),
  public: z.object({
    seed: SeedSettings,
    intent: AuthorialIntent,
    shape: NarrativeShape,
    characters: z.array(CharacterPublicSeed).default([]),
    blueprint: BasicSeriesBlueprint,
    episode_cards: z.array(BasicEpisodeCard).default([]),
  }),
  private: z.object({
    characters: z.array(CharacterPrivate).default([]),
  }),
});
export type WorkRecord = z.infer<typeof WorkRecord>;
