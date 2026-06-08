# 제안서: Phase 1 Implementation — Foundation Data & Seed (MVP)

## 0. 위치

Pipeline Foundation v001(설계, 2026-06-08 승인)의 **Phase 1 실제 구현** 제안서입니다. 설계 전문: `docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md`.

- 이번엔 **코드를 작성합니다.** 단 범위는 Phase 1 MVP로 엄격 제한.
- 헌법 정합: agent-facing 코드 주석·지침 = concise English / 이 제안서·보고 = 한국어 / 모든 코드에 `[PROPOSAL: ...]` 추적 주석(§3.1).

## 1. 목적

"작품 한 편을 시작할 최소 입력(Seed + 작가 의도 + 서사 형태 + 최소 설계도)을 **입력받아 검증하고 파일로 저장**하는 동작하는 골격"을 만듭니다. LLM·게이트·인물 관리·회차 생성은 **이번 범위 밖**(Phase 2+). 단 **Prompt Firewall 원칙**(Writer에 private/secret 미전달)을 데이터 구조 차원에서 처음부터 강제합니다.

## 2. 범위 (Phase 1에서 실제로 만드는 것)

| 구분 | 만든다 | 안 만든다(후속) |
|---|---|---|
| 입력 | New Work Wizard(4스텝) UI | 대시보드 6화면 |
| 데이터 | seed_settings·authorial_intent·narrative_shape·basic blueprint·basic episode cards 저장 | Character Bible·Reveal·Craft Trait 실데이터 |
| 스키마 | MVP 9종(zod 런타임 검증; 인물 public/private 분리로 8→9) | 후속 stub 스키마 |
| 설계도 | **결정론적** basic Blueprint/Episode Card 생성(LLM 없음) | LLM 기반 Preflight·Candidate Gates |
| 분리 | Context Packager(public/private 타입 분리 + packForWriter) | Writer 호출·실제 firewall 마스킹 로깅 고도화 |
| 관측 | span/telemetry 타입 + 로거(기본 off) | 병목 리포트·대시보드 |
| 테스트 | vitest + 골든 픽스처(seed 왕복·firewall redaction) | 게이트 픽스처·캐너리 |

## 3. 기술 결정 (확정안, 대안 §7)

- **스택:** 기존 템플릿 그대로 **React + TypeScript + Vite**.
- **런타임 검증:** **zod** — TS 타입과 런타임 스키마를 한 곳에서(스키마 드리프트 방지). `z.infer`로 타입 도출.
- **LLM:** Phase 1 **미사용.** basic Blueprint는 Seed에서 결정론적으로 골격만 생성(예: 목표 화수 N → episode_card 1..N 빈 골격).
- **저장(중요):** 브라우저 제약상 Phase 1 런타임 저장은 **localStorage 기반 `StoreAdapter`로 구현**한다(서버 없이 동작). 단 **저장 데이터 모양은 후속 Node/file/DB 저장소의 `data/works/<work_id>/*.json` 구조와 호환**되게 설계한다(같은 키·같은 JSON 형태로 localStorage에 보관 → 후속 어댑터 교체 시 마이그레이션 불필요).
- **`data/` 디렉터리:** Phase 1에서는 **실제 파일 저장을 하지 않는다.** `data/`는 **후속 파일 저장소 대비용 `.gitignore` 항목**으로만 추가(자리 예약). 실제 파일 쓰기는 Node 어댑터 도입 Phase에서.
- **DB·SQLite는 Phase 6으로 보류.**

## 4. 폴더·모듈 구조 (신규)

