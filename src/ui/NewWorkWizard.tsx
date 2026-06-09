// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 2,3] Phase 3 minimal-seed wizard
import { useState } from "react";
import { z } from "zod";
import {
  SeedSettings,
  NarrativeShape,
  CharacterPublicSeed,
  type ShapeMode,
  type ScaleMode,
  type WorkRecord,
} from "../core/schemas/index.js";
import { bootstrapWork } from "../core/bootstrapWork.js";
import { computeScaleCheck, defaultEpisodes, scaleGuidanceMessage } from "../core/scale/scaleCheck.js";
import { LocalStore } from "../core/store/localStore.js";
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md section 6] LLM expander + cost + notice
import { useEffect } from "react";
import { RemoteExpander } from "../core/expand/remoteExpander.js";
import { DeterministicExpander } from "../core/expand/deterministicExpander.js";
import type { CostLedgerEntry, ProviderId, ProviderSummary } from "../core/expand/remoteTypes.js";
import { ExternalSendNotice } from "./ExternalSendNotice.js";
import { ExpandProgress } from "./ExpandProgress.js";

const store = new LocalStore();

// Smart default: genre -> suggested mood.
const MOOD_BY_GENRE: Record<string, string> = { 무협: "비장", 로맨스: "설렘", 판타지: "웅장", 미스터리: "긴장" };

const SCALES: { id: ScaleMode; label: string; desc: string }[] = [
  { id: "short", label: "단편", desc: "짧게 끝나는 이야기" },
  { id: "medium", label: "중편", desc: "한 가지 큰 사건을 충분히 다루는 이야기" },
  { id: "long", label: "장편", desc: "여러 사건과 인물 변화가 쌓이는 긴 이야기" },
  { id: "series", label: "시리즈", desc: "여러 아크로 이어지는 큰 이야기" },
];

interface CharRow { name: string; role: string; gender: string; personality: string }

