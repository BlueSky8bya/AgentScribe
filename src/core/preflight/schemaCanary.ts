// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5.2] Phase 2 Schema Canary (deterministic)
// Detects cross-link integrity errors: missing target / duplicate id / orphan reveal / orphan relationship.
import type { WorkRecord } from "../schemas/index.js";

export interface CanaryError {
  code:
    | "duplicate_character_id"
    | "duplicate_relationship_id"
    | "duplicate_reveal_id"
    | "missing_reveal_character"
    | "missing_relationship_endpoint"
    | "orphan_reveal"
    | "orphan_relationship";
  detail: string;
}

export interface CanaryResult {
  ok: boolean;
  errors: CanaryError[];
}

function dups(ids: string[]): string[] {
  const seen = new Set<string>();
  const out = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) out.add(id);
    seen.add(id);
  }
  return [...out];
}

export function schemaCanary(work: WorkRecord): CanaryResult {
  const p = work.public;
  const errors: CanaryError[] = [];

  const charIds = new Set(p.character_bibles.map((c) => c.character_id));
  const relIds = new Set(p.relationship_map.map((r) => r.relationship_id));
  const revIds = new Set(p.reveal_schedule.map((r) => r.reveal_id));

  for (const id of dups(p.character_bibles.map((c) => c.character_id)))
    errors.push({ code: "duplicate_character_id", detail: id });
  for (const id of dups(p.relationship_map.map((r) => r.relationship_id)))
    errors.push({ code: "duplicate_relationship_id", detail: id });
  for (const id of dups(p.reveal_schedule.map((r) => r.reveal_id)))
    errors.push({ code: "duplicate_reveal_id", detail: id });

  for (const r of p.reveal_schedule)
    if (!charIds.has(r.character_id))
      errors.push({ code: "missing_reveal_character", detail: `${r.reveal_id} -> ${r.character_id}` });

  for (const rel of p.relationship_map)
    for (const end of [rel.from, rel.to])
      if (!charIds.has(end))
        errors.push({ code: "missing_relationship_endpoint", detail: `${rel.relationship_id} -> ${end}` });

  for (const ep of p.episode_cards) {
    for (const rid of ep.reveal_ids)
      if (!revIds.has(rid)) errors.push({ code: "orphan_reveal", detail: `${ep.episode_id} -> ${rid}` });
    for (const bid of ep.relationship_beats)
      if (!relIds.has(bid)) errors.push({ code: "orphan_relationship", detail: `${ep.episode_id} -> ${bid}` });
  }

  return { ok: errors.length === 0, errors };
}
