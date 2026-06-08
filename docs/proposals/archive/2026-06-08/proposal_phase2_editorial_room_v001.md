# 제안서: Phase 2 Implementation — Editorial Room / Preflight (결정론) + Doc-language Guard

## 0. 위치

Pipeline Foundation v001(설계)의 **Phase 2 구현**. Phase 1(Seed/Intent/Shape/Basic Blueprint 저장)을 기반으로, **회차 생성 전 전체 설계도를 만들고 검수·잠그는 Editorial Room**을 구현합니다.

- 코드 작성. 범위는 Phase 2로 엄격 제한.
- **LLM 미사용(Phase 4 예정).** Candidate Gates·Impact Analysis·Schema Canary는 전부 **결정론적**.
- 헌법 정합: 코드 주석 English / 보고 한국어 / 추적 주석 / 승인 후 검증→커밋→푸쉬(헌법 §9·runbook).

## 1. 목적

Phase 1은 "최소 입력 저장"까지였습니다. Phase 2는 그 위에 **설계 자산(인물 설정집·관계도·공개 일정·주제 원장)을 구조화하고, 결정론으로 검수(Candidate Gates)하고, 통과 시 Blueprint를 잠그는(Lock)** 골격을 만듭니다. "설계 → 검수 → 잠금" 순서를 코드로 강제합니다.

## 2. 범위

| 구분 | 만든다 (Phase 2) | 안 만든다(후속) |
|---|---|---|
| 설계 자산 | Character Bible·Cast Registry·Relationship Map·Reveal Schedule·Theme Ledger 스키마+저장 | LLM 자동 생성(Phase 4) |
| Blueprint | Phase 1 basic → 확장(theme·인물·관계 ref). Episode Card에 reveal/relationship ref | Scene Board(Phase 4) |
| 검수 | **결정론 Candidate Gates**(구조적 14축 중 기계 판정 가능분) | LLM 판정 축(Phase 5) |
| 잠금 | Locked Blueprint(Hard/Soft/Fluid) + lock/unlock 상태 | Cast Promotion Gate 자동(Phase 3) |
| 정합 | Cross-link + Schema Canary(orphan/duplicate 검출) | — |
| 개정 | Blueprint Revision Impact Analysis(결정론 영향 산출) | — |
| Craft | Craft Trait Selection **stub 연결**(입출력 구조만) | Trait Library 실데이터(후속) |
| UI | Preflight Room 화면(생성 결과·게이트 결과·잠금 버튼) | 대시보드 6화면 |
| **언어 가드** | **`check-doc-lang` 스크립트**(agent-facing 파일 한글 검출 → 실패) + `npm run lint` 연결 | — |
| 테스트 | vitest + 픽스처(게이트·canary·impact·lock) | — |

## 3. 기술 결정

- 스택·검증·저장: Phase 1 그대로(React+TS+Vite / zod / LocalStore). **데이터 모양 호환 유지.**
- 새 데이터는 Phase 1 `WorkRecord`에 **확장 필드로 추가**(빅뱅 없음, 하위 호환). `schema_version` 0.1.0 → 0.2.0.
- 인물 정보 **public/private 분리 유지**(firewall). Character Bible의 `private_backstory`·`secrets`는 비공개군.
- Candidate Gates·Impact·Canary = 순수 함수(입력→판정), 테스트 용이.

## 4. 폴더·모듈 구조 (신규/확장)

