// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5] Phase 1 + Phase 2 schema: BasicEpisodeCard
import { z } from "zod";

/** Phase 1 stub card; Phase 2 adds reveal/relationship refs (back-compatible defaults). */
export const BasicEpisodeCard = z.object({
  episode_id: z.string().min(1),
  index: z.number().int().positive(),
  episode_goal: z.string().optional(),
  status: z.literal("stub"),
  reveal_ids: z.array(z.string()).default([]),
  relationship_beats: z.array(z.string()).default([]),
});
export type BasicEpisodeCard = z.infer<typeof BasicEpisodeCard>;
