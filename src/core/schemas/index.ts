// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5] Schemas barrel (Phase 1 + Phase 2)
export * from "./seedSettings.js";
export * from "./authorialIntent.js";
export * from "./narrativeShape.js";
export * from "./character.js";
export * from "./characterBible.js";
export * from "./castRegistry.js";
export * from "./relationshipMap.js";
export * from "./revealSchedule.js";
export * from "./themeLedger.js";
export * from "./foreshadowing.js";
export * from "./craftSelection.js";
export * from "./worldRule.js";
export * from "./scaleCheck.js";
export * from "./seriesBlueprint.js";
export * from "./episodeCard.js";
export * from "./episodeDraft.js";
export * from "./telemetry.js";
export * from "./fixture.js";

import { z } from "zod";
import { WorldRule } from "./worldRule.js";
import { ScaleCheck } from "./scaleCheck.js";
import { SeedSettings } from "./seedSettings.js";
import { AuthorialIntent } from "./authorialIntent.js";
import { NarrativeShape } from "./narrativeShape.js";
import { CharacterPublicSeed, CharacterPrivate } from "./character.js";
import { CharacterBible } from "./characterBible.js";
import { CastEntry } from "./castRegistry.js";
import { Relationship } from "./relationshipMap.js";
import { RevealItem } from "./revealSchedule.js";
import { ThemeLedger } from "./themeLedger.js";
import { Foreshadow } from "./foreshadowing.js";
import { CraftSelection } from "./craftSelection.js";
import { BasicSeriesBlueprint, LockZone } from "./seriesBlueprint.js";
import { BasicEpisodeCard } from "./episodeCard.js";

export const SCHEMA_VERSION = "0.3.0" as const;

/** Lock state of the Series Blueprint (Phase 2). */
export const LockState = z.object({
  status: z.enum(["unlocked", "locked"]).default("unlocked"),
  zones: z.record(z.string(), LockZone).default({}),
  acknowledged_warns: z.array(z.string()).default([]),
});
export type LockState = z.infer<typeof LockState>;

/** A complete stored work. Public group is Writer-safe; private group is firewalled. */
export const WorkRecord = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  public: z.object({
    seed: SeedSettings,
    intent: AuthorialIntent,
    shape: NarrativeShape,
    characters: z.array(CharacterPublicSeed).default([]),
    blueprint: BasicSeriesBlueprint,
    episode_cards: z.array(BasicEpisodeCard).default([]),
    // Phase 2 design assets (back-compatible defaults).
    character_bibles: z.array(CharacterBible).default([]),
    cast_registry: z.array(CastEntry).default([]),
    relationship_map: z.array(Relationship).default([]),
    reveal_schedule: z.array(RevealItem).default([]),
    foreshadowing: z.array(Foreshadow).default([]),
    theme_ledger: ThemeLedger.optional(),
    craft_selection: CraftSelection.optional(),
    lock: LockState.default({ status: "unlocked", zones: {}, acknowledged_warns: [] }),
    // Phase 3 additions (back-compatible).
    world_rules: z.array(WorldRule).default([]),
    scale_check: ScaleCheck.optional(),
  }),
  private: z.object({
    characters: z.array(CharacterPrivate).default([]),
  }),
});
export type WorkRecord = z.infer<typeof WorkRecord>;

/**
 * Migrate a raw stored object to the current schema version.
 * Chained: 0.1.0 -> 0.2.0 (Phase 2 fields) -> 0.3.0 (Phase 3 fields). Unknown fields kept.
 */
export function migrateWork(raw: unknown): WorkRecord {
  const obj = raw as { schema_version?: string; public?: Record<string, unknown>; private?: unknown };
  if (!obj?.public) return WorkRecord.parse(raw);

  let pub = obj.public as Record<string, unknown>;
  let version = obj.schema_version;

  if (version === "0.1.0") {
    pub = {
      ...pub,
      character_bibles: [], cast_registry: [], relationship_map: [],
      reveal_schedule: [], foreshadowing: [],
      lock: { status: "unlocked", zones: {}, acknowledged_warns: [] },
    };
    version = "0.2.0";
  }
  if (version === "0.2.0") {
    pub = { ...pub, world_rules: [] };
  }
  return WorkRecord.parse({ schema_version: SCHEMA_VERSION, public: pub, private: obj.private ?? { characters: [] } });
}
