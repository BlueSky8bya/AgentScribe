# 제안서: 코드 변경 시 자동 검증·커밋·푸쉬 지침 (CLAUDE.md + runbook)

## 0. 위치

헌법(`CLAUDE.md`) 수정 + `docs/runbook.md` 상세화. 헌법은 router이므로 **짧은 강제 규칙만** 넣고, 체크리스트 상세는 runbook으로 라우팅.

## 1. 도입 목적

지금은 "코드 바꾸면 무엇을 검증하고 언제 커밋/푸쉬하는가"가 헌법에 없습니다. Phase 1처럼 매번 수동으로 build/lint/test 돌리고 커밋했는데, **규칙으로 못 박아** 빠짐 없이 자동화하려 합니다.

- 단위: **phase가 아니라 "코드 변경마다"**(작은 단위 검증·롤백 쉬움). 단 같은 승인 범위의 작은 관련 변경은 묶을 수 있음.
- 적용: **승인된(`APPROVE: proceed`) 범위의 코드 변경에만.**
- 사장님 요청: **push까지 자동** — 단 runbook 안전 점검 통과 시에만.
- 브랜치: 이 레포는 **`main`이 사용자 명시 허용 브랜치**(지금껏 main 푸쉬 승인). runbook 조건 9를 충족.

## 2. 변경 내용

### 2.1 `CLAUDE.md` — 짧은 강제 규칙 (router 유지, "approved code change" 기준)

§9 Final Enforcement에 **딱 1줄** 추가. 적용 대상은 **승인된(`APPROVE: proceed` 이후) 범위의 코드 변경**에 한정:

```md
- Approved code changes must pass build, lint, and tests, include §3.1 traceability
  comments, then be committed and pushed when runbook safety checks pass.
  Full checklist: docs/runbook.md.
```

> 헌법엔 긴 절차 안 넣음. 세부는 runbook이 가짐(헌법 §5 라우팅 정신).

### 2.2 `docs/runbook.md` — Code Change Checklist 상세

runbook에 "코드 변경 체크리스트" 절 추가.

**적용 범위:** `APPROVE: proceed`로 승인된 범위의 코드 변경. (승인 전 탐색·읽기·제안서 작성은 대상 아님)

**검증 (순서대로, 전부 통과해야 커밋):**
1. 변경 지점에 `[PROPOSAL: <doc> §<n>] <이유>` 추적 주석(헌법 §3.1).
2. 관련 설계 문서(`.md`) 동반 갱신(DOC BEFORE CODE).
3. `npm run build` 통과.
4. `npm run lint` 통과.
5. `npm test` 통과(테스트 있으면; 신규 로직엔 테스트 추가).

**커밋 단위:**
- 원칙 = **코드 변경마다.** 단 **같은 승인 범위 안의 작고 관련된 변경은 하나의 검증 단위로 묶을 수 있음**(커밋 난립 방지).

**커밋:**
6. `git status`로 변경 파일 확인 — **승인 범위 밖 파일은 stage/commit 금지.**
7. diff에 `.env`·secret·API key·토큰·원고 원문 대량 로그가 **없는지 확인.**
8. `git add <특정 파일>` → `git diff --cached` 확인 → `git commit`(Conventional Commits).

**푸쉬 (아래 조건 전부 만족 시에만 자동):**
9. 현재 브랜치가 `main`/`master`가 아니거나, **사용자가 명시 허용한 브랜치**일 것.
10. 위 검증(3~5) 전부 통과 + 7번 비밀 점검 통과.
11. `git push origin <branch>`. **force push 금지.**

**푸쉬 실패 시:**
12. 네트워크/권한 문제로 push 실패 → **재시도 반복 금지.** local commit까지 된 상태 + 실패 원인을 **보고하고 멈춤.**

**검증 실패 시:**
13. build/lint/test 실패 → 커밋·푸쉬 금지, 원인 수정 후 재시도.

## 3. 예상 부작용

- **push 자동화 = 외부 전송 자동.** 안전장치: 승인 범위 한정 + build/lint/test 통과 + 비밀 점검 + diff 확인 후에만 커밋·푸쉬.
- 실수 커밋도 바로 원격 반영 → 새 커밋으로만 정정(**force push 금지**).
- 비밀/키 누출 위험 → `.gitignore`(`.env`·`data/`·`venv`) 차단 + diff에서 secret/token/원고 대량로그 **명시 점검**(runbook 7).
- 범위 밖 파일 혼입 위험 → `git status`로 승인 범위만 stage(runbook 6).
- push 실패 시 무한 재시도 위험 → **재시도 금지, 보고 후 멈춤**(runbook 12).
- 커밋 난립 위험 → 같은 승인 범위 작은 변경은 묶음 허용.
- 헌법 1줄 + runbook 1절 추가. **코드 변경 없음(문서만).**

## 4. 대안

- **A. push 수동 유지(커밋만 자동):** 안전하나 사장님 요청(자동 push)과 불일치. → 기각.
- **B. 헌법에 전체 체크리스트 8줄 다 넣기:** 명확하나 router 비대. → 기각(runbook 라우팅).
- **C. 헌법 1줄 + runbook 상세 (추천):** 짧은 헌법 + 자동 push. 균형.

## 5. 쉬운 비유

출판사 규칙: "원고 한 곳이라도 고치면 → 맞춤법기·교정기 돌려 통과하면 → 즉시 문서고(원격)에 사본 올린다." 규칙은 사무실 입구에 한 줄(헌법), 자세한 순서는 업무 매뉴얼(runbook)에.

## 6. 헌법 최종 문구 (확정)

`CLAUDE.md` §9에 들어갈 줄 (이 1줄만):

```md
- Approved code changes must pass build, lint, and tests, include §3.1 traceability
  comments, then be committed and pushed when runbook safety checks pass.
  Full checklist: docs/runbook.md.
```

## 7. UI/문서 스켈레톤

CLAUDE.md §9 추가 1줄(§6) + runbook "Code Change Checklist" 절(§2.2). UI 없음.

## 8. 승인 체크리스트

- [ ] `CLAUDE.md` §9에 **"approved code change → build+lint+test+§3.1 주석 → runbook 안전점검 통과 시 commit+push"** 1줄 추가(§6 확정 문구).
- [ ] 적용 대상 = **승인된(`APPROVE: proceed`) 범위의 코드 변경.** (탐색·제안서 작성 제외)
- [ ] 규칙 단위 = **코드 변경마다**, 단 같은 승인 범위 작은 관련 변경은 묶음 허용.
- [ ] **push 자동** 포함, **단 runbook 조건 전부 만족 시에만.**
- [ ] runbook 안전 조건: 허용 브랜치(이 레포=main) / 승인 범위만 stage / 비밀(.env·key·token·원고 대량로그) diff 점검 / build·lint·test 통과 / `git diff --cached` 확인 / force push 금지.
- [ ] **push 실패 시 재시도 금지** — local commit 상태 + 원인 보고 후 멈춤.
- [ ] 상세는 `docs/runbook.md`에, 헌법은 1줄(router 유지).
- [ ] 승인안 아카이브.

## 9. 승인 요청

`APPROVE: proceed` / 수정 `REVISE: ...` / 거절 `REJECT: ...`
