// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 5] file created under this proposal
// Pairwise quality-comparison harness (record format only in 3C-1). Bias guards:
// randomized A/B order (order-swap), length-bias note, recorded rationale, and
// human review. Refs: MT-Bench/Chatbot Arena (arXiv:2306.05685), HELM (2211.09110).
// No LLM judge call here yet — this defines the structure used in 3C-2.
// ===========================================================================
import type { ProviderId } from "../providers/capabilityMatrix.js";

export interface PairwiseSide {
  provider_id: ProviderId;
  model_id: string;
  output_summary: string;
}

export interface PairwisePresentation {
  left: PairwiseSide;
  right: PairwiseSide;
  swapped: boolean; // true if left/right were swapped vs (a,b) order
}

/**
 * Present two sides in a possibly-swapped order to counter position bias.
 * `swap` is provided by the caller (seeded), since Math.random is avoided.
 */
export function present(a: PairwiseSide, b: PairwiseSide, swap: boolean): PairwisePresentation {
  return swap ? { left: b, right: a, swapped: true } : { left: a, right: b, swapped: false };
}

export type PairwiseCriterion =
  | "character_usefulness"
  | "relationship_naturalness"
  | "foreshadow_restraint"
  | "korean_naturalness"
  | "ease_of_user_edit";

export interface PairwiseRecord {
  presentation: PairwisePresentation;
  // Winner is recorded in ORIGINAL (a/b) terms, de-swapped, to avoid position bias.
  winner_by_criterion: Partial<Record<PairwiseCriterion, "a" | "b" | "tie">>;
  length_bias_note: string; // e.g. "longer answer not rewarded"
  judge_rationale: string;
  human_reviewed: boolean;
  human_review_notes: string;
}
