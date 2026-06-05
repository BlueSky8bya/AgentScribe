<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 -->
# Decision Log: Foundation Bootstrap v001

- 날짜: 2026-06-05
- 제안서: `docs/proposals/archive/2026-06-05/proposal_foundation_bootstrap_v001.md`
- 결정: 핵심 라우팅 문서 14종을 stub로 일괄 생성 (대안 3 채택).

## 핵심 결정
- 인코딩 점검 결과 깨진 한글 0건 → 복구 아닌 신규 생성으로 진행.
- 14종 = docs/ 10개 + src/ 스킬 4개. 전부 PENDING/STUB 명시, UTF-8, 추적 주석 헤더.
- 범위 제외: Vite 샘플 UI, QA 파이썬 구현, `seed_settings.json` → backlog #1~3 기록.

## 대안 기각 사유
- 대안 1(14개 따로): 순환 의존으로 느림.
- 대안 2(핵심 4개만): 세션 체크리스트 절반만 가동.

## 후속
- 각 stub 실제 내용 채우기 = 후속 제안서 (backlog #4).
