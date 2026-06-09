// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Tells the user their work info is sent to an external AI API, and that private
// secrets are NOT sent. Shown before AI draft generation (proposal section 9.1).
// ===========================================================================

export function ExternalSendNotice({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div style={{ background: "#eef6ff", padding: 10, borderRadius: 6, margin: "8px 0" }}>
      <label>
        <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} /> AI로 더 풍부한 초안 만들기
      </label>
      <p style={{ fontSize: 13, color: "#345", margin: "6px 0 0" }}>
        AI 초안을 만들기 위해 입력한 작품 정보(시드·공개 인물 정보·세계 규칙)가 외부 AI API로 전송됩니다. API key는
        서버에만 보관되고, 브라우저에는 보이지 않습니다. 비밀 설정(과거사·secret)은 전송되지 않습니다. 끄면 외부 전송
        없이 규칙 기반 초안만 만듭니다.
      </p>
    </div>
  );
}