```text
src/core/
  schemas/             (확장)
    characterBible.ts  castRegistry.ts  relationshipMap.ts  revealSchedule.ts
    themeLedger.ts     craftSelection.ts(stub)
    seriesBlueprint.ts (확장: theme_ref, character_ids, lock_zones)
    episodeCard.ts     (확장: reveal_ids, relationship_beats)
    index.ts           (WorkRecord 0.2.0)
  preflight/
    candidateGates.ts  // 결정론 14축(기계 판정분) → pass/reject+reasons
    schemaCanary.ts    // orphan reveal/relationship, duplicate id
    lockBlueprint.ts   // Hard/Soft/Fluid lock + lock/unlock
    revisionImpact.ts  // Soft Lock 변경 영향 산출(recheck_scope)
  editorialRoom.ts     // 오케스트레이션: 설계 조립 → gates → (pass) lock
src/ui/
  PreflightRoom.tsx    // blueprint/character/gates 표시 + 잠금 버튼
scripts/
  check-doc-lang.mjs   // agent-facing 파일에 한글(가-힣) 있으면 exit 1
tests/
  candidateGates.test.ts  schemaCanary.test.ts  revisionImpact.test.ts  lock.test.ts
  docLang.test.ts        // check-doc-lang 로직 단위 테스트
  fixtures/preflight.fixtures.ts
```

### 4.1 Doc-language Guard (§2 위반 영구 차단)

`scripts/check-doc-lang.mjs`:
- **Agent-facing 대상:** `CLAUDE.md`, `docs/runbook.md`, `docs/architecture.md`, `docs/agents.md`, `docs/schemas.md`, `docs/testing.md`, `docs/agent_interaction_protocol.md`, `docs/state.md`, `docs/backlog.md`, `src/**/*_skill.md`.
- **검사:** 해당 파일 본문에 한글 음절(가-힣) 존재 → 위반 파일·라인 출력 후 **exit 1**.
- **제외:** `docs/proposals/*`, `docs/decision_logs/*`, `docs/adr/*`(developer-facing 한국어 허용), 코드 문자열 리터럴 중 작품 본문 예시는 대상 아님(이번 대상 = 위 목록 고정).
- **연결:** `package.json` `lint` 스크립트를 `eslint . && node scripts/check-doc-lang.mjs`로 확장 → 위반 시 `npm run lint` 실패 → 헌법 §9 워크플로(검증)에서 커밋·푸쉬 차단.
- 검출 로직(순수 함수)은 `docLang.test.ts`로 단위 테스트(위반/정상 케이스).
- **Phase 2에서 갱신/추가되는 agent-facing 문서는 전부 concise English로 작성한다.** 특히 `docs/runbook.md`·`docs/schemas.md`·`docs/state.md`·`docs/architecture.md`·`docs/testing.md`·`src/**/*_skill.md`는 한글이 들어가면 `npm run lint`가 실패하므로, 이번 Phase 2의 해당 문서 갱신은 **반드시 영어**. (이 제안서·결정기록·ADR은 developer-facing이라 한국어 유지)

## 5. 핵심 로직 (결정론)

### 5.1 Candidate Gates — 기계 판정 14축 부분집합

LLM 없이 **구조로 판정 가능한 것만** Phase 2에서:
- core/major 인물마다 Character Bible 존재? (없으면 fatal)
- core 관계마다 Relationship Map `planned_turns` 존재?
- 핵심 비밀/과거마다 Reveal Schedule 항목 존재?
- 초반(예: 1~3화) 과도한 reveal 예정? (밀도 임계 초과 → warn)
- agent_preflight 인물 수 과다? (임계 초과 → warn)
- 비인간 인물 `species_rules`가 World-rule Dependency와 연결?
- 떡밥 plant마다 payoff 대응? (고아 떡밥 → reject)
- 시점/금지요소 위반 등 텍스트 의미 판정 축 → **Phase 5 LLM으로 보류**(이번엔 skip 표시).

출력: `{ verdict: 'pass'|'reject'|'warn', findings: [{axis, severity, reason}] }`. severity ∈ `fatal | reject | blocking_warn | warn`.

**warn 정책:**
- `fatal`/`reject` → **lock 불가.**
- `warn` → 기본 **lock 가능**, 단 UI에 경고 표시 + **acknowledge(사용자 확인)** 필요.
- 특정 구조 위험은 `blocking_warn`으로 승격 가능 → lock 불가(설계상 reject급으로 다룸).
- `lockBlueprint()`는 **`reject` 또는 `blocking_warn` 또는 Schema Canary error가 하나라도 있으면 잠금 거부.** (순수 warn + canary clean → acknowledge 후 잠금 허용)

