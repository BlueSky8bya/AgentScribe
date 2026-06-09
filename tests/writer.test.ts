// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 9] Writer unit tests (no network)
import { describe, it, expect } from "vitest";
import { koreanRatio, validateBody } from "../server/writer/validate.js";
import { writeEpisode, type WriterRouteDecision } from "../server/writer/writerService.js";
import { buildWriterContract } from "../src/core/writer/writerContract.js";
import { EpisodeDraft } from "../src/core/schemas/episodeDraft.js";
import { bootstrapWork } from "../src/core/bootstrapWork.js";
import { LocalStore, MemoryKv } from "../src/core/store/localStore.js";
import { SeedSettings, NarrativeShape, CharacterPublicSeed, WorldRule } from "../src/core/schemas/index.js";
import type { ProviderAdapter } from "../server/providers/types.js";

const FIXED = () => "2026-01-01T00:00:00Z";
const decision: WriterRouteDecision = { provider: "openai", model: "gpt-5.4", tier: "quality" };

async function makeWork() {
  const seed = SeedSettings.parse({
    work_id: "w", genre: "무협", mood: "비장", background: "전쟁 세계",
    pov: "third_observer", scale: "short", target_episodes: 5, episode_length: 1200,
  });
  const chars = [
    CharacterPublicSeed.parse({ character_id: "A", name: "한설", role: "protagonist", one_line: "차가운 검객", gender: "male" }),
    CharacterPublicSeed.parse({ character_id: "B", name: "유백", role: "ally", one_line: "충직한 사형", gender: "male" }),
  ];
  const shape = NarrativeShape.parse({ work_id: "w", mode: "conflict_arc" });
  const rules = [WorldRule.parse({ rule_type: "general", content: "검기는 내공으로 발현된다" })];
  const store = new LocalStore(new MemoryKv());
  return bootstrapWork({ seed, shape, characters: chars, world_rules: rules }, store);
}

describe("validate", () => {
  it("koreanRatio ignores punctuation/space/digits", () => {
    expect(koreanRatio("그는 칼을 들었다. (123)")).toBeGreaterThan(0.9);
  });
  it("rejects empty and predominantly non-Korean", () => {
    expect(validateBody("   ").ok).toBe(false);
    expect(validateBody("The sword gleamed under the cold moon tonight.").ok).toBe(false);
  });
  it("accepts Korean with small foreign bits", () => {
    expect(validateBody("그는 'OK'라고 말하며 칼을 들었다. 바람이 차가웠고 달빛이 검에 스몄다.").ok).toBe(true);
  });
});

describe("buildWriterContract firewall", () => {
  it("carries no private fields", async () => {
    const work = await makeWork();
    const c = buildWriterContract(work, 1);
    const json = JSON.stringify(c);
    expect(json).not.toContain("private_backstory");
    expect(json).not.toContain("secrets");
    expect(c.episode_contract.active_characters.length).toBeGreaterThan(0);
  });
});

describe("writeEpisode (mock adapter)", () => {
  it("returns a draft on valid Korean output (fixed clock)", async () => {
    const work = await makeWork();
    const contract = buildWriterContract(work, 1);
    const good: ProviderAdapter = {
      id: "openai",
      generate: async () => ({ rawJson: "한설은 검을 뽑았다. 차가운 바람이 골짜기를 훑었고, 유백은 묵묵히 그 뒤를 따랐다. 멀리서 북소리가 울렸다.", usage: { input_tokens: 100, output_tokens: 200 } }),
    };
    const { draft, cost } = await writeEpisode(contract, decision, { adapter: good, now: FIXED });
    expect(draft.status).toBe("draft");
    expect(draft.commit_status).toBe("generated");
    expect(draft.created_at).toBe("2026-01-01T00:00:00Z");
    expect(draft.char_count).toBeGreaterThan(0);
    expect(EpisodeDraft.safeParse(draft).success).toBe(true);
    expect(cost.fallback_used).toBe(false);
  });

  it("fails (no fabricated body) after retries on non-Korean output", async () => {
    const work = await makeWork();
    const contract = buildWriterContract(work, 1);
    const eng: ProviderAdapter = {
      id: "openai",
      generate: async () => ({ rawJson: "The sword gleamed under the cold moon and the wind howled across the valley.", usage: { input_tokens: 10, output_tokens: 20 } }),
    };
    const { draft } = await writeEpisode(contract, decision, { adapter: eng, now: FIXED });
    expect(draft.status).toBe("failed");
    expect(draft.body_text).toBe("");
    expect(draft.error_type).toBe("non_korean");
  });

  it("fails on timeout/api error without fabricating", async () => {
    const work = await makeWork();
    const contract = buildWriterContract(work, 1);
    const boom: ProviderAdapter = { id: "openai", generate: async () => { throw new Error("api_error"); } };
    const { draft } = await writeEpisode(contract, decision, { adapter: boom, now: FIXED });
    expect(draft.status).toBe("failed");
    expect(draft.error_type).toBe("api_error");
  });
});

describe("store refuses to save a failed episode", () => {
  it("throws on saveEpisode(failed)", async () => {
    const store = new LocalStore(new MemoryKv());
    const failed = EpisodeDraft.parse({
      schema_version: "0.1.0", work_id: "w", episode_id: "w_ep_1", episode_index: 1,
      body_text: "", char_count: 0, target_char_count: 1200, provenance: "agent_writer",
      provider: "openai", model: "gpt-5.4", status: "failed", commit_status: "discarded",
      created_at: "2026-01-01T00:00:00Z", error_type: "timeout",
    });
    await expect(store.saveEpisode(failed)).rejects.toThrow();
  });
});
