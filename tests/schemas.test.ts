// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §10] Phase 1 schema validation tests
import { describe, it, expect } from "vitest";
import { SeedSettings } from "../src/core/schemas/index.js";
import { seedValid, seedInvalid } from "./fixtures/seed.fixtures.js";

describe("SeedSettings schema", () => {
  it("accepts a valid seed", () => {
    expect(() => SeedSettings.parse(seedValid)).not.toThrow();
  });

  it("rejects invalid seed (bad pov, non-positive episodes)", () => {
    const r = SeedSettings.safeParse(seedInvalid);
    expect(r.success).toBe(false);
  });
});