export function NewWorkWizard({ onComplete }: { onComplete?: (work: WorkRecord, cost: CostLedgerEntry | null) => void }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  // [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md section 9.1] AI on/off + external-send consent
  const [useAi, setUseAi] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 8] provider + tier picker
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [tierPref, setTierPref] = useState<"save" | "high">("high");

  useEffect(() => {
    // Load provider availability/status (no keys returned). Failure -> default openai only.
    fetch("/api/providers")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { providers: ProviderSummary[] }) => setProviders(d.providers ?? []))
      .catch(() => setProviders([]));
  }, []);

  const selectedProvider = providers.find((p) => p.id === provider);
  const deepseekWarn = provider === "deepseek";

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("무협");
  const [mood, setMood] = useState("비장");
  const [background, setBackground] = useState("");
  const [chars, setChars] = useState<CharRow[]>([{ name: "", role: "protagonist", gender: "unspecified", personality: "" }]);
  const [scale, setScale] = useState<ScaleMode>("long");
  const [shape] = useState<ShapeMode>("conflict_arc");
  const [overrideReason, setOverrideReason] = useState<string>("");

  // Advanced (hidden by default): episode count + length.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetEpisodes, setTargetEpisodes] = useState<number>(defaultEpisodes("long"));
  const [episodeLength, setEpisodeLength] = useState(5000);

  function pickScale(s: ScaleMode) {
    setScale(s);
    if (!showAdvanced) setTargetEpisodes(defaultEpisodes(s)); // auto-fill unless user overrode
  }

  const check = computeScaleCheck({ declared_scale: scale, target_episodes: targetEpisodes, episode_length: episodeLength, scale_override_reason: overrideReason || undefined });
  const guidance = scaleGuidanceMessage(check);

  function workId() {
    return (title || genre || "work").replace(/\s+/g, "_").toLowerCase() + "_" + targetEpisodes;
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const id = workId();
      const seed = SeedSettings.parse({
        work_id: id, title: title || undefined, genre, mood, background,
        pov: "third_observer", scale, target_episodes: Number(targetEpisodes), episode_length: Number(episodeLength),
      });
      const characters = chars.filter((c) => c.name.trim()).map((c, i) =>
        CharacterPublicSeed.parse({
          character_id: `${id}_char_${i + 1}`, name: c.name, role: c.role,
          one_line: c.personality || "—", gender: c.gender, personality_brief: c.personality,
        }),
      );
      const shp = NarrativeShape.parse({ work_id: id, mode: shape });
      // AI on -> RemoteExpander (server LLM, deterministic fallback); off -> deterministic only.
      const options = tierPref === "save" ? { provider, budget_class: "save" as const } : { provider, quality_pref: "high" as const };
      const expander = useAi ? new RemoteExpander({ options }) : new DeterministicExpander();
      const work = await bootstrapWork({ seed, shape: shp, characters, scale_override_reason: overrideReason || undefined }, store, expander);
      const cost = expander instanceof RemoteExpander ? expander.lastCost : null;
      onComplete?.(work, cost);
    } catch (e) {
      setError(e instanceof z.ZodError ? "입력 확인 필요: " + e.issues.map((i) => i.path.join(".")).join(", ") : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wizard">
      <h2>새 작품 ({step}/3)</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {step === 1 && (
        <section>
          <label>제목 <input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>장르 <input value={genre} onChange={(e) => { setGenre(e.target.value); if (MOOD_BY_GENRE[e.target.value]) setMood(MOOD_BY_GENRE[e.target.value]); }} /></label>
          <label>분위기 <input value={mood} onChange={(e) => setMood(e.target.value)} /> <small>(장르 따라 자동 추천)</small></label>
          <label>배경 <textarea value={background} onChange={(e) => setBackground(e.target.value)} /></label>
        </section>
      )}

      {step === 2 && (
        <section>
          <strong>인물 (이름 · 역할 · 성별 · 한 줄 성격)</strong>
          {chars.map((c, i) => (
            <fieldset key={i}>
              <input placeholder="이름" value={c.name} onChange={(e) => setChars(upd(chars, i, { name: e.target.value }))} />
              <select value={c.role} onChange={(e) => setChars(upd(chars, i, { role: e.target.value }))}>
                <option value="protagonist">주인공</option><option value="ally">조력자</option>
                <option value="rival">라이벌</option><option value="antagonist">적</option><option value="minor">단역</option>
              </select>
              <select value={c.gender} onChange={(e) => setChars(upd(chars, i, { gender: e.target.value }))}>
                <option value="unspecified">성별?</option><option value="male">남</option>
                <option value="female">여</option><option value="nonbinary">논바이너리</option><option value="other">기타</option>
              </select>
              <input placeholder="한 줄 성격" value={c.personality} onChange={(e) => setChars(upd(chars, i, { personality: e.target.value }))} />
            </fieldset>
          ))}
          <button onClick={() => setChars([...chars, { name: "", role: "minor", gender: "unspecified", personality: "" }])}>+ 인물</button>
        </section>
      )}

      {step === 3 && (
        <section>
          <strong>작품 길이</strong>
          <div>
            {SCALES.map((s) => (
              <label key={s.id} style={{ display: "block", margin: "4px 0" }}>
                <input type="radio" name="scale" checked={scale === s.id} onChange={() => pickScale(s.id)} />{" "}
                <b>{s.label}</b> — {s.desc}
              </label>
            ))}
          </div>
          {guidance && (
            <div style={{ background: "#fff3cd", padding: 8, borderRadius: 6 }}>
              <p>{guidance}</p>
              <label>특별한 형식으로 진행(이유):
                <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="예: 긴 단편 연재" />
              </label>
            </div>
          )}
          <p>
            <button onClick={() => setShowAdvanced((v) => !v)}>{showAdvanced ? "고급 설정 닫기" : "고급 설정"}</button>
          </p>
          {showAdvanced && (
            <div>
              <label>목표 화수 <input type="number" value={targetEpisodes} onChange={(e) => setTargetEpisodes(Number(e.target.value))} /></label>
              <label>회차 길이(자) <input type="number" value={episodeLength} onChange={(e) => setEpisodeLength(Number(e.target.value))} /></label>
            </div>
          )}
          <ExternalSendNotice enabled={useAi} onToggle={setUseAi} />
          {useAi && (
            <div style={{ background: "#f0f4f8", padding: 10, borderRadius: 6, margin: "8px 0" }}>
              <label>
                provider:{" "}
                <select value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)}>
                  {(providers.length ? providers : [{ id: "openai", status: "stable", can_generate_real_output: true, available: true } as ProviderSummary]).map((p) => {
                    const selectable = p.can_generate_real_output && p.available;
                    const label =
                      p.id.toUpperCase() +
                      (p.status !== "stable" ? ` (${p.status})` : "") +
                      (!p.available ? " · 키 없음" : !p.can_generate_real_output ? " · 준비중" : "");
                    return (
                      <option key={p.id} value={p.id} disabled={!selectable}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>{" "}
              <label>
                품질:{" "}
                <select value={tierPref} onChange={(e) => setTierPref(e.target.value as "save" | "high")}>
                  <option value="save">저비용</option>
                  <option value="high">고품질</option>
                </select>
              </label>
              {selectedProvider && selectedProvider.status !== "stable" && (
                <p style={{ fontSize: 12, color: "#a55", margin: "6px 0 0" }}>
                  이 provider는 아직 준비 중입니다(experimental). 실제 생성은 안정화 후 가능합니다.
                </p>
              )}
              {deepseekWarn && (
                <p style={{ fontSize: 12, color: "#a55", margin: "6px 0 0" }}>
                  ⚠ DeepSeek: 데이터 전송/보관·검열·구조화 안정성 미검증. 선택 시 주의.
                </p>
              )}
            </div>
          )}
          {submitting && <ExpandProgress usingAi={useAi} />}
        </section>
      )}

      <div className="nav">
        {step > 1 && <button onClick={() => setStep(step - 1)} disabled={submitting}>이전</button>}
        {step < 3 && <button onClick={() => setStep(step + 1)}>다음</button>}
        {step === 3 && <button onClick={submit} disabled={submitting}>{submitting ? "만드는 중…" : "초안 만들기"}</button>}
      </div>
    </div>
  );
}

function upd(rows: CharRow[], i: number, patch: Partial<CharRow>): CharRow[] {
  return rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
}
