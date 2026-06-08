// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3.4b] Phase 2 schema: CraftSelection (STUB only)
// Structure wired now; real Craft Trait Library is deferred. No author imitation: ids only.
import { z } from "zod";

export const SelectedTrait = z.object({
  trait_id: z.string().min(1),
  strength: z.number().min(0).max(1).default(0.5),
  reason: z.string().optional(),
});
export type SelectedTrait = z.infer<typeof SelectedTrait>;

export const CraftSelection = z.object({
  work_id: z.string().min(1),
  selected_traits: z.array(SelectedTrait).default([]),
  rejected_traits: z.array(z.object({ trait_id: z.string(), reason: z.string().optional() })).default([]),
});
export type CraftSelection = z.infer<typeof CraftSelection>;
