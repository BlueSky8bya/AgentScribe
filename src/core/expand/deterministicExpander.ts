// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 4] Phase 3A deterministic draft generator (NO LLM)
// Rule/archetype based. Produces editable proposals the user accepts/edits/deletes.
import type { ExpanderAdapter, ExpandInput, ExpansionResult } from "./ExpanderAdapter.js";
import type { ImportanceLevel } from "../schemas/characterBible.js";
import type { CharacterRole } from "../schemas/character.js";
import type { ScaleMode } from "../schemas/seedSettings.js";

function importanceFromRole(role: CharacterRole): ImportanceLevel {
  if (role === "protagonist") return "core";
  if (role === "ally" || role === "mentor" || role === "rival" || role === "antagonist") return "major";
  return "minor";
}

function foreshadowCount(scale: ScaleMode): number {
  switch (scale) {
    case "short": return 1;
    case "medium": return 2;
    case "long": return 4;
    case "series": return 6;
  }
}

export class DeterministicExpander implements ExpanderAdapter {
  expand(input: ExpandInput): ExpansionResult {
    const { seed, characters, effective_scale } = input;

    const character_bibles = characters.map((c) => ({
      character_id: c.character_id,
      name: c.name,
      role: c.role,
      importance_level: importanceFromRole(c.role),
      species_or_type: "human" as const,
      public_summary: c.personality_brief ? `${c.one_line} (${c.personality_brief})` : c.one_line,
      species_rules: [],
    }));

    const cast_registry = characters.map((c) => ({
      character_id: c.character_id,
      importance_level: importanceFromRole(c.role),
      introduced_by: "user_seed" as const, // user-provided; expander only proposes attributes
      allowed_scope: (c.role === "protagonist" ? "core" : "recurring") as "core" | "recurring",
      can_affect_main_plot: c.role === "protagonist",
      promotion_status: "not_allowed" as const,
    }));

    // Private backstory/secret candidates (firewalled; user reviews).
    const private_characters = characters.map((c) => ({
      character_id: c.character_id,
      private_backstory: `Draft: ${c.name}'s past shaped by the ${seed.genre} setting.`,
      secrets: c.role === "protagonist" ? ["Draft: a hidden motive"] : [],
    }));

    // Relationships: protagonist <-> each non-protagonist.
    const protagonist = characters.find((c) => c.role === "protagonist") ?? characters[0];
    const relationship_map = protagonist
      ? characters
          .filter((c) => c.character_id !== protagonist.character_id)
          .map((c, i) => ({
            relationship_id: `${seed.work_id}_rel_${i + 1}`,
            from: protagonist.character_id,
            to: c.character_id,
            relationship_type: c.role === "antagonist" || c.role === "rival" ? "rival" : "ally",
            initial_state: "Draft: relationship to be developed",
            planned_turns: [{ episode_range: "early", change: "Draft: first contact" }],
          }))
      : [];

    const theme_ledger = {
      work_id: seed.work_id,
      central_question: `Draft: what does the protagonist risk in a ${seed.mood} ${seed.genre} world?`,
      opposing_values: ["Draft: desire", "Draft: cost"] as [string, string],
      episode_pressure: [],
    };

    const foreshadowing = Array.from({ length: foreshadowCount(effective_scale) }, (_, i) => ({
      foreshadow_id: `${seed.work_id}_fs_${i + 1}`,
      plant_episode: i + 1,
      payoff_episode: Math.min(seed.target_episodes, (i + 1) * 5 + 5),
    }));

    return { character_bibles, cast_registry, relationship_map, theme_ledger, foreshadowing, private_characters };
  }
}
