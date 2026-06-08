// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 Context Packager / Prompt Firewall
// Phase-1 hard rule: Writer payload carries ONLY public info. private_backstory/secrets never leak.
import type { WorkRecord, CharacterPublicSeed } from "../schemas/index.js";

export interface WriterPayload {
  work_id: string;
  genre: string;
  mood: string;
  pov: string;
  characters: CharacterPublicSeed[]; // public seeds only
  blueprint_theme?: string;
}

/** Build the Writer-facing payload. By construction it cannot include the private group. */
export function packForWriter(work: WorkRecord): WriterPayload {
  const { seed, characters, blueprint } = work.public;
  return {
    work_id: seed.work_id,
    genre: seed.genre,
    mood: seed.mood,
    pov: seed.pov,
    characters: characters.map((c) => ({ ...c })),
    blueprint_theme: blueprint.theme_statement,
  };
}

/** Guard: assert no private field names leaked into a payload (used by tests + runtime audit). */
export function assertNoPrivateLeak(payload: unknown): void {
  const banned = ["private_backstory", "secrets", "private"];
  const json = JSON.stringify(payload);
  for (const key of banned) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`prompt_firewall: private field leaked: ${key}`);
    }
  }
}
