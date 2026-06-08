// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 6] Phase 2 Editorial Room orchestration
import type { WorkRecord } from "./schemas/index.js";
import { candidateGates, type GateResult } from "./preflight/candidateGates.js";
import { schemaCanary, type CanaryResult } from "./preflight/schemaCanary.js";
import { lockBlueprint, type LockResult } from "./preflight/lockBlueprint.js";
import type { StoreAdapter } from "./store/StoreAdapter.js";

export interface ReviewResult {
  gate: GateResult;
  canary: CanaryResult;
}

/** Run deterministic review (gates + canary) without mutating the work. */
export function reviewBlueprint(work: WorkRecord): ReviewResult {
  return { gate: candidateGates(work), canary: schemaCanary(work) };
}

/** Attempt to lock; on success, persist the locked work. */
export async function lockAndSave(
  work: WorkRecord,
  store: StoreAdapter,
  acknowledgedWarns: string[] = [],
): Promise<LockResult> {
  const result = lockBlueprint(work, acknowledgedWarns);
  if (result.locked && result.work) {
    await store.save(result.work);
  }
  return result;
}
