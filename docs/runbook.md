<!-- [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] Foundation Bootstrap v001 stub -->
# docs/runbook.md — Operations & Recovery

> 세션 시작/복구/롤백 절차. 막혔을 때 보는 문서.
> STUB: 실제 명령·스크립트는 구현 후 채움.

## 세션 시작

1. `docs/state.md` 읽기 — 현재 상태.
2. `docs/world_bible.json` 읽기 — 세계관.
3. `docs/backlog.md` 훑기.
4. 직전 미완료 태스크 확인.
5. 변경 필요 시 우로보로스 진입.

## 롤백

- 제안서 단위 롤백: `docs/proposals/archive/YYYY-MM-DD/`에서 이전 버전 참조.
- 상태 롤백: `docs/state_snapshots/YYYY-MM-DD/`.

## 장애 대응

| 상황 | 조치 |
|---|---|
| 동일 오류 2회 반복 | 수정 중단, A안/B안 보고 (헌법) |
| 한글 문서 깨짐 | UTF-8 복구 1순위 |
| 문서-코드 불일치 | 둘 다 멈춤, 문서 먼저 수정 |

> STUB: 빌드/실행/배포 명령 PENDING.
