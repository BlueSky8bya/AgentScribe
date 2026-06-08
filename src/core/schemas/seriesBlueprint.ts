// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5] Phase 1 + Phase 2 schema: SeriesBlueprint
import { z } from "zod";
import { ShapeMode } from "./narrativeShape.js";

export const LockZone = z.enum(["hard", "soft", "fluid"]);
export type LockZone = z.infer<typeof LockZone>;

/** Phase 1 basic blueprint — deterministic skeleton (no LLM). Phase 2 adds refs + lock zones. */
export const BasicSeriesBlueprint = z.object({
  work_id: z.string().min(1),
  theme_statement: z.string().optional(),
  shape_ref: ShapeMode,
  arc_outline: z.array(z.string()).default([]),
  // Phase 2 extensions (back-compatible: default empty).
  character_ids: z.array(z.string()).default([]),
  theme_ref: z.boolean().default(false),
});
export type BasicSeriesBlueprint = z.infer<typeof BasicSeriesBlueprint>;
