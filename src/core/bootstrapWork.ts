// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5] Phase 3 bootstrap: minimal seed -> auto-drafted work
import {
  WorkRecord,
  SCHEMA_VERSION,
  type SeedSettings,
  type NarrativeShape,
  type CharacterPublicSeed,
  type WorldRule,
} from "./schemas/index.js";
import { computeScaleCheck } from "./scale/scaleCheck.js";
import { buildBasicBlueprint } from "./preflight/basicBlueprint.js";
import { DeterministicExpander } from "./expand/deterministicExpander.js";
import type { ExpanderAdapter } from "./expand/ExpanderAdapter.js";
import type { StoreAdapter } from "./store/StoreAdapter.js";

export interface BootstrapInput {
  seed: SeedSettings;
  shape: NarrativeShape;
  characters: CharacterPublicSeed[];
  world_rules?: WorldRule[];
  scale_override_reason?: string;
}

/**
 * Minimal seed -> scale check -> rule-based draft (expander) -> assembled WorkRecord.
 * No LLM (Phase 3A). All generated assets are proposals the user reviews in the Editorial Room.
 */
export async function bootstrapWork(
  input: BootstrapInput,
  store: StoreAdapter,
  expander: ExpanderAdapter = new DeterministicExpander(),
): Promise<WorkRecord> {
  const scale_check = computeScaleCheck({
    declared_scale: input.seed.scale,
    target_episodes: input.seed.target_episodes,
    episode_length: input.seed.episode_length,
    scale_override_reason: input.scale_override_reason,
  });

  // Blueprint/Gates/Expander follow the effective scale, not the declared label.
  const effective_scale = scale_check.effective_scale;
  const assets = expander.expand({ seed: input.seed, characters: input.characters, effective_scale });
  const { blueprint, episode_cards } = buildBasicBlueprint(input.seed, input.shape);

  // Draft authorial intent (rest auto-generated; user edits later).
  const intent = {
    work_id: input.seed.work_id,
    lasting_feeling: `Draft: a ${input.seed.mood} aftertaste`,
    why_this_story: `Draft: explore a ${input.seed.genre} world`,
    desired_emotion: input.seed.mood,
    avoid_cliches: [],
    final_image: "Draft: closing image to be decided",
    negative_space: [],
  };

  const work = WorkRecord.parse({
    schema_version: SCHEMA_VERSION,
    public: {
      seed: input.seed,
      intent,
      shape: input.shape,
      characters: input.characters,
      blueprint,
      episode_cards,
      character_bibles: assets.character_bibles,
      cast_registry: assets.cast_registry,
      relationship_map: assets.relationship_map,
      theme_ledger: assets.theme_ledger,
      foreshadowing: assets.foreshadowing,
      world_rules: input.world_rules ?? [],
      scale_check,
    },
    private: { characters: assets.private_characters },
  });

  await store.save(work);
  return work;
}
