# 제안서: Foundation Bootstrap v001 — 핵심 라우팅 문서 골격 일괄 생성

## 1. 도입 목적

`CLAUDE.md`(헌법)는 28개 경로로 라우팅하지만, 실제 존재하는 건 거버넌스/이력 인프라뿐입니다. 운영·콘텐츠·에이전트 스킬 문서는 **전부 비어 있습니다.**

그래서 세션 시작 체크리스트(§4)가 공회전합니다. `docs/state.md`·`docs/world_bible.json`이 없어 "상태 동기화" 자체가 불가능합니다.

이 제안서의 목적: 헌법이 가리키지만 없는 **핵심 문서 14종을 최소 골격(stub)으로 한 번에 생성**해, 우로보로스 루프와 세션 체크리스트가 실제로 돌 수 있는 바닥을 까는 것입니다. **구현/로직은 만들지 않습니다.** 모양과 자리만 잡습니다.

> 비유: 출판사 건물에 결재 시스템·문서고는 다 지었는데 설정집·원고·직원 매뉴얼이 한 장도 없는 상태. 이번엔 **빈 바인더에 라벨만 붙여 책장에 꽂는** 작업. 내용은 다음 결재에서 채웁니다.

## 2. 인코딩 점검 결과 (범위 1)

요청대로 한글 문서 인코딩을 먼저 점검했습니다.

| 검사 | 결과 |
|---|---|
| `archive/AGENT_HARNESS.md` | UTF-8, 정상 (깨짐 없음) |
| `docs/proposals/LATEST_PROPOSAL.md` | UTF-8, 정상 |
| `docs/adr/.../adr_*.md` 등 한글 문서 | UTF-8 / ASCII, 정상 |

**결론: 현재 깨진 한글 문서는 없습니다.** 복구·재작성 대상 0건.

- 헌법은 "한글이 깨져 보이면 UTF-8 복구를 1순위로"라고 규정하나, 지금은 해당 사항 없음.
- 따라서 이번 제안서는 **복구가 아니라 "신규 문서를 처음부터 UTF-8로 생성"** 하는 것으로 진행합니다.
- 향후 깨짐 발견 시 별도 제안서로 복구 절차를 밟습니다 (이번 범위 밖).

## 3. 변경 내용 (범위 2·3)

아래 14개 문서를 **골격만** 생성합니다. 모든 미구현 부분은 `STUB` / `PENDING`으로 명시합니다.

생성 규칙:
- 한글 본문은 개발자 가독용, 에이전트용 지침 라인은 영어 허용 (헌법 §2 언어정책).
- 모든 파일 UTF-8, BOM 없음.
- 각 문서 상단에 추적 주석 헤더 — `<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->` (헌법 §3.1).
- 미정 항목은 표 안에 `PENDING`, 미구현 섹션은 `> STUB: 다음 제안서에서 채움`.

### 3.1 생성 문서 목록 + 골격 요지

| # | 경로 | 골격 내용 (stub) |
|---|---|---|
| 1 | `docs/state.md` | 현재 페이즈 / 활성 태스크 / 에이전트별 상태 / 마지막 업데이트. 값은 전부 `PENDING` |
| 2 | `docs/architecture.md` | 폴더 트리, 4에이전트 파이프라인 다이어그램(텍스트), 데이터 흐름, 스택(Vite+TS / Python QA). 미정은 PENDING |
| 3 | `docs/change_protocol.md` | 우로보로스 루프 상세 + 모호함 점수 + 승인 문구. 헌법 §3 확장본 |
| 4 | `docs/agent_interaction_protocol.md` | Blackboard 패턴, 메시지 형식, 핸드오프 규칙. 형식만, 구현 PENDING |
| 5 | `docs/agents.md` | 4역할 개요표 + 각 스킬 문서 링크 |
| 6 | `docs/backlog.md` | 빈 백로그 테이블 (우선순위/아이디어/출처/상태) |
| 7 | `docs/world_bible.json` | 빈 스키마 — `characters[] / locations[] / timeline[] / state_flags{}`. 값 비움 |
| 8 | `docs/schemas.md` | world_bible / state / 메시지 JSON 스키마 설명. 필드 표 + PENDING |
| 9 | `docs/testing.md` | 품질 게이트 정의(Gate1 문서동기화 / Gate2 모순검출). 테스트 명령 PENDING |
| 10 | `docs/runbook.md` | 세션 시작/복구/롤백 절차 골격 |
| 11 | `src/agents/director/director_skill.md` | Director 역할·입출력·트리거. 로직 PENDING |
| 12 | `src/agents/planner/planner_skill.md` | Planner 역할·world_bible 쓰기 규칙. PENDING |
| 13 | `src/agents/writer/writer_skill.md` | Writer 역할·제약(설정 창조 금지). PENDING |
| 14 | `src/python_engine/qa/qa_skill.md` | QA 역할·모순 교차검증 로직 자리. DSPy 여부 PENDING |

### 3.2 골격 예시 (각 문서 공통 형태)

```md
<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# docs/state.md — Runtime State (Blackboard)

| 항목 | 값 |
|---|---|
| current_phase | PENDING |
| active_task | PENDING |
| director_status | PENDING |
| planner_status | PENDING |
| writer_status | PENDING |
| qa_status | PENDING |
| last_updated | PENDING |

> STUB: 실제 상태 갱신 규칙은 docs/agent_interaction_protocol.md 확정 후 채움.
```

`docs/world_bible.json` 골격:

