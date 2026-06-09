// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 4,6] file created under this proposal
// Output validators for generated episode bodies. MVP heuristic:
// non_korean if the Hangul share of LETTER characters is below threshold
// (punctuation/space/digits excluded; small foreign text in dialogue/signs allowed).
// ===========================================================================

export const KOREAN_THRESHOLD = 0.5;

/** Share of letters that are Hangul (0..1). Non-letters are ignored. */
export function koreanRatio(text: string): number {
  const letters = [...text].filter((ch) => /\p{L}/u.test(ch));
  if (letters.length === 0) return 0;
  const hangul = letters.filter((ch) => /[가-힣]/.test(ch)).length;
  return hangul / letters.length;
}

export type BodyInvalidReason = "empty" | "non_korean";
export type BodyCheck = { ok: true } | { ok: false; reason: BodyInvalidReason };

/** Reject empty/too-short or predominantly-non-Korean output. */
export function validateBody(text: string, threshold: number = KOREAN_THRESHOLD): BodyCheck {
  if (!text || text.trim().length < 20) return { ok: false, reason: "empty" };
  if (koreanRatio(text) < threshold) return { ok: false, reason: "non_korean" };
  return { ok: true };
}
