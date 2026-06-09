// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// "This work's AI usage" — easy token/cost view (proposal section 9B.2).
// Shows the design-draft cost only (Phase 3B); episode/review costs sum in later.
// ===========================================================================
import type { CostLedgerEntry } from "../core/expand/remoteTypes.js";

export function WorkCostPanel({ cost }: { cost: CostLedgerEntry | null }) {
  if (!cost) return null;
  const modelLabel = cost.fallback_used
    ? "규칙 기반(외부 AI 미사용)"
    : `${cost.provider} / ${cost.model}`;
  return (
    <div style={{ background: "#f7f7f0", padding: 10, borderRadius: 6, margin: "8px 0" }}>
      <strong>이 작품의 AI 사용량 (설계 초안)</strong>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 14 }}>
        <li>
          설계 초안 생성: {cost.total_tokens.toLocaleString()} tokens / 약 ${cost.estimated_cost_usd.toFixed(2)}
        </li>
        <li>사용 모델: {modelLabel}</li>
        <li>fallback: {cost.fallback_used ? `사용됨 (${cost.fallback_reason ?? "-"})` : "없음"}</li>
        <li>가격 기준일: {cost.price_snapshot_date}</li>
      </ul>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#777" }}>
        ※ 여기에는 설계 초안 비용만 포함됩니다. 회차 본문·검수 비용은 이후 단계에서 합산됩니다.
      </p>
    </div>
  );
}
