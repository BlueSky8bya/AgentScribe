// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schema: SeedSettings
import { z } from "zod";

export const ScaleMode = z.enum(["short", "medium", "long", "series"]);
export type ScaleMode = z.infer<typeof ScaleMode>;

export const PovMode = z.enum([
  "first_protagonist",
  "first_observer",
  "third_observer",
  "omniscient",
  "alternating",
]);
export type PovMode = z.infer<typeof PovMode>;

/** Immutable user seed = Canonical Store input. Agents must not edit. */
export const SeedSettings = z.object({
  work_id: z.string().min(1),
  title: z.string().optional(),
  genre: z.string().min(1),
  mood: z.string().min(1),
  background: z.string().min(1),
  pov: PovMode,
  scale: ScaleMode,
  target_episodes: z.number().int().positive(),
  episode_length: z.number().int().positive(),
});
export type SeedSettings = z.infer<typeof SeedSettings>;
