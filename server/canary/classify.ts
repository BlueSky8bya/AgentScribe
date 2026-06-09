// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2c_canary_fallback_fix_v001.md section 3,4] file created under this proposal
// Robust JSON extraction + LlmDraft validation + failure classification.
// Classifies WITHOUT keeping raw prompt/output: returns only a failure type,
// zod issue codes, and zod paths (schema keys, not user data).
// ===========================================================================
import { z } from "zod";

/** LLM enrichment draft (text-only; structure stays deterministic + schema-valid). */
export const LlmDraft = z.object({
  characters: z
    .array(
      z.object({
        character_id: z.string(),
        public_summary: z.string().default(""),
        private_backstory: z.string().default(""),
        secrets: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  theme: z
    .object({ central_question: z.string().default(""), opposing_values: z.array(z.string()).default([]) })
    .default({ central_question: "", opposing_values: [] }),
  relationships: z
    .array(z.object({ from: z.string(), to: z.string(), initial_state: z.string().default("") }))
    .default([]),
});
export type LlmDraft = z.infer<typeof LlmDraft>;

/** Strip code fences and pull the outermost {...} object. Returns null if none. */
export function extractJsonObject(s: string): string | null {
  let t = s.trim();
  if (t.startsWith("```")) t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return t.slice(first, last + 1);
}

export interface ParseDraftOk { ok: true; draft: LlmDraft; }
export interface ParseDraftErr { ok: false; failure: DraftFailure; }
export type ParseDraftResult = ParseDraftOk | ParseDraftErr;

export type FailureType = "ok" | "empty" | "json_parse" | "zod_invalid";

export interface DraftFailure {
  type: Exclude<FailureType, "ok">;
  zod_issue_codes?: string[];
  zod_paths?: string[]; // schema key paths only (e.g. "characters.0.character_id") — never user data
}

/** Parse raw model text into an LlmDraft, or return a classified failure. */
export function parseDraft(rawText: string): ParseDraftResult {
  if (!rawText || rawText.trim().length === 0) return { ok: false, failure: { type: "empty" } };
  const extracted = extractJsonObject(rawText);
  if (extracted === null) return { ok: false, failure: { type: "json_parse" } };
  let obj: unknown;
  try {
    obj = JSON.parse(extracted);
  } catch {
    return { ok: false, failure: { type: "json_parse" } };
  }
  const r = LlmDraft.safeParse(obj);
  if (r.success) return { ok: true, draft: r.data };
  return {
    ok: false,
    failure: {
      type: "zod_invalid",
      zod_issue_codes: r.error.issues.map((i) => i.code),
      zod_paths: r.error.issues.map((i) => i.path.join(".")),
    },
  };
}

/** Classify a raw model output into a failure type (no raw content retained). */
export function classifyDraftFailure(rawText: string): DraftFailure | { type: "ok" } {
  const r = parseDraft(rawText);
  return r.ok ? { type: "ok" } : r.failure;
}
