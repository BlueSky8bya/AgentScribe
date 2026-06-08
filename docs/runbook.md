<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_auto_verify_commit_push_v001.md] Auto verify/commit/push (approved) -->
# docs/runbook.md — Operations & Recovery

> 세션 시작/복구/롤백 + 코드 변경 절차. 막혔을 때 보는 문서.

## Code Change Checklist (헌법 §9 상세)

**적용 범위:** `APPROVE: proceed`로 승인된 범위의 코드 변경. (승인 전 탐색·읽기·제안서 작성은 대상 아님)

**검증 (순서대로, 전부 통과해야 커밋):**
1. 변경 지점에 `[PROPOSAL: <doc> §<n>] <reason>` 추적 주석(헌법 §3.1).
2. 관련 설계 문서(`.md`) 동반 갱신(DOC BEFORE CODE).
3. `npm run build` 통과.
4. `npm run lint` 통과.
5. `npm test` 통과(테스트 있으면; 신규 로직엔 테스트 추가).

**커밋 단위:** 원칙 = 코드 변경마다. 단 **같은 승인 범위의 작고 관련된 변경은 하나의 검증 단위로 묶을 수 있음**(커밋 난립 방지).

**커밋:**
6. `git status`로 변경 파일 확인 — **승인 범위 밖 파일은 stage/commit 금지.**
7. diff에 `.env`·secret·API key·token·원고 원문 대량 로그가 **없는지 확인.**
8. `git add <특정 파일>` → `git diff --cached` 확인 → `git commit`(Conventional Commits).

**푸쉬 (아래 전부 만족 시에만 자동):**
9. 현재 브랜치가 `main`/`master`가 아니거나 **사용자가 명시 허용한 브랜치**일 것. (이 레포: `main`이 명시 허용 브랜치)
10. 위 검증(3~5) 통과 + 비밀 점검(7) 통과.
11. `git push origin <branch>`. **force push 금지.**

**푸쉬 실패 시:** 네트워크/권한 문제면 **재시도 반복 금지** — local commit까지 된 상태 + 실패 원인을 **보고하고 멈춤**.

**검증 실패 시:** build/lint/test 실패면 커밋·푸쉬 금지, 원인 수정 후 재시도.

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
