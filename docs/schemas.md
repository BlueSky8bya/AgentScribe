<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# docs/schemas.md — Data Schemas

> world_bible / state / 메시지 JSON 구조 정의. QA 모순검출의 기준.
> STUB: 필드 타입·검증 규칙은 구현 시 확정.

## world_bible.json

| 필드 | 타입 | 설명 | 상태 |
|---|---|---|---|
| schema_version | string | 스키마 버전 | stub |
| characters[] | object[] | 인물 + 상태 플래그 (예: `arm_status`) | PENDING |
| locations[] | object[] | 장소 | PENDING |
| timeline[] | object[] | 사건 순서 | PENDING |
| state_flags{} | object | 전역 상태 플래그 | PENDING |

캐릭터 객체 (초안):

```json
{
  "id": "PENDING",
  "name": "PENDING",
  "status": { "arm_status": "PENDING" }
}
```

## state.md (구조화 시)

> STUB: state를 .md 표에서 .json으로 승격할지 PENDING.

## 메시지 스키마

`docs/agent_interaction_protocol.md` 참조. type enum 확정 PENDING.
