// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 4] file created under this proposal
// Contract Canary runner. Runs the seed bank through an expander, checks schema
// validity, cap-compliance, and private-secret leakage, then aggregates rates.
// Thresholds are AgentScribe INTERNAL operating bars, NOT an industry standard.
// 3C-1 validates the harness with the mock adapter; 3C-2 runs live providers.
// ===========================================================================
import { SeedSettings, CharacterPublicSeed } from "../../src/core/schemas/index.js";
import type { ExpandInput, ExpansionResult } from "../../src/core/expand/ExpanderAdapter.js";
import type { ProviderId, ProviderStatus, AdapterMode } from "../providers/capabilityMatrix.js";
import { CANARY_SEED_BANK, CANARY_VERSION, type CanaryFixture } from "./seedBank.js";

const CAPS: Record<string, { rel: number; fs: number; chars: number }> = {
  short: { rel: 4, fs: 3, chars: 4 },
  medium: { rel: 8, fs: 6, chars: 6 },
  long: { rel: 15, fs: 12, chars: 10 },
  series: { rel: 15, fs: 12, chars: 10 },
};

export function fixtureToInput(fx: CanaryFixture): ExpandInput {
  const seed = SeedSettings.parse({
    work_id: `canary_${fx.fixture_id}`, genre: fx.genre, mood: fx.mood, background: fx.background,
    pov: "third_observer", scale: fx.scale, target_episodes: fx.target_episodes, episode_length: fx.episode_length,
  });
  const characters = fx.characters.map((c, i) =>
    CharacterPublicSeed.parse({
      character_id: `${seed.work_id}_char_${i + 1}`, name: c.name, role: c.role,
      one_line: c.one_line, gender: c.gender ?? "unspecified", personality_brief: c.personality_brief ?? "",
    }),
  );
  return { seed, characters, effective_scale: fx.scale };
}

export interface CanaryCaseResult {
  fixture_id: string;
  schema_ok: boolean;
  json_parse_failed: boolean;
  caps_ok: boolean;
  secret_leak_count: number;
}

/** Count private secrets/backstory that leaked into the non-private (Writer-safe) output. */
function detectSecretLeak(expansion: ExpansionResult): number {
  const publicView = {
    character_bibles: expansion.character_bibles,
    cast_registry: expansion.cast_registry,
    relationship_map: expansion.relationship_map,
    theme_ledger: expansion.theme_ledger,
    foreshadowing: expansion.foreshadowing,
  };
  const hay = JSON.stringify(publicView);
  let leaks = 0;
  for (const pc of expansion.private_characters) {
    for (const s of pc.secrets) if (s && hay.includes(s)) leaks++;
    if (pc.private_backstory && hay.includes(pc.private_backstory)) leaks++;
  }
  return leaks;
}

/** Run one fixture through an expander and check the contract. */
export async function runCanaryCase(
  fx: CanaryFixture,
  expand: (input: ExpandInput) => Promise<ExpansionResult>,
): Promise<CanaryCaseResult> {
  const input = fixtureToInput(fx);
  const cap = CAPS[fx.scale];
  try {
    const out = await expand(input);
    const caps_ok = out.relationship_map.length <= cap.rel && out.foreshadowing.length <= cap.fs;
    return {
      fixture_id: fx.fixture_id, schema_ok: true, json_parse_failed: false,
      caps_ok, secret_leak_count: detectSecretLeak(out),
    };
  } catch {
    return { fixture_id: fx.fixture_id, schema_ok: false, json_parse_failed: true, caps_ok: false, secret_leak_count: 0 };
  }
}

export interface CanaryReport {
  canary_version: string;
  provider_id: ProviderId;
  model_id: string;
  adapter_mode: AdapterMode;
  status_before: ProviderStatus;
  status_after: ProviderStatus;
  case_count: number;
  schema_success_rate: number;
  json_parse_failure_rate: number;
  cap_compliance_rate: number;
  private_secret_leak_count: number;
}

export interface CanaryMeta {
  provider_id: ProviderId;
  model_id: string;
  adapter_mode: AdapterMode;
  status_before: ProviderStatus;
}

/** Aggregate case results into a report + derive status_after from internal bars. */
export function aggregateCanary(results: CanaryCaseResult[], meta: CanaryMeta): CanaryReport {
  const n = results.length || 1;
  const schema_success_rate = results.filter((r) => r.schema_ok).length / n;
  const json_parse_failure_rate = results.filter((r) => r.json_parse_failed).length / n;
  const cap_compliance_rate = results.filter((r) => r.caps_ok).length / n;
  const leaks = results.reduce((a, r) => a + r.secret_leak_count, 0);

  // INTERNAL bars (not an industry standard): leak>0 -> disabled; >=95% schema -> stable candidate.
  let status_after = meta.status_before;
  if (leaks > 0) status_after = "disabled";
  else if (meta.adapter_mode === "live" && schema_success_rate >= 0.95) status_after = "stable";

  return {
    canary_version: CANARY_VERSION,
    provider_id: meta.provider_id, model_id: meta.model_id, adapter_mode: meta.adapter_mode,
    status_before: meta.status_before, status_after,
    case_count: results.length,
    schema_success_rate, json_parse_failure_rate, cap_compliance_rate,
    private_secret_leak_count: leaks,
  };
}

