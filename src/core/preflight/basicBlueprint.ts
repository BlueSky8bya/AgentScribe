// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §6] Phase 1 deterministic basic blueprint (no LLM)
import type { SeedSettings } from "../schemas/seedSettings.js";
import type { NarrativeShape } from "../schemas/narrativeShape.js";
import { BasicSeriesBlueprint } from "../schemas/seriesBlueprint.js";
import { BasicEpisodeCard } from "../schemas/episodeCard.js";

/** Deterministic arc skeleton per shape mode. Content (real beats) is filled in Phase 2. */
const ARC_OUTLINE: Record<NarrativeShape["mode"], string[]> = {
  conflict_arc: ["setup", "rising", "climax", "resolution"],
  kishotenketsu: ["ki", "sho", "ten", "ketsu"],
  mystery_reveal: ["hook", "clues", "twist", "reveal"],
  journey_return: ["departure", "trials", "ordeal", "return"],
  slice_of_life_accumulation: ["intro", "accumulation", "shift", "afterglow"],
};

export function buildBasicBlueprint(
  seed: SeedSettings,
  shape: NarrativeShape,
): { blueprint: BasicSeriesBlueprint; episode_cards: BasicEpisodeCard[] } {
  const blueprint = BasicSeriesBlueprint.parse({
    work_id: seed.work_id,
    shape_ref: shape.mode,
    arc_outline: ARC_OUTLINE[shape.mode],
  });

  const episode_cards = Array.from({ length: seed.target_episodes }, (_, i) =>
    BasicEpisodeCard.parse({
      episode_id: `${seed.work_id}_ep_${String(i + 1).padStart(3, "0")}`,
      index: i + 1,
      status: "stub" as const,
    }),
  );

  return { blueprint, episode_cards };
}
