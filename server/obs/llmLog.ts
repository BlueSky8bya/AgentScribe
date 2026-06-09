// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2_live_provider_rollout_v001.md section 7] first vs subsequent latency
// LLM call observability. The entry type CANNOT hold a key or a raw prompt —
// only provider/model/latency/error_type/token counts. Enforced by the type.
// `is_first_request` flags the first call to a provider+model in this process, so
// schema-compile/cache warmup latency (e.g. Claude structured outputs) is visible.
// ===========================================================================

export interface LlmLogEntry {
  provider: string;
  model: string;
  latency_ms: number;
  is_first_request: boolean;
  error_type: string | null;
  input_tokens: number;
  output_tokens: number;
}

const entries: LlmLogEntry[] = [];
const seen = new Set<string>();

/** True the first time a given provider+model is called in this process. */
export function isFirstRequest(provider: string, model: string): boolean {
  return !seen.has(`${provider}:${model}`);
}

/** Record one call. Never pass key/prompt — the type doesn't allow it. */
export function logLlmCall(entry: LlmLogEntry): void {
  entries.push(entry);
  seen.add(`${entry.provider}:${entry.model}`);
}

export function getLlmLog(): readonly LlmLogEntry[] {
  return entries;
}
