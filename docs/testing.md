<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# docs/testing.md — Quality Gates

> 통과 기준 정의. 코드 작성 전·검수 시 적용.
> STUB: 실제 테스트 명령·CI는 PENDING.

## Gate 1 — 상태 동기화

코드 변경 시 관련 설계 문서(`.md`)도 같은 변경에서 갱신되었는가? (DOC BEFORE CODE)

## Gate 2 — 논리성 검증

QA 검수가 이전 장면의 상태값(`world_bible`)을 참조해 현재 텍스트 모순을 잡아내는가?

| 게이트 | 검증 방법 | 상태 |
|---|---|---|
| Gate 1 | 문서-코드 동반 변경 + 추적 주석 존재 | 수동, PENDING 자동화 |
| Gate 2 | QA 교차검증 결과 모순 0 | PENDING (QA 엔진 미구현) |

## 테스트 명령

```text
PENDING: vitest / pytest 설정 후 기재
```

> STUB: 테스트 보고서는 `docs/test_reports/YYYY-MM-DD/`에 보관.
