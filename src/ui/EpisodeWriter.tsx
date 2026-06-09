// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md section 2,3.1] file created under this proposal
// Episode writer: pick episode + provider (user_selectable only) -> generate ->
// review -> SAVE (commit_status=user_saved) or DISCARD. Generated drafts are NOT
// persisted until the user clicks Save. failed drafts are never saved.
// ===========================================================================
import { useEffect, useState } from "react";
import type { WorkRecord, EpisodeDraft } from "../core/schemas/index.js";
import type { CostLedgerEntry, ProviderId, ProviderSummary } from "../core/expand/remoteTypes.js";
import { writeEpisodeRemote } from "../core/writer/remoteWrite.js";
import { LocalStore } from "../core/store/localStore.js";
import { WorkCostPanel } from "./WorkCostPanel.js";

const store = new LocalStore();

export function EpisodeWriter({ work }: { work: WorkRecord }) {
  const [episodeIndex, setEpisodeIndex] = useState(1);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [quality, setQuality] = useState<"save" | "high">("high");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<EpisodeDraft | null>(null);
  const [cost, setCost] = useState<CostLedgerEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { providers: ProviderSummary[] }) => setProviders(d.providers ?? []))
      .catch(() => setProviders([]));
  }, []);

  const total = work.public.seed.target_episodes;

  async function generate() {
    setBusy(true); setError(null); setSaved(false); setDraft(null);
    const opts = quality === "save" ? { provider, budget_class: "save" as const } : { provider, quality_pref: "high" as const };
    const res = await writeEpisodeRemote(work, episodeIndex, opts);
    setCost(res.cost);
    if (!res.draft) { setError(res.error_type ?? "생성 실패"); }
    else if (res.draft.status === "failed") { setError(`생성 실패 (${res.draft.error_type ?? "-"})`); }
    else { setDraft(res.draft); }
    setBusy(false);
  }

  async function save() {
    if (!draft) return;
    await store.saveEpisode({ ...draft, commit_status: "user_saved" });
    setSaved(true);
  }

  function discard() {
    setDraft(null); setSaved(false);
  }

  return (
    <div className="writer">
      <h2>회차 본문 생성 — {work.public.seed.work_id}</h2>
      <div style={{ background: "#f0f4f8", padding: 10, borderRadius: 6 }}>
        <label>회차 <input type="number" min={1} max={total} value={episodeIndex} onChange={(e) => setEpisodeIndex(Number(e.target.value))} /></label>{" "}
        <label>provider{" "}
          <select value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)}>
            {(providers.length ? providers : [{ id: "openai", status: "stable", user_selectable: true, available: true } as ProviderSummary]).map((p) => {
              const ok = p.user_selectable && p.available;
              const label = p.id.toUpperCase() + (p.status !== "stable" ? ` (${p.status})` : "") + (!p.available ? " · 키 없음" : !p.user_selectable ? " · 준비중" : "");
              return <option key={p.id} value={p.id} disabled={!ok}>{label}</option>;
            })}
          </select>
        </label>{" "}
        <label>품질{" "}
          <select value={quality} onChange={(e) => setQuality(e.target.value as "save" | "high")}>
            <option value="save">저비용</option><option value="high">고품질</option>
          </select>
        </label>{" "}
        <button onClick={generate} disabled={busy}>{busy ? "생성 중…" : "본문 생성"}</button>
      </div>

      {busy && <p>AI가 {episodeIndex}화 본문을 쓰는 중입니다… (실패 시 가짜 본문을 만들지 않고 알려드립니다)</p>}
      {error && <p style={{ color: "crimson" }}>{error} — 다시 시도하거나 다른 provider를 선택하세요.</p>}
      <WorkCostPanel cost={cost} />

      {draft && (
        <div>
          <h3>{episodeIndex}화 초안 ({draft.char_count.toLocaleString()}자 / 목표 {draft.target_char_count.toLocaleString()}자) — {draft.provider}/{draft.model}</h3>
          <textarea readOnly value={draft.body_text} style={{ width: "100%", height: 360 }} />
          <div>
            <button onClick={save} disabled={saved}>{saved ? "저장됨 ✓" : "이 회차 저장"}</button>{" "}
            <button onClick={discard}>버리고 다시</button>
          </div>
          {saved && <p style={{ color: "green" }}>저장됨 (commit_status=user_saved). 초안은 저장 전까지 보관되지 않습니다.</p>}
        </div>
      )}
    </div>
  );
}
