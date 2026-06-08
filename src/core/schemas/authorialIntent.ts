// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schema: AuthorialIntent
import { z } from "zod";

/** Authorial Intent Bible (immutable). Why/feeling/negative-space, set before blueprint. */
export const AuthorialIntent = z.object({
  work_id: z.string().min(1),
  lasting_feeling: z.string().min(1),
  why_this_story: z.string().min(1),
  desired_emotion: z.string().min(1),
  avoid_cliches: z.array(z.string()).default([]),
  final_image: z.string().min(1),
  negative_space: z.array(z.string()).default([]),
});
export type AuthorialIntent = z.infer<typeof AuthorialIntent>;
