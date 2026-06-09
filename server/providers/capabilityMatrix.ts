// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md] file created under this proposal
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2_live_provider_rollout_v001.md section 1.1] live != user-selectable
// Single source of truth for provider/model/tier capabilities + rollout status.
// 3C-2: Claude & Gemini get LIVE adapters but stay user_selectable=false until they
// pass the Contract Canary (manual promotion). adapter_mode=live (real API possible)
// is SEPARATE from user_selectable (UI/routing gate). DeepSeek stays mock/placeholder
// until its official model names + data policy are re-confirmed (3C-2 last step).
// ===========================================================================

export type ProviderId = "openai" | "gemini" | "claude" | "deepseek";
export type ModelTier = "cheap" | "quality";
export type AdapterMode = "live" | "mock" | "disabled";
export type ProviderStatus = "disabled" | "experimental" | "beta" | "stable";

export interface CapabilityEntry {
  provider_id: ProviderId;
  model_id: string;
  tier: ModelTier;
  adapter_mode: AdapterMode;
  /** UI/routing gate. true ONLY after the canary criteria pass (manual promotion). */
  user_selectable: boolean;
  /** Server accepts real generation for this provider. = adapter_mode==="live" && user_selectable. */
  can_generate_real_output: boolean;
  supports_json_mode: boolean;
  supports_json_schema: boolean;
  supports_tool_use: boolean;
  usage_token_fields: string[];
  cached_token_supported: boolean;
  reasoning_token_supported: boolean;
  max_input_tokens: number;
  max_output_tokens: number;
  timeout_ms: number;
  retry_policy: string;
  price_snapshot_date: string;
  source_url: string;
  status: ProviderStatus;
}

const OPENAI_SRC = "https://developers.openai.com/api/docs/pricing";
const CLAUDE_SRC = "https://platform.claude.com/docs/en/about-claude/models/overview";
const GEMINI_SRC = "https://ai.google.dev/gemini-api/docs/pricing";
const DEEPSEEK_SRC = "https://api-docs.deepseek.com/quick_start/pricing-details-usd/";
const SNAPSHOT = "2026-06-09";

export const CAPABILITY_MATRIX: CapabilityEntry[] = [
  // --- OpenAI (LIVE, user-selectable, stable) ---
  {
    provider_id: "openai", model_id: "gpt-5.4-mini", tier: "cheap",
    adapter_mode: "live", user_selectable: true, can_generate_real_output: true,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: ["prompt_tokens", "completion_tokens"],
    cached_token_supported: true, reasoning_token_supported: true,
    max_input_tokens: 400_000, max_output_tokens: 128_000, timeout_ms: 60_000,
    retry_policy: "1 retry then deterministic fallback",
    price_snapshot_date: SNAPSHOT, source_url: OPENAI_SRC, status: "stable",
  },
  {
    provider_id: "openai", model_id: "gpt-5.4", tier: "quality",
    adapter_mode: "live", user_selectable: true, can_generate_real_output: true,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: ["prompt_tokens", "completion_tokens"],
    cached_token_supported: true, reasoning_token_supported: true,
    max_input_tokens: 400_000, max_output_tokens: 128_000, timeout_ms: 90_000,
    retry_policy: "1 retry then deterministic fallback",
    price_snapshot_date: SNAPSHOT, source_url: OPENAI_SRC, status: "stable",
  },
  // --- Claude (LIVE adapter; NOT user-selectable until canary passes) ---
  {
    provider_id: "claude", model_id: "claude-haiku-4-5", tier: "cheap",
    adapter_mode: "live", user_selectable: false, can_generate_real_output: false,
    supports_json_mode: false, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: ["input_tokens", "output_tokens"],
    cached_token_supported: true, reasoning_token_supported: false,
    max_input_tokens: 200_000, max_output_tokens: 64_000, timeout_ms: 60_000,
    retry_policy: "1 retry then deterministic fallback",
    price_snapshot_date: SNAPSHOT, source_url: CLAUDE_SRC, status: "experimental",
  },
  {
    provider_id: "claude", model_id: "claude-sonnet-4-6", tier: "quality",
    adapter_mode: "live", user_selectable: false, can_generate_real_output: false,
    supports_json_mode: false, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: ["input_tokens", "output_tokens"],
    cached_token_supported: true, reasoning_token_supported: false,
    max_input_tokens: 1_000_000, max_output_tokens: 64_000, timeout_ms: 90_000,
    // Claude structured outputs compile/cache a schema grammar -> first request can be slower.
    retry_policy: "1 retry then deterministic fallback (note: first-request schema-compile latency)",
    price_snapshot_date: SNAPSHOT, source_url: CLAUDE_SRC, status: "experimental",
  },
  // --- Gemini (LIVE adapter; NOT user-selectable until canary passes) ---
  {
    provider_id: "gemini", model_id: "gemini-2.5-flash-lite", tier: "cheap",
    adapter_mode: "live", user_selectable: false, can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: ["promptTokenCount", "candidatesTokenCount"],
    cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 1_000_000, max_output_tokens: 64_000, timeout_ms: 60_000,
    retry_policy: "1 retry then deterministic fallback",
    price_snapshot_date: SNAPSHOT, source_url: GEMINI_SRC, status: "experimental",
  },
  {
    provider_id: "gemini", model_id: "gemini-3.5-flash", tier: "quality",
    adapter_mode: "live", user_selectable: false, can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: ["promptTokenCount", "candidatesTokenCount"],
    cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 1_000_000, max_output_tokens: 64_000, timeout_ms: 90_000,
    retry_policy: "1 retry then deterministic fallback",
    price_snapshot_date: SNAPSHOT, source_url: GEMINI_SRC, status: "experimental",
  },
  // --- DeepSeek (MOCK placeholder; confirm official model names/data policy at 3C-2 last step) ---
  // Candidate (NOT yet wired): cheap=deepseek-v4-flash, quality=deepseek-v4-pro.
  // FORBIDDEN (deprecated): deepseek-chat, deepseek-reasoner.
  {
    provider_id: "deepseek", model_id: "deepseek-pending-cheap", tier: "cheap",
    adapter_mode: "mock", user_selectable: false, can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: false, supports_tool_use: true,
    usage_token_fields: [], cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 0, max_output_tokens: 0, timeout_ms: 60_000,
    retry_policy: "confirm at 3C-2 (data/censorship/structured-output review first)",
    price_snapshot_date: "pending", source_url: DEEPSEEK_SRC, status: "experimental",
  },
  {
    provider_id: "deepseek", model_id: "deepseek-pending-quality", tier: "quality",
    adapter_mode: "mock", user_selectable: false, can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: false, supports_tool_use: true,
    usage_token_fields: [], cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 0, max_output_tokens: 0, timeout_ms: 90_000,
    retry_policy: "confirm at 3C-2 (data/censorship/structured-output review first)",
    price_snapshot_date: "pending", source_url: DEEPSEEK_SRC, status: "experimental",
  },
];

