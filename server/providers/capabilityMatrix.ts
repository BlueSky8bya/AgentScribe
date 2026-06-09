// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md] file created under this proposal
// Single source of truth for provider/model/tier capabilities + rollout status.
// Router allowlist AND UI labels read this — same meaning everywhere.
// 3C-1: openai = live/stable; gemini/claude/deepseek = mock/experimental
// (can_generate_real_output=false -> not user-selectable for real generation).
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

// NOTE: model_ids for mock providers are placeholders. Do NOT treat them as real
// until Phase 3C-2 confirms them against each provider's official docs (esp. DeepSeek
// model names/deprecation) and flips adapter_mode to "live".
export const CAPABILITY_MATRIX: CapabilityEntry[] = [
  // --- OpenAI (LIVE) ---
  {
    provider_id: "openai", model_id: "gpt-5.4-mini", tier: "cheap",
    adapter_mode: "live", can_generate_real_output: true,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: ["prompt_tokens", "completion_tokens"],
    cached_token_supported: true, reasoning_token_supported: true,
    max_input_tokens: 400_000, max_output_tokens: 128_000, timeout_ms: 60_000,
    retry_policy: "1 retry then deterministic fallback",
    price_snapshot_date: "2026-06-09", source_url: OPENAI_SRC, status: "stable",
  },
  {
    provider_id: "openai", model_id: "gpt-5.4", tier: "quality",
    adapter_mode: "live", can_generate_real_output: true,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: ["prompt_tokens", "completion_tokens"],
    cached_token_supported: true, reasoning_token_supported: true,
    max_input_tokens: 400_000, max_output_tokens: 128_000, timeout_ms: 90_000,
    retry_policy: "1 retry then deterministic fallback",
    price_snapshot_date: "2026-06-09", source_url: OPENAI_SRC, status: "stable",
  },
  // --- Gemini (MOCK, prepared) ---
  {
    provider_id: "gemini", model_id: "gemini-pending-cheap", tier: "cheap",
    adapter_mode: "mock", can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: [], cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 0, max_output_tokens: 0, timeout_ms: 60_000,
    retry_policy: "confirm at 3C-2",
    price_snapshot_date: "pending", source_url: "https://ai.google.dev/gemini-api/docs/pricing", status: "experimental",
  },
  {
    provider_id: "gemini", model_id: "gemini-pending-quality", tier: "quality",
    adapter_mode: "mock", can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: [], cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 0, max_output_tokens: 0, timeout_ms: 90_000,
    retry_policy: "confirm at 3C-2",
    price_snapshot_date: "pending", source_url: "https://ai.google.dev/gemini-api/docs/pricing", status: "experimental",
  },
  // --- Claude (MOCK, prepared) ---
  {
    provider_id: "claude", model_id: "claude-pending-cheap", tier: "cheap",
    adapter_mode: "mock", can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: [], cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 0, max_output_tokens: 0, timeout_ms: 60_000,
    retry_policy: "confirm at 3C-2",
    price_snapshot_date: "pending", source_url: "https://platform.claude.com/docs/en/about-claude/models/overview", status: "experimental",
  },
  {
    provider_id: "claude", model_id: "claude-pending-quality", tier: "quality",
    adapter_mode: "mock", can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: true, supports_tool_use: true,
    usage_token_fields: [], cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 0, max_output_tokens: 0, timeout_ms: 90_000,
    retry_policy: "confirm at 3C-2",
    price_snapshot_date: "pending", source_url: "https://platform.claude.com/docs/en/about-claude/models/overview", status: "experimental",
  },
  // --- DeepSeek (MOCK, prepared; model names/deprecation MUST be confirmed at 3C-2) ---
  {
    provider_id: "deepseek", model_id: "deepseek-pending-cheap", tier: "cheap",
    adapter_mode: "mock", can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: false, supports_tool_use: true,
    usage_token_fields: [], cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 0, max_output_tokens: 0, timeout_ms: 60_000,
    retry_policy: "confirm at 3C-2 (data/censorship/structured-output review first)",
    price_snapshot_date: "pending", source_url: "https://api-docs.deepseek.com/quick_start/pricing-details-usd/", status: "experimental",
  },
  {
    provider_id: "deepseek", model_id: "deepseek-pending-quality", tier: "quality",
    adapter_mode: "mock", can_generate_real_output: false,
    supports_json_mode: true, supports_json_schema: false, supports_tool_use: true,
    usage_token_fields: [], cached_token_supported: false, reasoning_token_supported: false,
    max_input_tokens: 0, max_output_tokens: 0, timeout_ms: 90_000,
    retry_policy: "confirm at 3C-2 (data/censorship/structured-output review first)",
    price_snapshot_date: "pending", source_url: "https://api-docs.deepseek.com/quick_start/pricing-details-usd/", status: "experimental",
  },
];

export function getEntry(provider: ProviderId, tier: ModelTier): CapabilityEntry | undefined {
  return CAPABILITY_MATRIX.find((e) => e.provider_id === provider && e.tier === tier);
}

export const ALL_PROVIDERS: ProviderId[] = ["openai", "gemini", "claude", "deepseek"];

/** Whether mock providers may be used for real generation (dev/test only). */
export function mockAllowed(): boolean {
  return process.env.ALLOW_MOCK_PROVIDERS === "1";
}

export interface ProviderSummary {
  id: ProviderId;
  status: ProviderStatus;
  adapter_mode: AdapterMode;
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
  gemini: "준비중 (experimental, live 연결 전)",
  claude: "준비중 (experimental, live 연결 전)",
  deepseek: "준비중 (experimental) — 데이터 전송/검열/구조화 안정성 확인 필요",
};

export function listProviderSummaries(): ProviderSummary[] {
  return ALL_PROVIDERS.map((id) => {
    const entries = CAPABILITY_MATRIX.filter((e) => e.provider_id === id);
    const first = entries[0];
    return {
      id,
      status: first.status,
      adapter_mode: first.adapter_mode,
      can_generate_real_output: first.can_generate_real_output,
      available: hasKey(id),
      tiers: entries.map((e) => e.tier),
      note: NOTE[id],
    };
  });
}

/**
 * Can this provider actually run a real generation right now?
 * Requires can_generate_real_output (live) OR mock explicitly allowed (dev/test),
 * AND a key present. Used by the router to reject silent substitution.
 */
export function canRunRealGeneration(provider: ProviderId): boolean {
  const entry = CAPABILITY_MATRIX.find((e) => e.provider_id === provider);
  if (!entry) return false;
  if (!hasKey(provider)) return false;
  if (entry.can_generate_real_output) return true;
  return entry.adapter_mode === "mock" && mockAllowed();
}