```json
{
  "_comment": "[PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub",
  "schema_version": "0.0.1-stub",
  "characters": [],
  "locations": [],
  "timeline": [],
  "state_flags": {}
}
```

### 3.3 폴더 트리 (생성 후)

```text
docs/
  state.md              (new)
  architecture.md       (new)
  change_protocol.md    (new)
  agent_interaction_protocol.md  (new)
  agents.md             (new)
  backlog.md            (new)
  world_bible.json      (new)
  schemas.md            (new)
  testing.md            (new)
  runbook.md            (new)
src/
  agents/
    director/director_skill.md   (new)
    planner/planner_skill.md     (new)
    writer/writer_skill.md       (new)
  python_engine/
    qa/qa_skill.md               (new)
```

## 4. 이번 범위에서 제외 (범위 4)

다음은 **이번 제안서에서 직접 손대지 않습니다.** 후보로만 기록:

- **Vite 샘플 UI** (`src/App.tsx`, `README.md` 등) — 손대지 않음. 다음 단계 후보.
- **QA 엔진 실제 구현** (`src/python_engine/qa/` 파이썬 코드) — 손대지 않음. 골격 `.md`만.
- `docs/seed_settings.json` — 라우팅엔 있으나 이번 14종에서 제외 (world_bible 확정 후 다음 제안서).
- ADR/decision_logs/test_reports 신규 — 이번 변경 결정 기록은 승인 후 1건만 남김.

이 항목들은 `docs/backlog.md` 골격의 첫 엔트리로 적어, 잊히지 않게 합니다.

## 5. 예상 부작용

- 문서 14개 + 폴더 일부 새로 생김 → 저장소가 한 번에 커짐.
- 전부 stub라 "있는데 비었다" 상태 — 채우기 전엔 그 영역 변경 보류해야 함(헌법 §4 "없는 문서는 의존 전 제안").
- stub를 실제 내용으로 오해하면 위험 → 모든 미구현은 `PENDING`/`STUB` 명시로 방지.
- 다음 제안서들이 줄줄이 필요(각 문서 실제 채우기) → 초기 속도 느림, 대신 드리프트 차단.
- `world_bible.json`이 빈 배열이라 QA 모순검출은 아직 동작 안 함(정상 — 골격 단계).

## 6. 대안

### 대안 1: 한 문서씩 따로 제안 (14개 제안서)
가장 안전·세밀. 단 서로 의존(architecture가 state/schema 모양 결정)해 순환 대기 발생, 매우 느림.

### 대안 2: 핵심 4개만 먼저(state/architecture/world_bible/schemas)
최소 부팅. 단 에이전트 스킬·프로토콜 문서가 없어 세션 체크리스트가 절반만 돎.

### 대안 3: 14종 stub 일괄 생성 (추천)
한 번에 바닥 완성, 세션 루프 즉시 가동. stub라 위험 낮음. 내용은 후속 제안서로 점진 채움. **균형 최적.**

## 7. 쉬운 비유

새 출판사 사무실에 **빈 바인더 14권을 라벨 붙여 책장에 꽂는** 일입니다.

- "상태판"(state), "설정집"(world_bible), "직원 매뉴얼 4종"(skills), "작업 규칙집"(protocols)...
- 지금은 표지만 있고 속은 빔. 하지만 **자리와 이름이 생겨**, 다음부터 "설정집 펴봐"가 가능해짐.
- 내용을 한꺼번에 쓰면 부실해지니, 라벨부터 정확히 꽂고 한 권씩 제대로 채웁니다.

## 8. UI/문서 스켈레톤

이번 변경은 UI 없음(문서/JSON만). 텍스트 스켈레톤은 §3.2·§3.3 참조.

세션 시작 흐름이 부팅 후 어떻게 도는지:

```text
세션 시작
  └─ state.md 읽기        → (이제 존재, 값은 PENDING)
  └─ world_bible.json 읽기 → (이제 존재, 빈 스키마)
  └─ backlog.md 훑기       → (이제 존재, 제외 항목 기록됨)
  └─ 라우팅 문서 참조      → (이제 14종 자리 있음)
  └─ 변경 필요 시 우로보로스 진입
```

## 9. 승인 체크리스트

승인하면 아래를 실행합니다.

- [ ] 인코딩 점검 결과(깨짐 0건)를 확인했고, 이번은 복구가 아닌 신규 생성임에 동의한다.
- [ ] `docs/` 하위 10개 문서 골격을 생성한다 (state/architecture/change_protocol/agent_interaction_protocol/agents/backlog/world_bible.json/schemas/testing/runbook).
- [ ] `src/` 하위 4개 스킬 문서 골격을 생성한다 (director/planner/writer/qa).
- [ ] 모든 미구현 부분을 `PENDING`/`STUB`로 명시한다.
- [ ] 모든 신규 파일에 추적 주석 헤더를 단다 (헌법 §3.1).
- [ ] 모든 파일을 UTF-8(BOM 없음)로 저장한다.
- [ ] Vite 샘플 UI와 QA 파이썬 구현은 건드리지 않고 `backlog.md`에 후보로만 기록한다.
- [ ] `seed_settings.json`은 이번 범위에서 제외하고 backlog에 기록한다.
- [ ] 승인된 이 제안서를 날짜별 아카이브에 보관한다.

## 10. 승인 요청

보고서를 확인한 뒤 승인하려면 아래 문구로 답변해 주세요.

`APPROVE: proceed`

수정 요청은 `REVISE: <무엇>`, 거절은 `REJECT: <이유>`.
