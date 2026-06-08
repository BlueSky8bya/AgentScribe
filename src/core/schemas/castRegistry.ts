// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3.6] Phase 2 schema: CastRegistry entry
import { z } from "zod";
import { ImportanceLevel } from "./characterBible.js";

export const IntroducedBy = z.enum(["user_seed", "agent_preflight", "agent_runtime"]);
export type IntroducedBy = z.infer<typeof IntroducedBy>;

export const AllowedScope = z.enum([
  "scene_local",
  "episode_local",
  "recurring",
  "arc_major",
  "core",
]);
export type AllowedScope = z.infer<typeof AllowedScope>;

export const CastEntry = z.object({
  character_id: z.string().min(1),
  importance_level: ImportanceLevel,
  introduced_by: IntroducedBy,
  allowed_scope: AllowedScope,
  can_affect_main_plot: z.boolean().default(false),
  promotion_status: z
    .enum(["not_allowed", "proposed", "approved", "rejected"])
    .default("not_allowed"),
});
export type CastEntry = z.infer<typeof CastEntry>;
