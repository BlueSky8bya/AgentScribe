<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# docs/architecture.md — System Architecture

> AgentScribe 전체 구조·파이프라인·데이터 흐름의 단일 출처.
> STUB: 폴더 트리와 모듈 경계는 구현 시작 시 확정.

## 스택

| 레이어 | 기술 | 상태 |
|---|---|---|
| Frontend / Orchestration | Vite + TypeScript | PENDING |
| QA Engine | Python (DSPy 여부 PENDING) | PENDING |
| Shared State | `.md` / `.json` (Blackboard) | 골격 존재 |

## 4-에이전트 파이프라인 (텍스트 다이어그램)

```text
        ┌──────────┐
        │ Director │  배정 / 진행도 / 백로그 검토
        └────┬─────┘
             │ assigns
   ┌─────────┼──────────┐
   ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Planner │ │Writer  │ │  QA    │
│설정생성│→│집필    │→│모순검수│
└───┬────┘ └───┬────┘ └───┬────┘
    │ writes   │ reads    │ cross-checks
    ▼          ▼          ▼
   world_bible.json  /  state.md   (Blackboard)
```

## 데이터 흐름

1. Planner → `world_bible.json`에 설정/상태 기록.
2. Writer → `world_bible` 제약 안에서 본문 생성 (설정 창조 금지).
3. QA → 생성 텍스트를 `world_bible` 상태값과 교차검증 → 모순 시 Writer 반려.
4. 모든 단계 → `state.md` 갱신.

> STUB: 폴더 트리, 빌드 산출물 경로, 에이전트 실행 진입점은 PENDING.

## 폴더 트리 (현재 / 목표)

```text
docs/        거버넌스·상태·설정 문서
src/
  agents/    director, planner, writer (skill .md 골격만)
  python_engine/qa/  QA 스킬 .md 골격만, 구현 PENDING
```

> STUB: `src/` 실제 소스 구조는 구현 제안서에서 확정.
