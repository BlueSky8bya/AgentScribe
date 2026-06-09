// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Input/Prompt Firewall. Only minimal seed + public/writer-safe character fields
// may reach the LLM. zod strips every unknown key, so private_backstory/secrets,
// server env, internal logs, or injected control fields can never pass through.
// User free-text (background, personality) is carried as DATA only — never used
// as instructions by the expander (system prompt is fixed server-side).
// ===========================================================================
import { z } from "zod";
import { SeedSettings, CharacterPublicSeed } from "../src/core/schemas/index.js";

export const ExpandOptionsSchema = z
  .object({
    // [PROPOSAL: docs/.../proposal_phase3c1_multiprovider_foundation_v001.md section 8] provider is an enum; client cannot name a model
    provider: z.enum(["openai", "gemini", "claude", "deepseek"]).optional(),
    quality_pref: z.enum(["high", "balanced"]).optional(),
    budget_class: z.enum(["save", "normal"]).optional(),
  })
  .optional();

export const ExpandRequestSchema = z.object({
  seed: SeedSettings,
  characters: z.array(CharacterPublicSeed).default([]),
  effective_scale: z.enum(["short", "medium", "long", "series"]),
  options: ExpandOptionsSchema,
});

export type ExpandRequest = z.infer<typeof ExpandRequestSchema>;

/**
 * Validate and strip an inbound /api/expand body to public-only fields.
 * Throws (ZodError) on invalid input; the handler turns that into a 400.
 */
export function sanitizeExpandRequest(body: unknown): ExpandRequest {
  return ExpandRequestSchema.parse(body);
}