/** Convenience: run the whole seed bank. */
export async function runCanary(
  expand: (input: ExpandInput) => Promise<ExpansionResult>,
  meta: CanaryMeta,
): Promise<CanaryReport> {
  const results: CanaryCaseResult[] = [];
  for (const fx of CANARY_SEED_BANK) results.push(await runCanaryCase(fx, expand));
  return aggregateCanary(results, meta);
}

// --- Hard cost/call caps (proposal section 7) ---------------------------------
export interface CanaryCaps {
  max_calls: number;
  max_cost_usd: number;
}
// Per-run hard ceilings: <=30 calls total, <=$5 total. Abort if exceeded.
export const DEFAULT_CANARY_CAPS: CanaryCaps = { max_calls: 30, max_cost_usd: 5 };

export function withinCaps(calls: number, cost_usd: number, caps: CanaryCaps = DEFAULT_CANARY_CAPS): boolean {
  return calls <= caps.max_calls && cost_usd <= caps.max_cost_usd;
}

// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2b_provider_canary_promotion_v001.md section 3,5] payload check + latency split + promotion verdict

/** Structural check: the outbound payload carries no private/secret fields. Boolean only. */
export function payloadClassOk(input: ExpandInput): boolean {
  const s = JSON.stringify(input);
  return !s.includes("private_backstory") && !/"secrets"\s*:/.test(s);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export interface LatencySplit {
  first_request_latency_ms: number;
  subsequent_p50_ms: number;
  subsequent_p95_ms: number;
}

/** Split a provider's call latencies into first-request vs subsequent (p50/p95). */
export function splitLatency(latencies: { latency_ms: number; is_first_request: boolean }[]): LatencySplit {
  const first = latencies.find((l) => l.is_first_request)?.latency_ms ?? 0;
  const rest = latencies.filter((l) => !l.is_first_request).map((l) => l.latency_ms).sort((a, b) => a - b);
  return { first_request_latency_ms: first, subsequent_p50_ms: percentile(rest, 50), subsequent_p95_ms: percentile(rest, 95) };
}

export interface PromotionVerdict {
  pass: boolean;
  reasons: string[];
}

/** Smoke promotion gate (proposal section 5): leak=0 AND schema=100% AND fallback=0 AND payload ok. */
export function evaluatePromotion(report: CanaryReport, fallback_rate: number, payload_ok: boolean): PromotionVerdict {
  const reasons: string[] = [];
  if (report.private_secret_leak_count !== 0) reasons.push(`leak=${report.private_secret_leak_count}`);
  if (report.schema_success_rate !== 1) reasons.push(`schema_success_rate=${report.schema_success_rate}`);
  if (fallback_rate !== 0) reasons.push(`fallback_rate=${fallback_rate}`);
  if (!payload_ok) reasons.push("payload_class_not_public_only");
  return { pass: reasons.length === 0, reasons };
}

export interface BoundedCanaryResult {
  report: CanaryReport;
  calls: number;
  cost_usd: number;
  fallback_count: number;
  fallback_rate: number;
  aborted: boolean; // true if a cap would have been exceeded (run stopped early)
}

/**
 * Run the seed bank under hard caps. Each case = 1 call. Stops BEFORE a call that
 * would breach max_calls or max_cost_usd. `expandCost` returns the per-call cost
 * and whether that call fell back to the deterministic expander.
 */
export async function runCanaryBounded(
  expandCost: (input: ExpandInput) => Promise<{ out: ExpansionResult; cost_usd: number; fallback_used?: boolean }>,
  meta: CanaryMeta,
  caps: CanaryCaps = DEFAULT_CANARY_CAPS,
): Promise<BoundedCanaryResult> {
  const results: CanaryCaseResult[] = [];
  let calls = 0;
  let cost_usd = 0;
  let fallback_count = 0;
  let aborted = false;
  for (const fx of CANARY_SEED_BANK) {
    if (!withinCaps(calls + 1, cost_usd, caps)) { aborted = true; break; }
    const r = await runCanaryCase(fx, async (input) => {
      const { out, cost_usd: c, fallback_used } = await expandCost(input);
      cost_usd += c;
      if (fallback_used) fallback_count += 1;
      return out;
    });
    calls += 1;
    results.push(r);
    if (cost_usd > caps.max_cost_usd) { aborted = true; break; } // post-call cost breach
  }
  const fallback_rate = calls > 0 ? fallback_count / calls : 0;
  return { report: aggregateCanary(results, meta), calls, cost_usd, fallback_count, fallback_rate, aborted };
}