export function getEntry(provider: ProviderId, tier: ModelTier): CapabilityEntry | undefined {
  return CAPABILITY_MATRIX.find((e) => e.provider_id === provider && e.tier === tier);
}

export const ALL_PROVIDERS: ProviderId[] = ["openai", "gemini", "claude", "deepseek"];

/** Dev/test override: exercise not-yet-promoted (mock OR gated-live) providers. NEVER set in prod. */
export function devOverrideAllowed(): boolean {
  return process.env.ALLOW_MOCK_PROVIDERS === "1";
}

export interface ProviderSummary {
  id: ProviderId;
  status: ProviderStatus;
  adapter_mode: AdapterMode;
  user_selectable: boolean;
  can_generate_real_output: boolean;
  available: boolean; // env key present (boolean ONLY — never the key)
  tiers: ModelTier[];
  note?: string;
}

const ENV_KEY: Record<ProviderId, string> = {
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
};

/** Key presence only — returns boolean, never the key value. */
export function hasKey(provider: ProviderId): boolean {
  return Boolean(process.env[ENV_KEY[provider]]);
}

const NOTE: Partial<Record<ProviderId, string>> = {
  claude: "준비중 (live adapter, canary 통과 전이라 선택 불가)",
  gemini: "준비중 (live adapter, canary 통과 전이라 선택 불가)",
  deepseek: "준비중 (mock) — 공식 모델명/데이터 정책 재확인 필요",
};

export function listProviderSummaries(): ProviderSummary[] {
  return ALL_PROVIDERS.map((id) => {
    const entries = CAPABILITY_MATRIX.filter((e) => e.provider_id === id);
    const first = entries[0];
    return {
      id,
      status: first.status,
      adapter_mode: first.adapter_mode,
      user_selectable: first.user_selectable,
      can_generate_real_output: first.can_generate_real_output,
      available: hasKey(id),
      tiers: entries.map((e) => e.tier),
      note: NOTE[id],
    };
  });
}

/**
 * Can this provider actually run a real generation right now?
 * Requires a key AND (can_generate_real_output=true, i.e. promoted) OR the dev override.
 * Gated-live providers (Claude/Gemini before canary) are blocked in normal use.
 */
export function canRunRealGeneration(provider: ProviderId): boolean {
  const entry = CAPABILITY_MATRIX.find((e) => e.provider_id === provider);
  if (!entry) return false;
  if (!hasKey(provider)) return false;
  if (entry.can_generate_real_output) return true;
  return devOverrideAllowed();
}
