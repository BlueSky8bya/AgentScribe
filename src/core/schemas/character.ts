// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schemas: Character public/private split
// Firewall principle: public goes to Writer; private NEVER does. Stored in separate groups.
import { z } from "zod";

export const CharacterRole = z.enum([
  "protagonist",
  "ally",
  "mentor",
  "rival",
  "antagonist",
  "minor",
]);
export type CharacterRole = z.infer<typeof CharacterRole>;

export const Gender = z.enum(["male", "female", "nonbinary", "unspecified", "other"]);
export type Gender = z.infer<typeof Gender>;

/** Public seed — safe to pass to Writer (public_summary). */
export const CharacterPublicSeed = z.object({
  character_id: z.string().min(1),
  name: z.string().min(1),
  role: CharacterRole,
  one_line: z.string().min(1),
  // Phase 3 additions (back-compatible defaults).
  gender: Gender.default("unspecified"),
  personality_brief: z.string().default(""),
});
export type CharacterPublicSeed = z.infer<typeof CharacterPublicSeed>;

/** Private — stored separately, redacted by Prompt Firewall. Never to Writer. */
export const CharacterPrivate = z.object({
  character_id: z.string().min(1),
  private_backstory: z.string().optional(),
  secrets: z.array(z.string()).default([]),
});
export type CharacterPrivate = z.infer<typeof CharacterPrivate>;
