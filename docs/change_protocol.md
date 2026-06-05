<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# docs/change_protocol.md — Ouroboros Change Protocol (Detailed)

> 헌법(`CLAUDE.md` §3)의 확장 상세본. 충돌 시 헌법이 우선.

## 변경 루프

```text
Interview → Proposal → Approval → Evolve & Update → Archive
```

1. **Interview** — 모호하면 관련 질문 일괄 제시, 먼저 명확화.
2. **Proposal** — `docs/proposals/LATEST_PROPOSAL.md`에 한국어로 작성. 필수 섹션: 목적/부작용/대안/비유/스켈레톤/체크리스트.
3. **Approval** — 작성 후 정지. `APPROVE: proceed`만 진행 허가.
4. **Evolve & Update** — 문서 먼저 갱신 → 코드 구현 → 변경 지점에 추적 주석(§3.1).
5. **Archive** — 승인안을 `archive/YYYY-MM-DD/proposal_<topic>_vNNN.md`로 보관.

## 모호함 점수 (Ambiguity Score)

```text
Ambiguity = 1 - Σ(clarity_i × weight_i)
```

> STUB: 차원·가중치 표(Scope/Behavior/Constraints/Acceptance/Side-effects)와 0.2 임계치 운영 세부는 확정 예정.

## 승인 문구

- 승인 `APPROVE: proceed`
- 수정 `REVISE: <무엇>`
- 거절 `REJECT: <이유>`

## 제한적 예외

읽기 전용 / 빌드·테스트(파일 미변경) / 1~2파일 오타·포맷(동작 불변) / 승인된 제안서 범위 내 후속.
> 동작·아키텍처·의존성·스키마·에이전트 규칙·UI·3파일↑ → 루프 복귀.
