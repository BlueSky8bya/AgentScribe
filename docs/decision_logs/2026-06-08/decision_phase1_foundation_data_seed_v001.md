<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_phase1_foundation_data_seed_v001.md] Phase 1 (approved + implemented) -->
# Decision Log: Phase 1 — Foundation Data & Seed (MVP)

- 날짜: 2026-06-08 / 상태: APPROVED + IMPLEMENTED
- 제안서: `docs/proposals/archive/2026-06-08/proposal_phase1_foundation_data_seed_v001.md`

## 구현 결정 (확정)

- 스택: React + TypeScript + Vite (기존 템플릿).
- 검증: zod (타입+런타임 단일 출처). 저장: LocalStore(localStorage) + StoreAdapter 인터페이스, 데이터 모양은 `data/works/<id>/{public,private}.json` 호환. `data/`는 gitignore 예약(실제 저장 안 함).
- LLM 미사용. basic Blueprint = 결정론 골격(shape별 arc + episode card 1..N stub).
- **Firewall 원칙 코드화:** 인물 public/private 분리 저장, `packForWriter()`는 public만 + `assertNoPrivateLeak()` 가드.

## 산출물

- `src/core/schemas/*`(9), `store/`, `firewall/`, `preflight/`, `obs/`, `createWork.ts`.
- `src/ui/NewWorkWizard.tsx`(4스텝) → `App.tsx` 마운트.
- `tests/`(5 pass): 스키마 valid/invalid, seed 왕복, firewall private 제외.
- 의존성: zod, vitest(dev), `package.json` `test: vitest run`.

## 검증

- `npm test` 5/5, `npm run build`, `npm run lint` 모두 통과.
- 신규 파일 추적 주석·UTF-8 확인. 문서(schemas/state) 동반 갱신(DOC BEFORE CODE).

## 후속

Phase 2(Editorial Room/Preflight + 인물 산출물 + Candidate Gates + Craft Selection) = 별도 제안서.
