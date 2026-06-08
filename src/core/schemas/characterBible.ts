// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3.6] Phase 2 schema: CharacterBible (public group)
// Firewall: only public fields live here. private_backstory/secrets stay in CharacterPrivate (Phase 1).
import { z } from "zod";
import { CharacterRole } from "./character.js";

export const ImportanceLevel = z.enum(["core", "major", "supporting", "minor", "cameo"]);
export type ImportanceLevel = z.infer<typeof ImportanceLevel>;

export const SpeciesType = z.enum([
  "human",
  "beastkin",
  "dragonkin",
  "spirit",
  "talking_animal",
  "android",
  "humanoid",
  "alien",
  "other",
]);
export type SpeciesType = z.infer<typeof SpeciesType>;

export const CharacterBible = z.object({
  character_id: z.string().min(1),
  name: z.string().min(1),
  role: CharacterRole,
  importance_level: ImportanceLevel,
  species_or_type: SpeciesType.default("human"),
  public_summary: z.string().min(1),
  // Non-human characters must declare rules (ability limits / cost / social result).
  species_rules: z.array(z.string()).default([]),
});
export type CharacterBible = z.infer<typeof CharacterBible>;
