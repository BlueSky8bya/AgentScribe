// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 2,3,6] file created under this proposal
// Writer service: generate ONE episode body via a provider adapter. No deterministic
// prose fallback — on persistent failure it returns status="failed" (NEVER fabricated
// text, NEVER saved). Retries <=2 on transient/invalid output. Korean-only validated.
// ===========================================================================
import { EpisodeDraft } from "../../src/core/schemas/episodeDraft.js";
import { assertNoPrivateLeak } from "../../src/core/firewall/contextPackager.js";
import type { WriterContract } from "../../src/core/writer/writerContract.js";
import type { CostLedgerEntry } from "../../src/core/expand/remoteTypes.js";
import { resolveAdapter } from "../providers/registry.js";
import type { ProviderAdapter } from "../providers/types.js";
import { getEntry, type ProviderId, type ModelTier } from "../providers/capabilityMatrix.js";
import { withTimeout } from "../providers/timeout.js";
import { buildLedgerEntry, recordCost, type TokenUsage } from "../cost/costLedger.js";
import { logLlmCall, isFirstRequest } from "../obs/llmLog.js";
import { WRITER_SYSTEM_PROMPT, buildWriterUserPrompt } from "./writePrompt.js";
import { validateBody } from "./validate.js";

export interface WriterRouteDecision { provider: ProviderId; model: string; tier: ModelTier; }

export interface WriteDeps {
  adapter?: ProviderAdapter;
  now?: () => string; // injectable clock; default = real ISO time (server-side)
}

export interface WriteResult {
  draft: EpisodeDraft;
  cost: CostLedgerEntry;
}

export async function writeEpisode(
  contract: WriterContract,
  decision: WriterRouteDecision,
  deps: WriteDeps = {},
): Promise<WriteResult> {
  assertNoPrivateLeak(contract); // server-side firewall re-check
  const now = deps.now ?? (() => new Date().toISOString());
  const work_id = contract.work_id;
  const episode_index = contract.episode_index;
  const episode_id = `${work_id}_ep_${episode_index}`;
  const target = contract.episode_contract.target_char_count;

  const adapter = deps.adapter ?? resolveAdapter(decision.provider);
  const timeout_ms = getEntry(decision.provider, decision.tier)?.timeout_ms ?? 90_000;
  const prompt = { system: WRITER_SYSTEM_PROMPT, user: buildWriterUserPrompt(contract) };
  const first_request = isFirstRequest(decision.provider, decision.model);
  const started = Date.now();

  const base = {
    schema_version: "0.1.0" as const,
    work_id, episode_id, episode_index,
    target_char_count: target,
    provenance: "agent_writer" as const,
    provider: decision.provider, model: decision.model,
    created_at: now(),
    beats_covered: contract.episode_contract.active_relationship_beats.map((b) => `${b.from}>${b.to}`),
  };

  let usage: TokenUsage = { input_tokens: 0, output_tokens: 0 };
  let lastReason = "api_error";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await withTimeout(adapter.generate(prompt, decision.model), timeout_ms, "timeout");
      usage = r.usage;
      const body = (r.rawJson ?? "").trim(); // adapters return raw text; for writer it's prose
      const check = validateBody(body);
      if (!check.ok) { lastReason = check.reason; continue; } // retry on empty/non_korean
      logLlmCall({
        provider: decision.provider, model: decision.model, latency_ms: Date.now() - started,
        is_first_request: first_request, error_type: null,
        input_tokens: usage.input_tokens, output_tokens: usage.output_tokens,
      });
      const draft = EpisodeDraft.parse({
        ...base, body_text: body, char_count: [...body].length,
        status: "draft", commit_status: "generated", error_type: null,
      });
      const cost = buildLedgerEntry({
        work_id, phase: "later_writer", provider: decision.provider, model: decision.model,
        usage, fallback_used: false,
      });
      recordCost(cost);
      return { draft, cost };
    } catch (e) {
      lastReason = e instanceof Error ? (e.message || e.name) : "api_error";
      // loop retries (<=2) then fall through to failure below
    }
  }

  // Persistent failure: NO fabricated body, NOT saved.
  logLlmCall({
    provider: decision.provider, model: decision.model, latency_ms: Date.now() - started,
    is_first_request: first_request, error_type: lastReason, input_tokens: usage.input_tokens, output_tokens: usage.output_tokens,
  });
  const cost = buildLedgerEntry({
    work_id, phase: "later_writer", provider: decision.provider, model: decision.model,
    usage, fallback_used: true, fallback_reason: lastReason,
  });
  recordCost(cost);
  const draft = EpisodeDraft.parse({
    ...base, body_text: "", char_count: 0,
    status: "failed", commit_status: "discarded", error_type: lastReason,
  });
  return { draft, cost };
}
