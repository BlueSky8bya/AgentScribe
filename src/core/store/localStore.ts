// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Phase 1 localStorage StoreAdapter
// Stores public/private groups under keys mirroring data/works/<id>/{public,private}.json.
import { WorkRecord, migrateWork } from "../schemas/index.js";
import { EpisodeDraft } from "../schemas/episodeDraft.js";
import { workPaths, episodePath, type StoreAdapter } from "./StoreAdapter.js";

/** Minimal key/value backend. Defaults to browser localStorage; injectable for tests. */
export interface KvBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  keys(): string[];
}

export class MemoryKv implements KvBackend {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  keys() {
    return [...this.m.keys()];
  }
}

function browserKv(): KvBackend {
  return {
    getItem: (k) => localStorage.getItem(k),
    setItem: (k, v) => localStorage.setItem(k, v),
    keys: () => Object.keys(localStorage),
  };
}

const INDEX_KEY = "data/works/_index";

export class LocalStore implements StoreAdapter {
  private kv: KvBackend;
  constructor(kv: KvBackend = browserKv()) {
    this.kv = kv;
  }

  async save(work: WorkRecord): Promise<void> {
    const parsed = WorkRecord.parse(work); // validate before persist
    const id = parsed.public.seed.work_id;
    const p = workPaths(id);
    // Separate groups: public (Writer-safe) vs private (firewalled).
    this.kv.setItem(p.public, JSON.stringify({ schema_version: parsed.schema_version, ...parsed.public }));
    this.kv.setItem(p.private, JSON.stringify(parsed.private));
    const ids = new Set(this.list_ids());
    ids.add(id);
    this.kv.setItem(INDEX_KEY, JSON.stringify([...ids]));
  }

  async load(workId: string): Promise<WorkRecord | null> {
    const p = workPaths(workId);
    const pub = this.kv.getItem(p.public);
    const priv = this.kv.getItem(p.private);
    if (!pub || !priv) return null;
    const pubObj = JSON.parse(pub) as Record<string, unknown>;
    const { schema_version, ...publicGroup } = pubObj;
    // migrateWork upgrades older stored versions (e.g. 0.1.0) before validation.
    return migrateWork({
      schema_version,
      public: publicGroup,
      private: JSON.parse(priv),
    });
  }

  async list(): Promise<string[]> {
    return this.list_ids();
  }

  // [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 3.1]
  // Only committed (user_saved) drafts should be saved; failed is never persisted.
  async saveEpisode(ep: EpisodeDraft): Promise<void> {
    const parsed = EpisodeDraft.parse(ep);
    if (parsed.status === "failed") throw new Error("refuse_to_save_failed_episode");
    this.kv.setItem(episodePath(parsed.work_id, parsed.episode_id), JSON.stringify(parsed));
    const idxKey = workPaths(parsed.work_id).episodesIndex;
    const ids = new Set(this.episode_ids(parsed.work_id));
    ids.add(parsed.episode_id);
    this.kv.setItem(idxKey, JSON.stringify([...ids]));
  }

  async loadEpisode(workId: string, episodeId: string): Promise<EpisodeDraft | null> {
    const raw = this.kv.getItem(episodePath(workId, episodeId));
    return raw ? EpisodeDraft.parse(JSON.parse(raw)) : null;
  }

  async listEpisodes(workId: string): Promise<string[]> {
    return this.episode_ids(workId);
  }

  private episode_ids(workId: string): string[] {
    const raw = this.kv.getItem(workPaths(workId).episodesIndex);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }

  private list_ids(): string[] {
    const raw = this.kv.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }
}
