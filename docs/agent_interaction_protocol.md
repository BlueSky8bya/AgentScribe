<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# docs/agent_interaction_protocol.md — Agent Interaction (Blackboard)

> 에이전트 간 협업은 중앙 게시판(Blackboard) 방식. 직접 호출 대신 공유 상태 파일로 조율.
> STUB: 메시지 스키마·핸드오프 트리거 구현은 PENDING.

## Blackboard

| 보드 | 파일 | 쓰기 권한 |
|---|---|---|
| 런타임 상태 | `docs/state.md` | 모든 에이전트 (자기 칸) |
| 세계관/설정 | `docs/world_bible.json` | Planner |
| 백로그 | `docs/backlog.md` | Director |

## 메시지 형식 (초안)

```json
{
  "from": "director",
  "to": "planner",
  "type": "assign | submit | reject | done",
  "task_id": "PENDING",
  "payload": {}
}
```

> STUB: type enum 확정, 검증 스키마는 `docs/schemas.md`에서.

## 핸드오프 규칙 (골격)

1. Director가 태스크 배정 → `state.md` active_task 갱신.
2. Planner 완료 → world_bible 갱신 + Writer로 핸드오프.
3. Writer 제출 → QA 검수.
4. QA 반려(reject) → Writer 재작업 루프. 2회 반복 시 Director에 에스컬레이션(헌법 NO ENDLESS LOOPS).

> STUB: 실제 트리거 메커니즘(폴링/이벤트)은 구현 제안서에서.
