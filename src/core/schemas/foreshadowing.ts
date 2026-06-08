// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3.5] Phase 2 schema: Foreshadowing / Payoff
import { z } from "zod";

export const Foreshadow = z.object({
  foreshadow_id: z.string().min(1),
  plant_episode: z.number().int().positive(),
  payoff_episode: z.number().int().positive().optional(), // missing => orphan foreshadow
});
export type Foreshadow = z.infer<typeof Foreshadow>;
