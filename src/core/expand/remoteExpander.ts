// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Frontend expander that calls the server /api/expand. On ANY failure (network,
// non-2xx, bad body) it falls back to the deterministic Phase-3A expander.
// The provider API key lives ONLY on the server; this code never sees it.
// ===========================================================================
import type { ExpanderAdapter, ExpandInput, ExpansionResult } from "./ExpanderAdapter.js";
import { DeterministicExpander } from "./deterministicExpander.js";
import { fallbackCost, type CostLedgerEntry, type ExpandOptions, type ExpandResponse } from "./remoteTypes.js";

export interface RemoteExpanderOptions {
  apiBase?: string;
  fetchImpl?: typeof fetch;
  options?: ExpandOptions;
}

export class RemoteExpander implements ExpanderAdapter {
  /** Cost of the last expand() call. Read by the UI (WorkCostPanel) after bootstrap. */
  lastCost: CostLedgerEntry | null = null;

  private apiBase: string;
  private fetchImpl: typeof fetch | undefined;
  private options: ExpandOptions | undefined;

  constructor(opts: RemoteExpanderOptions = {}) {
    this.apiBase = opts.apiBase ?? "";
    this.fetchImpl = opts.fetchImpl;
    this.options = opts.options;
  }

  async expand(input: ExpandInput): Promise<ExpansionResult> {
    const doFetch = this.fetchImpl ?? globalThis.fetch;
    try {
      if (!doFetch) throw new Error("no_fetch");
      const res = await doFetch(`${this.apiBase}/api/expand`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Only public/writer-safe fields leave the browser. No private/secret data.
        body: JSON.stringify({
          seed: input.seed,
          characters: input.characters,
          effective_scale: input.effective_scale,
          options: this.options,
        }),
      });
      if (!res.ok) throw new Error(`status_${res.status}`);
      const data = (await res.json()) as ExpandResponse;
      if (!data?.expansion) throw new Error("bad_response");
      this.lastCost = data.cost ?? null;
      return data.expansion;
    } catch (e) {
      // Graceful fallback to the deterministic Phase-3A expander.
      this.lastCost = fallbackCost(input.seed.work_id, String(e instanceof Error ? e.message : e));
      return new DeterministicExpander().expand(input);
    }
  }
}
