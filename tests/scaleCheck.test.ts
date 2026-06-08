// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 10] Phase 3 scale guard tests
import { describe, it, expect } from "vitest";
import { computeScaleCheck, scaleFromEpisodes, defaultEpisodes } from "../src/core/scale/scaleCheck.js";

describe("scaleCheck", () => {
  it("maps episode counts to scale bands", () => {
    expect(scaleFromEpisodes(3)).toBe("short");
    expect(scaleFromEpisodes(20)).toBe("medium");
    expect(scaleFromEpisodes(80)).toBe("long");
    expect(scaleFromEpisodes(200)).toBe("series");
  });

  it("ok when declared matches effective", () => {
    const c = computeScaleCheck({ declared_scale: "long", target_episodes: 60 });
    expect(c.effective_scale).toBe("long");
    expect(c.scale_consistency).toBe("ok");
    expect(c.planned_total_length).toBe(60 * 5000);
  });

  it("warn at one band off (long declared, 3 episodes => short)", () => {
    const c = computeScaleCheck({ declared_scale: "long", target_episodes: 3, episode_length: 1000 });
    expect(c.effective_scale).toBe("short");
    expect(c.scale_consistency).toBe("blocking_warn"); // long vs short = 2 bands
  });

  it("warn at exactly one band off", () => {
    const c = computeScaleCheck({ declared_scale: "medium", target_episodes: 5 });
    expect(c.scale_consistency).toBe("warn"); // medium vs short = 1 band
  });

  it("provides sensible default episode counts", () => {
    expect(defaultEpisodes("short")).toBeLessThanOrEqual(9);
    expect(defaultEpisodes("series")).toBeGreaterThan(120);
  });
});
