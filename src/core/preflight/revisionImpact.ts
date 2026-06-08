// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5.4] Phase 2 Blueprint Revision Impact (deterministic)
import type { WorkRecord } from "../schemas/index.js";

export interface ChangedElement {
  kind: "reveal" | "relationship" | "episode";
  id: string;
}

export interface ImpactResult {
  changed: ChangedElement;
  impacted: {
    episode_cards: string[];
    reveals: string[];
    relationships: string[];
    foreshadowing: string[];
  };
  recheck_scope: string[];
}

/** Walk cross-links to list what a Soft-Lock change touches + the recheck scope. */
export function revisionImpact(work: WorkRecord, changed: ChangedElement): ImpactResult {
  const p = work.public;
  const impacted: ImpactResult["impacted"] = {
    episode_cards: [],
    reveals: [],
    relationships: [],
    foreshadowing: [],
  };

  if (changed.kind === "reveal") {
    impacted.reveals.push(changed.id);
    const reveal = p.reveal_schedule.find((r) => r.reveal_id === changed.id);
    for (const ep of p.episode_cards)
      if (ep.reveal_ids.includes(changed.id)) impacted.episode_cards.push(ep.episode_id);
    if (reveal) {
      // foreshadowing whose payoff aligns with this reveal's window.
      for (const f of p.foreshadowing)
        if (f.payoff_episode && f.payoff_episode >= reveal.allowed_episode_range[0] && f.payoff_episode <= reveal.allowed_episode_range[1])
          impacted.foreshadowing.push(f.foreshadow_id);
    }
  } else if (changed.kind === "relationship") {
    impacted.relationships.push(changed.id);
    for (const ep of p.episode_cards)
      if (ep.relationship_beats.includes(changed.id)) impacted.episode_cards.push(ep.episode_id);
  } else {
    impacted.episode_cards.push(changed.id);
  }

  const recheck_scope = [
    ...impacted.episode_cards.map((e) => `recheck:${e}`),
    "rerun:candidate_gates",
    "rerun:schema_canary",
  ];
  return { changed, impacted, recheck_scope };
}
