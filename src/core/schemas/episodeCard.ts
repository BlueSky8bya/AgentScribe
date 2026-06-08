// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schema: BasicEpisodeCard
import { z } from "zod";

/** Phase 1 episode card — stub skeleton only (status fixed to "stub"). */
export const BasicEpisodeCard = z.object({
  episode_id: z.string().min(1),
  index: z.number().int().positive(),
  episode_goal: z.string().optional(),
  status: z.literal("stub"),
});
export type BasicEpisodeCard = z.infer<typeof BasicEpisodeCard>;
