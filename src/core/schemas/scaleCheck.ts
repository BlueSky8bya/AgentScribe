// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3.2] Phase 3 schema: ScaleCheck (internal, never shown raw to user)
import { z } from "zod";
import { ScaleMode } from "./seedSettings.js";

export const ScaleConsistency = z.enum(["ok", "warn", "blocking_warn"]);
export type ScaleConsistency = z.infer<typeof ScaleConsistency>;

export const ScaleCheck = z.object({
  declared_scale: ScaleMode,
  target_episodes: z.number().int().positive(),
  episode_length: z.number().int().positive(),
  episode_length_unit: z.literal("ko_chars").default("ko_chars"),
  planned_total_length: z.number().int().nonnegative(),
  effective_scale: ScaleMode,
  scale_consistency: ScaleConsistency,
  scale_override_reason: z.string().optional(),
});
export type ScaleCheck = z.infer<typeof ScaleCheck>;
