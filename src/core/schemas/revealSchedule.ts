// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3.6] Phase 2 schema: Character Reveal Schedule item
import { z } from "zod";

export const RevealMode = z.enum(["hint", "partial", "misdirection", "full"]);
export type RevealMode = z.infer<typeof RevealMode>;

export const RevealItem = z.object({
  reveal_id: z.string().min(1),
  character_id: z.string().min(1),
  // [start, end] episode window in which this reveal may occur.
  allowed_episode_range: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  reveal_mode: RevealMode,
  forbidden_before: z.number().int().positive(),
  payoff_episode: z.number().int().positive().optional(),
});
export type RevealItem = z.infer<typeof RevealItem>;
