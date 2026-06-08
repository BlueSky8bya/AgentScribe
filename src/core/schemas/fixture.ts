// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schema: Fixture
import { z } from "zod";

/** Golden fixture format. kind selects which target the fixture exercises. */
export const Fixture = z.object({
  id: z.string().min(1),
  kind: z.enum(["seed_valid", "seed_invalid", "firewall_redaction"]),
  input: z.unknown(),
  expected: z.unknown(),
});
export type Fixture = z.infer<typeof Fixture>;
