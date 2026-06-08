// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 8] Phase 3 schema: WorldRule (Canonical)
import { z } from "zod";

export const WorldRule = z.object({
  rule_type: z.enum(["absolute_forbidden", "general"]),
  content: z.string().min(1),
});
export type WorldRule = z.infer<typeof WorldRule>;
