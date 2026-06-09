// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 3] file created under this proposal
// EpisodeDraft = a generated episode body. `status` is the generation result
// (draft|failed); `commit_status` is the storage lifecycle (generated|user_saved|
// discarded). Only user_saved drafts are committed to disk. failed is never stored.
// ===========================================================================
import { z } from "zod";

export const EPISODE_SCHEMA_VERSION = "0.1.0" as const;

export const EpisodeStatus = z.enum(["draft", "failed"]);
export type EpisodeStatus = z.infer<typeof EpisodeStatus>;

export const EpisodeCommitStatus = z.enum(["generated", "user_saved", "discarded"]);
export type EpisodeCommitStatus = z.infer<typeof EpisodeCommitStatus>;

export const EpisodeDraft = z.object({
  schema_version: z.literal(EPISODE_SCHEMA_VERSION),
  work_id: z.string().min(1),
  episode_id: z.string().min(1),
  episode_index: z.number().int().positive(),
  title: z.string().optional(),
  body_text: z.string().default(""),
  char_count: z.number().int().nonnegative().default(0),
  target_char_count: z.number().int().positive(),
  provenance: z.literal("agent_writer"),
  provider: z.string(),
  model: z.string(),
  status: EpisodeStatus,
  commit_status: EpisodeCommitStatus,
  beats_covered: z.array(z.string()).default([]),
  created_at: z.string(), // server-injected ISO8601; tests inject a fixed clock
  error_type: z.string().nullable().default(null),
  notes: z.string().optional(), // model memo only — never raw prompt/key
});
export type EpisodeDraft = z.infer<typeof EpisodeDraft>;
