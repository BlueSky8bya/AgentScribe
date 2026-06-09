// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 1,5] file created under this proposal
// Assemble the writer-safe Episode Contract from a WorkRecord's PUBLIC group only.
// Never touches the private group. assertNoPrivateLeak guards the result before it
// is sent to the server / LLM.
// ===========================================================================
import type { WorkRecord } from "../schemas/index.js";
import { assertNoPrivateLeak } from "../firewall/contextPackager.js";

export interface WriterContract {
  work_id: string;
  episode_index: number;
  authorial_intent: { lasting_feeling: string; desired_emotion: string; final_image?: string };
  blueprint_slice: { episode_goal?: string; theme_statement?: string };
  episode_contract: {
    pov: string;
    target_char_count: number;
    active_characters: { character_id: string; name: string; role: string; public_summary: string }[];
    active_relationship_beats: { from: string; to: string; relationship_type: string; initial_state?: string }[];
    allowed_character_reveals: { reveal_id: string; character_id: string; reveal_mode: string }[];
    forbidden_character_reveals: { reveal_id: string; character_id: string }[];
    allowed_new_characters: number;
    world_rules: { rule_type: string; content: string }[];
    reader_experience_goals: string[];
  };
}

/** Build the contract for episode N. Public/writer-safe fields only. */
export function buildWriterContract(work: WorkRecord, episodeIndex: number): WriterContract {
  const p = work.public;
  const card = p.episode_cards.find((c) => c.index === episodeIndex);

  const allowed_character_reveals = p.reveal_schedule
    .filter((r) => episodeIndex >= r.allowed_episode_range[0] && episodeIndex <= r.allowed_episode_range[1])
    .map((r) => ({ reveal_id: r.reveal_id, character_id: r.character_id, reveal_mode: r.reveal_mode }));

  const forbidden_character_reveals = p.reveal_schedule
    .filter((r) => episodeIndex < r.forbidden_before)
    .map((r) => ({ reveal_id: r.reveal_id, character_id: r.character_id }));

  const contract: WriterContract = {
    work_id: p.seed.work_id,
    episode_index: episodeIndex,
    authorial_intent: {
      lasting_feeling: p.intent.lasting_feeling,
      desired_emotion: p.intent.desired_emotion,
      final_image: p.intent.final_image,
    },
    blueprint_slice: { episode_goal: card?.episode_goal, theme_statement: p.blueprint.theme_statement },
    episode_contract: {
      pov: p.seed.pov,
      target_char_count: p.seed.episode_length,
      active_characters: p.character_bibles.map((c) => ({
        character_id: c.character_id, name: c.name, role: c.role, public_summary: c.public_summary,
      })),
      active_relationship_beats: p.relationship_map.map((r) => ({
        from: r.from, to: r.to, relationship_type: r.relationship_type, initial_state: r.initial_state,
      })),
      allowed_character_reveals,
      forbidden_character_reveals,
      allowed_new_characters: 0,
      world_rules: p.world_rules.map((w) => ({ rule_type: w.rule_type, content: w.content })),
      reader_experience_goals: card?.episode_goal ? [card.episode_goal] : [],
    },
  };

  // Hard firewall: the contract must carry no private field names.
  assertNoPrivateLeak(contract);
  return contract;
}
