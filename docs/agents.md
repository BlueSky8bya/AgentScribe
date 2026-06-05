<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# docs/agents.md — Agent Overview

> 4역할 개요. 상세 스킬은 각 skill 문서로 라우팅.

| 역할 | 책임 | 스킬 문서 | 상태 |
|---|---|---|---|
| Director | 배정·진행도·백로그 검토 | `src/agents/director/director_skill.md` | STUB |
| Planner | 플롯·설정·세계관 상태 생성 | `src/agents/planner/planner_skill.md` | STUB |
| Writer | 제약 내 본문 집필 | `src/agents/writer/writer_skill.md` | STUB |
| QA | 모순·품질·일관성 검수 | `src/python_engine/qa/qa_skill.md` | STUB |

## 핵심 원칙

- Writer는 설정을 임의 창조 못 함 — `world_bible` 제약만 사용.
- QA는 `world_bible` 상태값과 텍스트를 교차검증, 모순 시 반려.
- 모든 역할은 작업 후 `state.md` 갱신.

> STUB: 각 역할 입출력 계약은 해당 skill 문서 + `docs/schemas.md`에서 확정.
