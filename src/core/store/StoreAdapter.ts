// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Phase 1 StoreAdapter interface
// Data SHAPE matches future data/works/<work_id>/*.json so adapters swap without migration.
import type { WorkRecord } from "../schemas/index.js";
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 3.1] episode persistence (committed only)
import type { EpisodeDraft } from "../schemas/episodeDraft.js";

export interface StoreAdapter {
  save(work: WorkRecord): Promise<void>;
  load(workId: string): Promise<WorkRecord | null>;
  list(): Promise<string[]>;
  // Episodes: only committed (user_saved) drafts are persisted here.
  saveEpisode(ep: EpisodeDraft): Promise<void>;
  loadEpisode(workId: string, episodeId: string): Promise<EpisodeDraft | null>;
  listEpisodes(workId: string): Promise<string[]>;
}

/** Logical file layout the stored JSON mirrors (Phase 1: keys in localStorage; later: real files). */
export function workPaths(workId: string) {
  const base = `data/works/${workId}`;
  return {
    public: `${base}/public.json`,
    private: `${base}/private.json`,
    episodesIndex: `${base}/episodes/_index`,
  };
}

export function episodePath(workId: string, episodeId: string) {
  return `data/works/${workId}/episodes/${episodeId}.json`;
}
