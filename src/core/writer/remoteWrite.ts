// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 2,12] file created under this proposal
// Frontend client for POST /api/write. Sends only the writer-safe contract.
// On failure surfaces a failed result (NEVER fabricates body text).
// ===========================================================================
import type { WorkRecord, EpisodeDraft } from "../schemas/index.js";
import type { CostLedgerEntry, ExpandOptions } from "../expand/remoteTypes.js";
import { buildWriterContract } from "./writerContract.js";

export interface WriteResponse {
  draft: EpisodeDraft | null;
  cost: CostLedgerEntry | null;
  error_type?: string;
}

export async function writeEpisodeRemote(
  work: WorkRecord,
  episodeIndex: number,
  options?: Pick<ExpandOptions, "provider" | "quality_pref">,
  apiBase = "",
  fetchImpl?: typeof fetch,
): Promise<WriteResponse> {
  const doFetch = fetchImpl ?? globalThis.fetch;
  const contract = buildWriterContract(work, episodeIndex); // public-only + firewall assert
  try {
    const res = await doFetch(`${apiBase}/api/write`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contract, options }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error_type?: string };
      return { draft: null, cost: null, error_type: err.error_type ?? `status_${res.status}` };
    }
    const data = (await res.json()) as { draft: EpisodeDraft; cost: CostLedgerEntry };
    return { draft: data.draft, cost: data.cost };
  } catch (e) {
    return { draft: null, cost: null, error_type: e instanceof Error ? e.message : "network_error" };
  }
}
