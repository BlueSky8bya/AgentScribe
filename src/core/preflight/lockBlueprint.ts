// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5.3] Phase 2 Lock Blueprint (Hard/Soft/Fluid)
import type { WorkRecord, LockState } from "../schemas/index.js";
import { candidateGates } from "./candidateGates.js";
import { schemaCanary } from "./schemaCanary.js";

export interface LockResult {
  locked: boolean;
  work?: WorkRecord;
  reasons: string[];
  needs_ack: string[]; // pure-warn axes awaiting acknowledge
}

/** Default zone assignment for known blueprint element kinds. */
const DEFAULT_ZONES: LockState["zones"] = {
  theme_statement: "hard",
  authorial_intent: "hard",
  ending: "hard",
  world_rules: "hard",
  reveal_schedule: "soft",
  relationship_map: "soft",
  episode_required_events: "soft",
  arc_outline: "soft",
  scene_detail: "fluid",
  dialogue: "fluid",
};

/**
 * Lock succeeds only when there is no reject/blocking_warn and no Schema Canary error.
 * Pure warns are allowed once their axes are acknowledged.
 */
export function lockBlueprint(work: WorkRecord, acknowledgedWarns: string[] = []): LockResult {
  const gate = candidateGates(work);
  const canary = schemaCanary(work);

  const blockers: string[] = [];
  for (const f of gate.findings) {
    if (f.severity === "fatal" || f.severity === "reject" || f.severity === "blocking_warn") {
      blockers.push(`${f.severity}:${f.axis}: ${f.reason}`);
    }
  }
  for (const e of canary.errors) blockers.push(`canary:${e.code}: ${e.detail}`);

  if (blockers.length > 0) {
    return { locked: false, reasons: blockers, needs_ack: [] };
  }

  const warnAxes = gate.findings.filter((f) => f.severity === "warn").map((f) => f.axis);
  const ackSet = new Set(acknowledgedWarns);
  const needsAck = warnAxes.filter((a) => !ackSet.has(a));
  if (needsAck.length > 0) {
    return { locked: false, reasons: ["pure warns require acknowledge"], needs_ack: needsAck };
  }

  const locked: WorkRecord = {
    ...work,
    public: {
      ...work.public,
      lock: { status: "locked", zones: DEFAULT_ZONES, acknowledged_warns: warnAxes },
    },
  };
  return { locked: true, work: locked, reasons: [], needs_ack: [] };
}
