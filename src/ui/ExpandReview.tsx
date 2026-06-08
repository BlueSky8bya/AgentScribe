// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 6] Phase 3 mixed-initiative review of auto-drafted assets
import { useState } from "react";
import type { WorkRecord } from "../core/schemas/index.js";

/** User reviews rule-based drafts: keep or delete (reject). User is the final decision-maker. */
export function ExpandReview({ work, onConfirm }: { work: WorkRecord; onConfirm: (w: WorkRecord) => void }) {
  const [w, setW] = useState<WorkRecord>(work);

  function dropRelationship(id: string) {
    setW({ ...w, public: { ...w.public, relationship_map: w.public.relationship_map.filter((r) => r.relationship_id !== id) } });
  }
  function dropForeshadow(id: string) {
    setW({ ...w, public: { ...w.public, foreshadowing: w.public.foreshadowing.filter((f) => f.foreshadow_id !== id) } });
  }

  return (
    <div className="review">
      <h2>자동 초안 검토 — {w.public.seed.work_id}</h2>
      <p style={{ color: "#666" }}>아래는 규칙 기반으로 만든 <b>초안(제안)</b>입니다. 마음에 드는 것만 남기세요. 최종 결정은 사용자입니다.</p>
      <p>길이 판정(내부): 고른 <b>{w.public.scale_check?.declared_scale}</b> / 실제 <b>{w.public.scale_check?.effective_scale}</b></p>

      <h3>인물 (자동 설정집 초안)</h3>
      <ul>{w.public.character_bibles.map((c) => <li key={c.character_id}>{c.name} — {c.importance_level} — {c.public_summary}</li>)}</ul>

      <h3>관계 초안</h3>
      <ul>
        {w.public.relationship_map.map((r) => (
          <li key={r.relationship_id}>{r.from} ↔ {r.to} ({r.relationship_type}) <button onClick={() => dropRelationship(r.relationship_id)}>삭제</button></li>
        ))}
        {w.public.relationship_map.length === 0 && <li>—</li>}
      </ul>

      <h3>복선 초안</h3>
      <ul>
        {w.public.foreshadowing.map((f) => (
          <li key={f.foreshadow_id}>{f.foreshadow_id}: {f.plant_episode}화 → {f.payoff_episode}화 <button onClick={() => dropForeshadow(f.foreshadow_id)}>삭제</button></li>
        ))}
        {w.public.foreshadowing.length === 0 && <li>—</li>}
      </ul>

      <h3>주제 초안</h3>
      <p>{w.public.theme_ledger?.central_question}</p>

      <button onClick={() => onConfirm(w)}>이대로 편집실(Editorial Room)로</button>
    </div>
  );
}
