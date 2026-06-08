<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_phase2_editorial_room_v001.md] Phase 2 (approved + implemented) -->
# Decision Log: Phase 2 — Editorial Room / Preflight + Doc-language Guard

- 날짜: 2026-06-08 / 상태: APPROVED + IMPLEMENTED
- 제안서: `docs/proposals/archive/2026-06-08/proposal_phase2_editorial_room_v001.md`

## 구현 결정

- 결정론(LLM 없음). 의미 판정 축(pov/tone)은 Phase 5로 skip 표시.
- 설계 자산: CharacterBible/CastEntry/Relationship/RevealItem/ThemeLedger/Foreshadow/CraftSelection(stub). public/private firewall 유지(Bible=public, secrets=private).
- WorkRecord 0.2.0 + `migrateWork`(0.1.0→0.2.0, 기본값 채움). LocalStore.load가 로드 시 마이그레이션.
- Candidate Gates severity: fatal/reject/blocking_warn/warn/skip.
- Lock 규칙: reject/blocking_warn/Canary error 시 거부, 순수 warn은 acknowledge 후 허용, pass+clean은 즉시 잠금(Hard/Soft/Fluid 존 태그).
- Doc-language Guard: `scripts/check-doc-lang.mjs`가 agent-facing 파일 한글 검출 → `npm run lint`에 연결. §2 위반 기계 차단.

## 검증

- `npm test` 21/21, `npm run build`, `npm run lint`(eslint + doc-lang) 통과.
- 신규 파일 추적 주석(ASCII-safe `section N`) + UTF-8.
- 수동 UI smoke check: 브라우저 클릭 확인은 개발자 수동 단계로 남김(에이전트가 브라우저 관측 불가). 로직 경로는 lock/gate 테스트로 검증됨.

## 후속

Phase 3 = 별도 제안서.
