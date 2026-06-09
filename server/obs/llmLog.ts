// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// LLM call observability. The entry type CANNOT hold a key or a raw prompt —
// only provider/model/latency/error_type/token counts. Enforced by the type.
// ===========================================================================

export interface LlmLogEntry {
  provider: string;
  model: string;
  latency_ms: number;
  error_type: string | null;
  input_tokens: number;
  output_tokens: number;
}

const entries: LlmLogEntry[] = [];

/** Record one call. Never pass key/prompt — the type doesn't allow it. */
export function logLlmCall(entry: LlmLogEntry): void {
  entries.push(entry);
}

export function getLlmLog(): readonly LlmLogEntry[] {
  return entries;
}
