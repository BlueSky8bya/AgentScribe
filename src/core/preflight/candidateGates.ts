// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5.1] Phase 2 Masterpiece Candidate Gates (deterministic)
// Only structurally-decidable axes here. Semantic axes (pov/tone) are deferred to Phase 5 (severity "skip").
import type { WorkRecord } from "../schemas/index.js";

export type Severity = "fatal" | "reject" | "blocking_warn" | "warn" | "skip";

export interface Finding {
  axis: string;
  severity: Severity;
  reason: string;
}

export interface GateResult {
  verdict: "pass" | "reject" | "warn";
  findings: Finding[];
}

const EARLY_REVEAL_EP = 3; // reveals starting within first N episodes are "early"
const EARLY_REVEAL_MAX = 2;
const PREFLIGHT_CHAR_MAX = 8;

export function candidateGates(work: WorkRecord): GateResult {
  const p = work.public;
  const findings: Finding[] = [];
  const bibleIds = new Set(p.character_bibles.map((c) => c.character_id));

  // 1. core/major characters must have a Character Bible.
  for (const c of p.cast_registry) {
    if ((c.importance_level === "core" || c.importance_level === "major") && !bibleIds.has(c.character_id)) {
      findings.push({ axis: "character_bible_completeness", severity: "fatal", reason: `${c.character_id} (${c.importance_level}) has no Character Bible` });
    }
  }

  // 2. relationships should declare planned_turns.
  for (const r of p.relationship_map) {
    if (r.planned_turns.length === 0) {
      findings.push({ axis: "relationship_planned_turns", severity: "warn", reason: `${r.relationship_id} has no planned_turns` });
    }
  }

  // 3. characters with private secrets should have a reveal scheduled.
  const revealCharIds = new Set(p.reveal_schedule.map((r) => r.character_id));
  for (const pc of work.private.characters) {
    if (pc.secrets.length > 0 && !revealCharIds.has(pc.character_id)) {
      findings.push({ axis: "secret_reveal_scheduled", severity: "warn", reason: `${pc.character_id} has secrets but no reveal scheduled` });
    }
  }

  // 4. early-reveal density.
  const early = p.reveal_schedule.filter((r) => r.allowed_episode_range[0] <= EARLY_REVEAL_EP);
  if (early.length > EARLY_REVEAL_MAX) {
    findings.push({ axis: "early_reveal_density", severity: "warn", reason: `${early.length} reveals in first ${EARLY_REVEAL_EP} episodes (max ${EARLY_REVEAL_MAX})` });
  }

  // 5. agent_preflight cast size.
  const preflightCount = p.cast_registry.filter((c) => c.introduced_by === "agent_preflight").length;
  if (preflightCount > PREFLIGHT_CHAR_MAX) {
    findings.push({ axis: "cast_size", severity: "warn", reason: `${preflightCount} preflight characters (max ${PREFLIGHT_CHAR_MAX})` });
  }

  // 6. non-human characters must declare species_rules.
  for (const b of p.character_bibles) {
    if (b.species_or_type !== "human" && b.species_rules.length === 0) {
      findings.push({ axis: "species_rules_linked", severity: "warn", reason: `${b.character_id} (${b.species_or_type}) has no species_rules` });
    }
  }

  // 7. orphan foreshadow (plant without payoff).
  for (const f of p.foreshadowing) {
    if (f.payoff_episode === undefined) {
      findings.push({ axis: "foreshadow_payoff", severity: "reject", reason: `${f.foreshadow_id} has no payoff_episode` });
    }
  }

  // 8. semantic axes deferred to Phase 5.
  findings.push({ axis: "pov_and_tone_fidelity", severity: "skip", reason: "semantic check deferred to Phase 5 (LLM)" });

  const hasReject = findings.some((f) => f.severity === "fatal" || f.severity === "reject");
  const hasWarn = findings.some((f) => f.severity === "warn" || f.severity === "blocking_warn");
  const verdict: GateResult["verdict"] = hasReject ? "reject" : hasWarn ? "warn" : "pass";
  return { verdict, findings };
}