```text
src/
  core/
    schemas/            zod 스키마 + 타입 (MVP 9종)
      seedSettings.ts  authorialIntent.ts  narrativeShape.ts
      seriesBlueprint.ts  episodeCard.ts  fixture.ts  telemetry.ts  index.ts
    store/  StoreAdapter.ts(인터페이스)  localStore.ts(localStorage 구현)
    preflight/  basicBlueprint.ts   // Seed → 결정론적 basic blueprint + episode cards
    firewall/   contextPackager.ts  // public/private 분리 + packForWriter()
    obs/        span.ts             // span 타입 + 경량 logger (기본 off, 플래그)
  ui/
    NewWorkWizard.tsx
    steps/ Step1Basic.tsx Step2Characters.tsx Step3Rules.tsx Step4ScaleReview.tsx
    useWizardState.ts
  App.tsx
tests/
  schemas.test.ts  seedRoundtrip.test.ts  firewall.test.ts  fixtures/
data/               // Phase 1: 실제 저장 안 함, .gitignore 예약만(후속 파일 저장 대비)
```

## 5. MVP 스키마 9종 (zod, 최소 필드)

> 종 수 기준: 인물은 firewall 위해 `CharacterPublicSeed`/`CharacterPrivate` **2개로 분리**(묶지 않음). 따라서 총 **9종**(설계 §10.2의 "MVP 필수 8" 항목군 + Character 분리로 1 증가). 인물 분리가 이번 firewall 원칙의 핵심이라 의도적으로 둘로 센다.


```ts
// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 MVP schemas
SeedSettings    = { work_id, title?, genre, mood, background, pov, scale, target_episodes, episode_length }
AuthorialIntent = { lasting_feeling, why_this_story, desired_emotion, avoid_cliches[], final_image, negative_space[] }
NarrativeShape  = { mode: 'conflict_arc'|'kishotenketsu'|'mystery_reveal'|'journey_return'|'slice_of_life_accumulation' }
CharacterPublicSeed = { character_id, name, role, one_line }       // public_summary만
CharacterPrivate    = { character_id, private_backstory?, secrets[] } // 분리 저장, Writer 미전달
BasicSeriesBlueprint = { work_id, theme_statement?, arc_outline[], shape_ref }
BasicEpisodeCard     = { episode_id, index, episode_goal?, status:'stub' }
TelemetrySpan = { trace_id, span_id, parent_span_id?, run_id, step, duration_ms, ... } // 키 미기록
FixtureSchema = { id, kind, input, expected }
```

> **Firewall 핵심:** 인물 정보를 `CharacterPublicSeed`(공개) ↔ `CharacterPrivate`(비공개)로 **별도 파일** 분리 저장. `packForWriter()`는 public만 반환. Phase 1에 Writer는 없지만 **분리 경계와 테스트를 지금 고정.**

## 6. 데이터 흐름

```text
사용자 → New Work Wizard(4스텝)
  → zod 검증 → SeedSettings + AuthorialIntent + NarrativeShape + Character{Public,Private}
  → preflight/basicBlueprint(Seed) → BasicSeriesBlueprint + BasicEpisodeCard[1..N] (결정론, status=stub)
  → StoreAdapter.save(work_id, {...})  // localStorage, 단 data/works/<work_id>/*.json과 동일 모양
                                       // 공개군(canonical/intent/shape/public) / 비공개군(private) 분리 키
  → 완료 화면: 저장된 work 요약 표시
(전 과정 obs span 기록, 기본 off)
```

## 7. 대안

- **A. SQLite 즉시:** 구조적이나 Phase 1 과투자. 단일 사용자엔 파일로 충분. → 보류(Phase 6).
- **B. zod 대신 수동 검증:** 가볍지만 타입-런타임 드리프트 위험. → 기각.
- **C. 서버 저장 엔드포인트 먼저:** 견고하나 백엔드 부담. → StoreAdapter 인터페이스 + localStorage로 시작, 후속 교체. (추천)
- **D. basic Blueprint를 LLM으로:** 품질↑이나 범위 초과(키 라우팅·비용). → 결정론 골격만, LLM은 Phase 4.

## 8. 예상 부작용

- 동작 범위 = "입력→검증→저장→요약". 회차 본문·게이트는 아직 없음.
- localStorage 시작 → 대용량·다기기 한계. StoreAdapter라 후속 교체 쉬움.
- basic Blueprint가 빈 골격(stub)이라 내용은 Phase 2에서 채움.
- 의존성 `zod` 1개 추가. `data/`는 `.gitignore` 추가.

