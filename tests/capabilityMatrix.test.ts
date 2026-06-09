// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 13] matrix + availability + canRun
import { describe, it, expect, afterEach } from "vitest";
import {
  CAPABILITY_MATRIX, getEntry, listProviderSummaries, canRunRealGeneration,
} from "../server/providers/capabilityMatrix.js";

const SAVE = { ...process.env };
afterEach(() => {
  process.env = { ...SAVE };
});

describe("capabilityMatrix", () => {
  it("openai is live/stable and can generate real output", () => {
    for (const e of CAPABILITY_MATRIX.filter((x) => x.provider_id === "openai")) {
      expect(e.adapter_mode).toBe("live");
      expect(e.can_generate_real_output).toBe(true);
      expect(e.status).toBe("stable");
    }
    expect(getEntry("openai", "quality")?.model_id).toBe("gpt-5.4");
    expect(getEntry("openai", "cheap")?.model_id).toBe("gpt-5.4-mini");
  });

  it("gemini/claude/deepseek are experimental and NOT real-output (gated)", () => {
    for (const p of ["gemini", "claude", "deepseek"] as const) {
      for (const e of CAPABILITY_MATRIX.filter((x) => x.provider_id === p)) {
        expect(e.can_generate_real_output).toBe(false);
        expect(e.status).toBe("experimental");
      }
    }
  });

  it("3C-2: claude/gemini live adapters but NOT user_selectable; deepseek stays mock", () => {
    for (const p of ["claude", "gemini"] as const) {
      for (const e of CAPABILITY_MATRIX.filter((x) => x.provider_id === p)) {
        expect(e.adapter_mode).toBe("live");
        expect(e.user_selectable).toBe(false);
      }
    }
    for (const e of CAPABILITY_MATRIX.filter((x) => x.provider_id === "deepseek")) {
      expect(e.adapter_mode).toBe("mock");
    }
  });

  it("listProviderSummaries returns availability only, never a key", () => {
    process.env.OPENAI_API_KEY = "sk-secret-value";
    const s = listProviderSummaries();
    expect(s.map((x) => x.id).sort()).toEqual(["claude", "deepseek", "gemini", "openai"]);
    expect(JSON.stringify(s)).not.toContain("sk-secret-value");
    expect(s.find((x) => x.id === "openai")?.available).toBe(true);
  });

  it("canRunRealGeneration: openai needs a key; mock providers need dev flag + key", () => {
    delete process.env.OPENAI_API_KEY;
    expect(canRunRealGeneration("openai")).toBe(false);
    process.env.OPENAI_API_KEY = "x";
    expect(canRunRealGeneration("openai")).toBe(true);

    process.env.GEMINI_API_KEY = "x";
    delete process.env.ALLOW_MOCK_PROVIDERS;
    expect(canRunRealGeneration("gemini")).toBe(false); // mock, no dev flag
    process.env.ALLOW_MOCK_PROVIDERS = "1";
    expect(canRunRealGeneration("gemini")).toBe(true); // mock allowed in dev
  });
});
