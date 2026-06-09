// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2b_provider_canary_promotion_v001.md] file created under this proposal
// Real-API smoke canary for ONE gated-live provider (claude|gemini). Owner runs it
// with the provider key in server env + ALLOW_GATED_LIVE_CANARY=1. Enforces caps
// (<=10 calls/provider, <=$5), records first/subsequent latency, checks payload
// class, and prints a REDACTED report (numbers/booleans/model ids only — never a
// key, raw prompt, or raw payload). Promotion (user_selectable=true) is applied
// separately, only for a provider whose verdict.pass === true.
// ===========================================================================
import { route } from "../modelRouter.js";
import { LlmExpander } from "../llmExpander.js";
import type { ProviderId } from "../providers/capabilityMatrix.js";
import { hasKey, gatedLiveCanaryAllowed, getEntry } from "../providers/capabilityMatrix.js";
import { getLlmLog } from "../obs/llmLog.js";
import type { ExpandInput } from "../../src/core/expand/ExpanderAdapter.js";
import {
  runCanaryBounded, fixtureToInput, payloadClassOk, splitLatency, evaluatePromotion,
  type CanaryCaps, type CanaryMeta,
} from "./runner.js";
import { CANARY_SEED_BANK } from "./seedBank.js";

const PROVIDER_CAPS: CanaryCaps = { max_calls: 10, max_cost_usd: 5 };

export interface ProviderCanaryDeps {
  // Injectable for tests (no network). Defaults to the live LlmExpander.
  expandCost?: (input: ExpandInput) => Promise<{ out: import("../../src/core/expand/ExpanderAdapter.js").ExpansionResult; cost_usd: number; fallback_used?: boolean }>;
  latencies?: { latency_ms: number; is_first_request: boolean }[];
}

export interface ProviderCanaryOutput {
  provider: ProviderId;
  payload_class_ok: boolean;
  latency: ReturnType<typeof splitLatency>;
  calls: number;
  cost_usd: number;
  fallback_rate: number;
  aborted: boolean;
  report: import("./runner.js").CanaryReport;
  verdict: ReturnType<typeof evaluatePromotion>;
}

/** Core canary logic (provider-agnostic, testable with an injected expandCost). */
export async function runProviderCanary(
  provider: ProviderId,
  deps: ProviderCanaryDeps = {},
): Promise<ProviderCanaryOutput> {
  const entry = getEntry(provider, "quality") ?? getEntry(provider, "cheap");
  const meta: CanaryMeta = {
    provider_id: provider,
    model_id: entry?.model_id ?? "unknown",
    adapter_mode: entry?.adapter_mode ?? "disabled",
    status_before: entry?.status ?? "experimental",
  };

  // Payload-class check is structural (no private/secret in outbound input).
  const payload_class_ok = CANARY_SEED_BANK.every((fx) => payloadClassOk(fixtureToInput(fx)));

  const expandCost =
    deps.expandCost ??
    (async (input: ExpandInput) => {
      const expander = new LlmExpander();
      const decision = route({ provider, effective_scale: input.effective_scale });
      const { expansion, cost } = await expander.expandDetailed(input, decision);
      return { out: expansion, cost_usd: cost.estimated_cost_usd, fallback_used: cost.fallback_used };
    });

  const bounded = await runCanaryBounded(expandCost, meta, PROVIDER_CAPS);

  const latencies =
    deps.latencies ??
    getLlmLog()
      .filter((e) => e.provider === provider)
      .map((e) => ({ latency_ms: e.latency_ms, is_first_request: e.is_first_request }));
  const latency = splitLatency(latencies);

  const verdict = evaluatePromotion(bounded.report, bounded.fallback_rate, payload_class_ok);

  return {
    provider, payload_class_ok, latency,
    calls: bounded.calls, cost_usd: bounded.cost_usd, fallback_rate: bounded.fallback_rate,
    aborted: bounded.aborted, report: bounded.report, verdict,
  };
}

async function main(): Promise<void> {
  const provider = process.argv[2] as ProviderId | undefined;
  if (provider !== "claude" && provider !== "gemini") {
    console.error("usage: canary:provider -- <claude|gemini>");
    process.exit(2);
  }
  if (!gatedLiveCanaryAllowed()) {
    console.error("refused: set ALLOW_GATED_LIVE_CANARY=1 to run a gated-live canary (dev only)");
    process.exit(2);
  }
  if (!hasKey(provider)) {
    console.error(`refused: missing server env key for ${provider} (never pass keys on the CLI)`);
    process.exit(2);
  }
  const out = await runProviderCanary(provider);
  // REDACTED output: numbers/booleans/model ids only. No key, prompt, or payload.
  console.log(JSON.stringify({
    provider: out.provider,
    model: out.report.model_id,
    canary_version: out.report.canary_version,
    calls: out.calls,
    cost_usd: out.cost_usd,
    schema_success_rate: out.report.schema_success_rate,
    fallback_rate: out.fallback_rate,
    private_secret_leak_count: out.report.private_secret_leak_count,
    cap_compliance_rate: out.report.cap_compliance_rate,
    payload_class_ok: out.payload_class_ok,
    latency: out.latency,
    aborted: out.aborted,
    verdict: out.verdict,
  }, null, 2));
  console.log(out.verdict.pass
    ? `PASS: ${provider} eligible for promotion (user_selectable=true, beta).`
    : `FAIL: ${provider} stays experimental (reasons: ${out.verdict.reasons.join(", ")}).`);
}

if (process.argv[1] && process.argv[1].endsWith("runCli.ts")) {
  main().catch((e) => { console.error("canary error:", e instanceof Error ? e.name : "unknown"); process.exit(1); });
}
