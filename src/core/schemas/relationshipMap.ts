// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3.6] Phase 2 schema: RelationshipMap entry
import { z } from "zod";

export const PlannedTurn = z.object({
  episode_range: z.string().min(1), // e.g. "early" | "middle" | "late"
  change: z.string().min(1),
});
export type PlannedTurn = z.infer<typeof PlannedTurn>;

export const Relationship = z.object({
  relationship_id: z.string().min(1),
  from: z.string().min(1), // character_id
  to: z.string().min(1), // character_id
  relationship_type: z.string().min(1),
  initial_state: z.string().min(1),
  planned_turns: z.array(PlannedTurn).default([]),
});
export type Relationship = z.infer<typeof Relationship>;
