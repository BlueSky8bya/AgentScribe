// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 3] Phase 3 Scale Consistency Guard (logic)
// AgentScribe initial defaults (NOT a literary standard). Episode-count based; default 5000 ko_chars/episode.
import type { ScaleMode } from "../schemas/seedSettings.js";
import type { ScaleCheck, ScaleConsistency } from "../schemas/scaleCheck.js";

export const DEFAULT_EPISODE_LENGTH = 5000;

/** Episode-count bands -> scale. Edit here to tune defaults. */
const ORDER: ScaleMode[] = ["short", "medium", "long", "series"];

export function scaleFromEpisodes(episodes: number): ScaleMode {
  if (episodes <= 9) return "short";
  if (episodes <= 30) return "medium";
  if (episodes <= 120) return "long";
  return "series";
}

/** Default episode count when the user only picks a scale label. */
export function defaultEpisodes(scale: ScaleMode): number {
  switch (scale) {
    case "short": return 5;
    case "medium": return 20;
    case "long": return 60;
    case "series": return 150;
  }
}

/** Distance between declared and effective scale on the ordered ladder. */
function bandDistance(a: ScaleMode, b: ScaleMode): number {
  return Math.abs(ORDER.indexOf(a) - ORDER.indexOf(b));
}

export function computeScaleCheck(input: {
  declared_scale: ScaleMode;
  target_episodes: number;
  episode_length?: number;
  scale_override_reason?: string;
}): ScaleCheck {
  const episode_length = input.episode_length ?? DEFAULT_EPISODE_LENGTH;
  const planned_total_length = input.target_episodes * episode_length;
  const effective_scale = scaleFromEpisodes(input.target_episodes);
  const dist = bandDistance(input.declared_scale, effective_scale);
  const scale_consistency: ScaleConsistency = dist === 0 ? "ok" : dist === 1 ? "warn" : "blocking_warn";
  return {
    declared_scale: input.declared_scale,
    target_episodes: input.target_episodes,
    episode_length,
    episode_length_unit: "ko_chars",
    planned_total_length,
    effective_scale,
    scale_consistency,
    scale_override_reason: input.scale_override_reason,
  };
}

/** Easy guidance text for the UI (no internal field names). */
export function scaleGuidanceMessage(check: ScaleCheck): string | null {
  if (check.scale_consistency === "ok" || check.scale_override_reason) return null;
  const labelKo: Record<ScaleMode, string> = { short: "단편", medium: "중편", long: "장편", series: "시리즈" };
  return `지금 설정은 ${labelKo[check.declared_scale]}보다는 ${labelKo[check.effective_scale]}에 가까워요.`;
}
