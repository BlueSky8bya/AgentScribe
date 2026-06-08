<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_auto_verify_commit_push_v001.md] Auto verify/commit/push (approved) -->
# Decision Log: Auto Verify / Commit / Push

- 날짜: 2026-06-08 / 상태: APPROVED + 반영
- 제안서: `docs/proposals/archive/2026-06-08/proposal_auto_verify_commit_push_v001.md`

## 결정

승인된 코드 변경마다: build+lint+test 통과 + §3.1 추적주석 → runbook 안전점검 통과 시 **commit + push 자동**.

- 헌법 `CLAUDE.md` §9에 **1줄**(router 유지), 상세 13단계는 `docs/runbook.md` Code Change Checklist.
- 단위: 코드 변경마다(같은 승인 범위 작은 변경은 묶음 허용).
- 적용: `APPROVE: proceed` 승인 범위 한정.

## 안전장치

- push 조건: 허용 브랜치(이 레포=main) / 승인 범위만 stage / 비밀(.env·key·token·원고 대량로그) diff 점검 / build·lint·test 통과 / `git diff --cached` 확인 / **force push 금지**.
- push 실패: 재시도 반복 금지 → local commit 상태 + 원인 보고 후 멈춤.

## 반영 문서

`CLAUDE.md` §9(+1줄), `docs/runbook.md`(Code Change Checklist 절). 코드 변경 없음.
