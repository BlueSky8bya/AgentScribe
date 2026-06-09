// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2c_canary_fallback_fix_v001.md section 3,4] file created under this proposal
// Diagnostic canary: calls the provider adapter directly (no expander fallback
// swallowing) and classifies WHY a draft failed, per provider/seed. Aggregates
// failure_type counts + representative zod paths (schema keys only) + latency.
// Records NO raw prompt / output / payload / key.
// ===========================================================================
import type { ProviderId } from "../providers/capabilityMatrix.js";
import { getEntry } from "../providers/capabilityMatrix.js";
import { resolveAdapter } from "../providers/registry.js";
import type { ProviderAdapter } from "../providers/types.js";
import { withTimeout } from "../providers/timeout.js";
import { route } from "../modelRouter.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../llmExpander.js";
import { classifyDraftFailure } from "./classify.js";
import { CANARY_SEED_BANK, CANARY_VERSION } from "./seedBank.js";
import { fixtureToInput, splitLatency, type LatencySplit } from "./runner.js";

export type DiagFailureType = "ok" | "empty" | "json_parse" | "zod_invalid" | "timeout" | "rate_limit" | "api_error";

export interface DiagnosisCase {
  fixture_id: string;
  failure_type: DiagFailureType;
  zod_issue_codes?: string[];
  zod_paths?: string[];
  latency_ms: number;
  is_first_request: boolean;
  timed_out: boolean;
}

export interface DiagnosisReport {
  provider: ProviderId;
  model: string;
  canary_version: string;
  case_count: number;
  counts: Record<DiagFailureType, number>;
  top_failures: { type: DiagFailureType; count: number }[];
  representative_zod_paths: string[];
  latency: LatencySplit;
}

function emptyCounts(): Record<DiagFailureType, number> {
  return { ok: 0, empty: 0, json_parse: 0, zod_invalid: 0, timeout: 0, rate_limit: 0, api_error: 0 };
}

export interface DiagnoseDeps {
  adapter?: ProviderAdapter;
}

/** Run the seed bank through a provider, classifying each failure. Bounded by seed count (5). */
export async function diagnoseProvider(provider: ProviderId, deps: DiagnoseDeps = {}): Promise<DiagnosisReport> {
  const adapter = deps.adapter ?? resolveAdapter(provider);
  const cases: DiagnosisCase[] = [];

  for (let i = 0; i < CANARY_SEED_BANK.length; i++) {
    const fx = CANARY_SEED_BANK[i];
    const input = fixtureToInput(fx);
    const decision = route({ provider, effective_scale: input.effective_scale });
    const timeout_ms = getEntry(provider, decision.tier)?.timeout_ms ?? 60_000;
    const start = Date.now();
    let failure_type: DiagFailureType;
    let zod_issue_codes: string[] | undefined;
    let zod_paths: string[] | undefined;
    let timed_out = false;
    try {
      const { rawJson } = await withTimeout(
        adapter.generate({ system: SYSTEM_PROMPT, user: buildUserPrompt(input) }, decision.model),
        timeout_ms,
        "timeout",
      );
      const c = classifyDraftFailure(rawJson);
      failure_type = c.type;
      if (c.type === "zod_invalid") { zod_issue_codes = c.zod_issue_codes; zod_paths = c.zod_paths; }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      const status = (e as { status?: number })?.status;
      failure_type = msg === "timeout" ? "timeout" : status === 429 ? "rate_limit" : "api_error";
      timed_out = failure_type === "timeout";
    }
    cases.push({
      fixture_id: fx.fixture_id, failure_type, zod_issue_codes, zod_paths,
      latency_ms: Date.now() - start, is_first_request: i === 0, timed_out,
    });
  }

  const counts = emptyCounts();
  for (const c of cases) counts[c.failure_type]++;
  const top_failures = (Object.entries(counts) as [DiagFailureType, number][])
    .filter(([t, n]) => t !== "ok" && n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
  const representative_zod_paths = [...new Set(cases.flatMap((c) => c.zod_paths ?? []))].slice(0, 8);
  const latency = splitLatency(cases.map((c) => ({ latency_ms: c.latency_ms, is_first_request: c.is_first_request })));
  const entry = getEntry(provider, "quality") ?? getEntry(provider, "cheap");

  return {
    provider, model: entry?.model_id ?? "unknown", canary_version: CANARY_VERSION,
    case_count: cases.length, counts, top_failures, representative_zod_paths, latency,
  };
}
