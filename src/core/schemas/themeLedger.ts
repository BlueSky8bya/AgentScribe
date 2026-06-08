// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3.5] Phase 2 schema: ThemeLedger
import { z } from "zod";

export const ThemeLedger = z.object({
  work_id: z.string().min(1),
  central_question: z.string().min(1),
  opposing_values: z.tuple([z.string().min(1), z.string().min(1)]),
  episode_pressure: z.array(z.string()).default([]),
  ending_arrival: z.string().optional(),
});
export type ThemeLedger = z.infer<typeof ThemeLedger>;