### 5.2 Schema Canary

cross-link 무결성: missing target / duplicate id / orphan reveal / orphan relationship 검출 → 위반 목록.

### 5.3 Lock Blueprint (Hard/Soft/Fluid)

- 잠금 시 각 요소에 zone 태그(Hard=불변, Soft=승인 절차로만, Fluid=자유).
- `lock()` 성공 조건 = **reject/blocking_warn/Canary error 없음.** 순수 warn은 acknowledge 후 허용. 거부 시 사유 반환.
- Hard 변경 시도 → 거부. Soft 변경 시도 → Revision Impact 요구.

### 5.4 Revision Impact Analysis

Soft Lock 요소 변경 시: 영향받는 Episode Card·Foreshadow·Reveal·Relationship·Theme·Event cross-link 목록 + `recheck_scope` 산출(결정론 그래프 탐색).

## 6. 데이터 흐름

```text
Phase 1 WorkRecord(저장됨)
  → Editorial Room: 설계 자산 입력/확장(Character Bible·Cast·Relationship·Reveal·Theme)
  → Series Blueprint 확장 + Episode Card ref 연결
  → candidateGates(work) + schemaCanary(work)
      → reject/blocking_warn 또는 Schema Canary error 있으면 → 사유 표시, 잠금 불가(설계 수정)
      → warn만 있고 Canary clean → 경고 표시 + 사용자 acknowledge 후 lockBlueprint() 허용
      → pass + clean → 바로 lockBlueprint() → Locked(Hard/Soft/Fluid)
  → 저장(WorkRecord 0.2.0)
(Soft Lock 개정 시 revisionImpact → recheck_scope)
```

## 7. 대안

- **A. LLM Candidate Gates 즉시:** 의미 축까지 검수 가능하나 Phase 2 범위 초과(키 라우팅·비용). → 결정론만, 의미 축은 Phase 5.
- **B. Scene Board까지 Phase 2:** 회차 연출이라 Writer(Phase 4)와 묶는 게 자연스러움. → Phase 4로.
- **C. Editorial Room 결정론 골격 (추천):** 설계 자산·구조 검수·잠금까지. LLM·회차는 후속.

## 8. 예상 부작용

- 동작 범위 = "설계 자산 구조화 → 결정론 검수 → 잠금". 회차 본문·LLM 없음.
- 의미 판정 축(시점 위반·톤 등)은 Phase 2에서 skip 표시 → Phase 5에서 채움.
- WorkRecord 0.1.0 → 0.2.0: 기존 Phase 1 저장분 마이그레이션 필요(확장 필드 기본값 채우기) → 마이그레이션 함수 + 테스트 포함.
- 코드 추가 多. 단 순수 함수라 테스트로 방어.
- **인코딩 깨짐 정규화:** Phase 2에서 수정하는 기존 파일에 `[PROPOSAL: ... 짠5]`·`??` 같은 깨진 traceability/주석 문자가 보이면 **English + ASCII-safe**로 정규화한다. 예: `[PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 5] <reason>`. (section 기호 `§`도 ASCII `section`으로 통일 가능.) 손대지 않는 파일은 별도 정리 대상 아님(번짐 방지).

## 9. UI 스켈레톤 (Preflight Room)

```text
┌─ Editorial Room · <work_id> ────────────────────────┐
│ [설계 자산]                                          │
│  인물: A(주인공)·B(조력자)  [+ Bible 편집]           │
│  관계도: A↔B(동맹, planned_turns 3)                  │
│  공개 일정: rev_B_past (18~25화)                     │
│  주제: 중심질문 / 대립가치                           │
│ ── Candidate Gates ──                                │
│  ✅ core Bible 완비  ⚠ 초반 공개 밀도 높음  ❌ 고아 떡밥 1│
│ ── Schema Canary ── orphan reveal: 0  dup id: 0      │
│ [설계 수정]            (pass 시) [Blueprint 잠금 ▶]  │
└──────────────────────────────────────────────────────┘
```

