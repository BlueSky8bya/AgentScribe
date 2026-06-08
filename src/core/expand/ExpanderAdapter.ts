// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 7] Phase 3 Expander interface
// 3A: deterministic implementation. 3B: swap with an LLM implementation behind a server (same interface).
import type { SeedSettings } from "../schemas/seedSettings.js";
import type { CharacterPublicSeed, CharacterPrivate } from "../schemas/character.js";
import type { CharacterBible } from "../schemas/characterBible.js";
import type { CastEntry } from "../schemas/castRegistry.js";
import type { Relationship } from "../schemas/relationshipMap.js";
import type { ThemeLedger } from "../schemas/themeLedger.js";
import type { Foreshadow } from "../schemas/foreshadowing.js";
import type { ScaleMode } from "../schemas/seedSettings.js";

export interface ExpandInput {
  seed: SeedSettings;
  characters: CharacterPublicSeed[];
  effective_scale: ScaleMode;
}

/** Design-asset draft. All items are proposals (provenance agent_preflight); user edits/accepts/rejects. */
export interface ExpansionResult {
  character_bibles: CharacterBible[];
  cast_registry: CastEntry[];
  relationship_map: Relationship[];
  theme_ledger: ThemeLedger;
  foreshadowing: Foreshadow[];
  private_characters: CharacterPrivate[];
}

export interface ExpanderAdapter {
  expand(input: ExpandInput): ExpansionResult;
}
