// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §6] Phase 1 create-work orchestration
import {
  WorkRecord,
  SCHEMA_VERSION,
  type SeedSettings,
  type AuthorialIntent,
  type NarrativeShape,
  type CharacterPublicSeed,
  type CharacterPrivate,
} from "./schemas/index.js";
import { buildBasicBlueprint } from "./preflight/basicBlueprint.js";
import type { StoreAdapter } from "./store/StoreAdapter.js";

export interface CreateWorkInput {
  seed: SeedSettings;
  intent: AuthorialIntent;
  shape: NarrativeShape;
  publicCharacters: CharacterPublicSeed[];
  privateCharacters: CharacterPrivate[];
}

/** Validate → deterministic blueprint → assemble WorkRecord → persist (public/private split). */
export async function createWork(
  input: CreateWorkInput,
  store: StoreAdapter,
): Promise<WorkRecord> {
  const { blueprint, episode_cards } = buildBasicBlueprint(input.seed, input.shape);

  const work = WorkRecord.parse({
    schema_version: SCHEMA_VERSION,
    public: {
      seed: input.seed,
      intent: input.intent,
      shape: input.shape,
      characters: input.publicCharacters,
      blueprint,
      episode_cards,
    },
    private: {
      characters: input.privateCharacters,
    },
  });

  await store.save(work);
  return work;
}