## 9. UI 스켈레톤 (New Work Wizard)

```text
┌─ AgentScribe · 새 작품 ─────────────────────────────┐
│ [1.기본] 2.인물 3.규칙 4.분량·Scale·검토   (1/4)    │
│ 제목 [____]  장르 [무협▼] 분위기 [비장▼] 시점 [3인칭▼]│
│ 배경 [________________________]                      │
│ ── 작가 의도 ──                                      │
│ 남길 감각 [____]  왜 이 이야기 [____]                │
│ 마지막 이미지 [____]  말하지 않을 것 [+추가]         │
│                                          [다음 →]    │
└──────────────────────────────────────────────────────┘
Step2 인물: 이름/역할/한줄(public) + [비공개: 과거·비밀](private, 분리저장)
Step3 규칙: 세계 규칙 [+추가]   |   Step4: Shape[기승전결▼] Scale[장편▼] 화수[50] → [검토][작품 생성 ▶]
```

## 10. 테스트 / 완료 기준 (Definition of Done)

- [ ] 의존성·스크립트: `npm i zod` + `npm i -D vitest`, `package.json`에 `"test": "vitest run"` 추가. **UI 테스트는 이번 범위 밖 → Testing Library/jsdom 미도입**(순수 로직 단위 테스트만).
- [ ] `npm run build` · `npm run lint` · `npm test` 통과.
- [ ] vitest: 스키마 valid/invalid, seed 왕복(저장→로드 동일), `packForWriter`가 private 필드 **미포함**.
- [ ] 골든 픽스처: 정상 seed 1 + 잘못된 seed 1(검증 실패) + firewall(private 제외) 1.
- [ ] Wizard로 작품 1개 생성 → 공개군/비공개군 분리 저장 확인.
- [ ] 모든 신규 파일에 `[PROPOSAL: ...]` 추적 주석 + UTF-8.
- [ ] `docs/schemas.md`에 MVP 9종 확정 반영, `docs/state.md` current_phase 갱신.
- [ ] **인코딩 안전 확인:** `docs/proposals/LATEST_PROPOSAL.md`·`docs/schemas.md`·`docs/state.md`가 UTF-8 저장임을 확인한다. PowerShell 콘솔 출력이 깨져 보여도 **파일 자체 인코딩**(예: `file -b` / 바이트 확인)으로 판정하며, 콘솔 렌더링 깨짐을 파일 손상으로 오인하지 않는다.

## 11. 구현 순서

1. `npm i zod` + `npm i -D vitest` + `package.json` `"test": "vitest run"` 추가 + `.gitignore`에 `data/` 추가. (UI 테스트 라이브러리 미도입)
2. `src/core/schemas/*`(zod 9종) + index.
3. `src/core/store/`(StoreAdapter + localStore).
4. `src/core/firewall/contextPackager.ts` + 테스트.
5. `src/core/preflight/basicBlueprint.ts`.
6. `src/core/obs/span.ts`(logger off 기본).
7. `src/ui/NewWorkWizard` 4스텝 + `App.tsx` 연결.
8. `tests/` + fixtures, `docs/schemas.md`·`state.md` 갱신.
9. build/lint/test 통과 확인.

## 12. 승인 체크리스트

- [ ] 스택 React+TS+Vite, 검증 zod, 저장 파일(localStore+StoreAdapter), LLM 미사용에 동의.
- [ ] 인물 정보 public/private 분리 + `packForWriter` private 제외(firewall 원칙)를 Phase 1부터 강제.
- [ ] basic Blueprint/Episode Card는 결정론 stub 골격으로 생성.
- [ ] DB·대시보드·게이트·Writer·Craft Trait·인물 관리 상세는 범위 밖(후속 Phase).
- [ ] 모든 코드에 추적 주석, 문서(schemas/state) 동반 갱신(DOC BEFORE CODE).
- [ ] 승인된 이 제안서를 아카이브에 보관.

## 13. 승인 요청

`APPROVE: proceed` / 수정 `REVISE: ...` / 거절 `REJECT: ...`
