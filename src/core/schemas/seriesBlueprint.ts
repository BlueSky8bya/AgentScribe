// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schema: BasicSeriesBlueprint
import { z } from "zod";
import { ShapeMode } from "./narrativeShape.js";

/** Phase 1 basic blueprint — deterministic skeleton (no LLM). Content filled in Phase 2. */
export const BasicSeriesBlueprint = z.object({
  work_id: z.string().min(1),
  theme_statement: z.string().optional(),
  shape_ref: ShapeMode,
  arc_outline: z.array(z.string()).default([]),
});
export type BasicSeriesBlueprint = z.infer<typeof BasicSeriesBlueprint>;
