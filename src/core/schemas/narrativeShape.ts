// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schema: NarrativeShape
import { z } from "zod";

export const ShapeMode = z.enum([
  "conflict_arc",
  "kishotenketsu",
  "mystery_reveal",
  "journey_return",
  "slice_of_life_accumulation",
]);
export type ShapeMode = z.infer<typeof ShapeMode>;

/** Narrative Shape Mode — drives blueprint arc + episode card layout. */
export const NarrativeShape = z.object({
  work_id: z.string().min(1),
  mode: ShapeMode,
});
export type NarrativeShape = z.infer<typeof NarrativeShape>;
