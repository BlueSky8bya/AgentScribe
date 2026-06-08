// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Phase 1 StoreAdapter interface
// Data SHAPE matches future data/works/<work_id>/*.json so adapters swap without migration.
import type { WorkRecord } from "../schemas/index.js";

export interface StoreAdapter {
  save(work: WorkRecord): Promise<void>;
  load(workId: string): Promise<WorkRecord | null>;
  list(): Promise<string[]>;
}

/** Logical file layout the stored JSON mirrors (Phase 1: keys in localStorage; later: real files). */
export function workPaths(workId: string) {
  const base = `data/works/${workId}`;
  return {
    public: `${base}/public.json`,
    private: `${base}/private.json`,
  };
}