## 10. 테스트 / 완료 기준 (DoD)

- [ ] `npm run build`·`npm run lint`(= eslint + check-doc-lang)·`npm test` 통과.
- [ ] **check-doc-lang**: agent-facing 파일에 한글 넣으면 `npm run lint` **실패** 확인(음성 테스트). 정상 시 pass.
- [ ] candidateGates: 정상 설계 pass / 고아 떡밥·Bible 누락 reject / 초반 밀도 warn.
- [ ] schemaCanary: orphan reveal·orphan relationship·duplicate id 검출.
- [ ] lock: reject/blocking_warn/Canary error 시 잠금 거부 / **순수 warn은 acknowledge 후 잠금 가능** / pass+clean 시 바로 잠금 + Hard/Soft/Fluid 태그.
- [ ] revisionImpact: Soft 변경 → 영향 목록·recheck_scope 산출.
- [ ] WorkRecord 0.1.0→0.2.0 마이그레이션 테스트.
- [ ] 신규 파일 추적 주석 + UTF-8. `docs/schemas.md`·`docs/state.md` 동반 갱신(English).
- [ ] **`docs/state.md` 갱신 기준:** 구현 완료 시 `current_phase`(=Phase 2), `active_task`, `phase2_status`, `Next`를 Phase 2 상태에 맞게 갱신하고, 낡은 "Phase 1 implementation needs its own proposal" 문구 제거.
- [ ] **수동 UI smoke check (최소 1회):** Wizard 완료 → Preflight Room 이동 → gate 결과 표시 → lock 버튼 동작 → lock 실패/성공 메시지 확인.
- [ ] 헌법 §9 워크플로(검증→커밋→푸쉬) 적용.

## 11. 구현 순서

1. 스키마 확장(characterBible·castRegistry·relationshipMap·revealSchedule·themeLedger·craftSelection stub + blueprint/episodeCard 확장 + WorkRecord 0.2.0 + 마이그레이션).
2. `schemaCanary.ts` + 테스트.
3. `candidateGates.ts`(결정론 축) + 테스트.
4. `lockBlueprint.ts` + `revisionImpact.ts` + 테스트.
5. `editorialRoom.ts` 오케스트레이션.
6. `PreflightRoom.tsx` UI + 라우팅(Wizard 완료 → Preflight Room).
7. **`scripts/check-doc-lang.mjs` + `docLang.test.ts` + `package.json` lint 확장**(eslint + check-doc-lang).
8. fixtures + 문서 갱신 + build/lint/test → 커밋/푸쉬.

## 12. 승인 체크리스트

- [ ] Editorial Room = 설계 자산(Bible/Cast/Relationship/Reveal/Theme) + 결정론 Candidate Gates + Schema Canary + Lock(Hard/Soft/Fluid) + Revision Impact.
- [ ] **LLM 미사용** — 의미 판정 축은 Phase 5로 skip 표시.
- [ ] Craft Trait Selection은 stub 연결(구조만).
- [ ] firewall public/private 분리 유지(Character Bible 비공개군).
- [ ] WorkRecord 0.2.0 + Phase 1 마이그레이션.
- [ ] **Doc-language Guard**: `scripts/check-doc-lang.mjs`로 agent-facing 파일 한글 검출, `npm run lint`에 연결해 §2 위반을 기계적으로 차단(재발 방지).
- [ ] Scene Board·회차 생성·Creative Review는 범위 밖(후속).
- [ ] 추적 주석·문서 동반 갱신·헌법 §9 워크플로.
- [ ] 승인안 아카이브.

## 13. 승인 요청

`APPROVE: proceed` / 수정 `REVISE: ...` / 거절 `REJECT: ...`
