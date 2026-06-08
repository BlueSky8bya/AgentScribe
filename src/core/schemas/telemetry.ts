// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schema: TelemetrySpan
// Observability span. NEVER stores LLM keys.
import { z } from "zod";

export const TelemetrySpan = z.object({
  trace_id: z.string().min(1),
  span_id: z.string().min(1),
  parent_span_id: z.string().optional(),
  run_id: z.string().min(1),
  step: z.string().min(1),
  duration_ms: z.number().nonnegative().optional(),
  // gate/LLM fields are optional in Phase 1 (no gates/LLM yet)
  gate_axis: z.string().optional(),
  verdict: z.string().optional(),
});
export type TelemetrySpan = z.infer<typeof TelemetrySpan>;
