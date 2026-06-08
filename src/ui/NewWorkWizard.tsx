// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §9] Phase 1 New Work Wizard (4 steps)
import { useState } from "react";
import { z } from "zod";
import {
  SeedSettings,
  AuthorialIntent,
  NarrativeShape,
  CharacterPublicSeed,
  CharacterPrivate,
  type ShapeMode,
  type WorkRecord,
} from "../core/schemas/index.js";
import { createWork } from "../core/createWork.js";
import { LocalStore } from "../core/store/localStore.js";

const store = new LocalStore();

interface CharRow {
  name: string;
  role: string;
  one_line: string;
  private_backstory: string;
  secrets: string;
}

const SHAPES: ShapeMode[] = [
  "conflict_arc",
  "kishotenketsu",
  "mystery_reveal",
  "journey_return",
  "slice_of_life_accumulation",
];

export function NewWorkWizard({ onComplete }: { onComplete?: (work: WorkRecord) => void }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Step 1 basic + intent
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [pov, setPov] = useState("third_observer");
  const [background, setBackground] = useState("");
  const [lastingFeeling, setLastingFeeling] = useState("");
  const [whyStory, setWhyStory] = useState("");
  const [desiredEmotion, setDesiredEmotion] = useState("");
  const [finalImage, setFinalImage] = useState("");
  const [negativeSpace, setNegativeSpace] = useState("");

  // Step 2 characters
  const [chars, setChars] = useState<CharRow[]>([
    { name: "", role: "protagonist", one_line: "", private_backstory: "", secrets: "" },
  ]);

  // Step 4 scale
  const [shape, setShape] = useState<ShapeMode>("conflict_arc");
  const [scale, setScale] = useState("long");
  const [targetEpisodes, setTargetEpisodes] = useState(50);
  const [episodeLength, setEpisodeLength] = useState(2000);

  function workId() {
    return (title || genre || "work").replace(/\s+/g, "_").toLowerCase() + "_" + targetEpisodes;
  }

  async function submit() {
    setError(null);
    try {
      const id = workId();
      const seed = SeedSettings.parse({
        work_id: id,
        title: title || undefined,
        genre,
        mood,
        background,
        pov,
        scale,
        target_episodes: Number(targetEpisodes),
        episode_length: Number(episodeLength),
      });
      const intent = AuthorialIntent.parse({
        work_id: id,
        lasting_feeling: lastingFeeling,
        why_this_story: whyStory,
        desired_emotion: desiredEmotion,
        avoid_cliches: [],
        final_image: finalImage,
        negative_space: negativeSpace ? negativeSpace.split(",").map((s) => s.trim()) : [],
      });
      const shp = NarrativeShape.parse({ work_id: id, mode: shape });

      const publicCharacters = chars
        .filter((c) => c.name.trim())
        .map((c, i) =>
          CharacterPublicSeed.parse({
            character_id: `${id}_char_${i + 1}`,
            name: c.name,
            role: c.role,
            one_line: c.one_line || "—",
          }),
        );
      const privateCharacters = chars
        .filter((c) => c.name.trim())
        .map((c, i) =>
          CharacterPrivate.parse({
            character_id: `${id}_char_${i + 1}`,
            private_backstory: c.private_backstory || undefined,
            secrets: c.secrets ? c.secrets.split(",").map((s) => s.trim()) : [],
          }),
        );

      const work = await createWork(
        { seed, intent, shape: shp, publicCharacters, privateCharacters },
        store,
      );
      setSavedId(work.public.seed.work_id);
      onComplete?.(work);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError("입력 검증 실패: " + e.issues.map((i) => i.path.join(".") + " " + i.message).join("; "));
      } else {
        setError(String(e));
      }
    }
  }

  if (savedId) {
    return (
      <div className="wizard">
        <h2>작품 생성 완료</h2>
        <p>
          work_id: <code>{savedId}</code> — 공개군/비공개군 분리 저장됨(localStorage).
        </p>
        <button onClick={() => location.reload()}>새 작품</button>
      </div>
    );
  }

  return (
    <div className="wizard">
      <h2>AgentScribe · 새 작품 ({step}/4)</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {step === 1 && (
        <section>
          <label>제목 <input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>장르 <input value={genre} onChange={(e) => setGenre(e.target.value)} /></label>
          <label>분위기 <input value={mood} onChange={(e) => setMood(e.target.value)} /></label>
          <label>시점
            <select value={pov} onChange={(e) => setPov(e.target.value)}>
              <option value="first_protagonist">1인칭 주인공</option>
              <option value="third_observer">3인칭 관찰자</option>
              <option value="omniscient">전지적</option>
            </select>
          </label>
          <label>배경 <textarea value={background} onChange={(e) => setBackground(e.target.value)} /></label>
          <hr />
          <strong>작가 의도</strong>
          <label>남길 감각 <input value={lastingFeeling} onChange={(e) => setLastingFeeling(e.target.value)} /></label>
          <label>왜 이 이야기 <input value={whyStory} onChange={(e) => setWhyStory(e.target.value)} /></label>
          <label>지향 정서 <input value={desiredEmotion} onChange={(e) => setDesiredEmotion(e.target.value)} /></label>
          <label>마지막 이미지 <input value={finalImage} onChange={(e) => setFinalImage(e.target.value)} /></label>
          <label>여백(쉼표 구분) <input value={negativeSpace} onChange={(e) => setNegativeSpace(e.target.value)} /></label>
        </section>
      )}

      {step === 2 && (
        <section>
          <strong>인물 (공개 / 비공개 분리 저장)</strong>
          {chars.map((c, i) => (
            <fieldset key={i}>
              <label>이름 <input value={c.name} onChange={(e) => setChars(upd(chars, i, { name: e.target.value }))} /></label>
              <label>역할
                <select value={c.role} onChange={(e) => setChars(upd(chars, i, { role: e.target.value }))}>
                  <option value="protagonist">주인공</option>
                  <option value="ally">조력자</option>
                  <option value="rival">라이벌</option>
                  <option value="antagonist">적</option>
                  <option value="minor">단역</option>
                </select>
              </label>
              <label>한줄(공개) <input value={c.one_line} onChange={(e) => setChars(upd(chars, i, { one_line: e.target.value }))} /></label>
              <label>과거(비공개) <input value={c.private_backstory} onChange={(e) => setChars(upd(chars, i, { private_backstory: e.target.value }))} /></label>
              <label>비밀(비공개,쉼표) <input value={c.secrets} onChange={(e) => setChars(upd(chars, i, { secrets: e.target.value }))} /></label>
            </fieldset>
          ))}
          <button onClick={() => setChars([...chars, { name: "", role: "minor", one_line: "", private_backstory: "", secrets: "" }])}>+ 인물</button>
        </section>
      )}

      {step === 3 && (
        <section>
          <p>세계 규칙: Phase 1에서는 입력만 스킵 가능(후속 Phase에서 확장). 다음으로 진행.</p>
        </section>
      )}

      {step === 4 && (
        <section>
          <label>Shape
            <select value={shape} onChange={(e) => setShape(e.target.value as ShapeMode)}>
              {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>Scale
            <select value={scale} onChange={(e) => setScale(e.target.value)}>
              <option value="short">단편</option>
              <option value="medium">중편</option>
              <option value="long">장편</option>
              <option value="series">시리즈</option>
            </select>
          </label>
          <label>목표 화수 <input type="number" value={targetEpisodes} onChange={(e) => setTargetEpisodes(Number(e.target.value))} /></label>
          <label>회차 길이 <input type="number" value={episodeLength} onChange={(e) => setEpisodeLength(Number(e.target.value))} /></label>
        </section>
      )}

      <div className="nav">
        {step > 1 && <button onClick={() => setStep(step - 1)}>← 이전</button>}
        {step < 4 && <button onClick={() => setStep(step + 1)}>다음 →</button>}
        {step === 4 && <button onClick={submit}>작품 생성 ▶</button>}
      </div>
    </div>
  );
}

function upd(rows: CharRow[], i: number, patch: Partial<CharRow>): CharRow[] {
  return rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
}
