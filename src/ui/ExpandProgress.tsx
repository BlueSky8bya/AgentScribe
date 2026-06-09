// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Progress indicator shown while the AI design draft is being generated.
// ===========================================================================

export function ExpandProgress({ usingAi }: { usingAi: boolean }) {
  return (
    <div style={{ background: "#f4f4f4", padding: 12, borderRadius: 6, margin: "8px 0" }}>
      <p style={{ margin: 0 }}>
        {usingAi ? "AI가 설계 초안을 만드는 중입니다…" : "규칙 기반 초안을 만드는 중입니다…"}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
        인물 설정·관계·주제·복선 초안을 준비합니다. 잠시만 기다려 주세요.
      </p>
    </div>
  );
}
