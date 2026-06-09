# 제안서: Phase 3C-2b — Provider Canary 승격 (Claude → Gemini)

## 한눈에 보는 요약 (초보용)

3C-2에서 Claude·Gemini에 실 배관(어댑터)은 깔았지만 "준비중(회색)"입니다. **이번엔 실제 시험(smoke canary)을 돌려서, 합격한 provider만 정식 선택 가능(user_selectable=true)으로 바꿉니다.**

> **비유:** 새로 연결한 화구를 같은 레시피 5개로 실제로 켜봄. 불 고르고(스키마 100%), 연기 없고(비밀유출 0), 실패 없으면(fallback 0) "정식" 라벨. 하나라도 어기면 "실험중" 그대로.

**중요 — 키와 실행 주체:** 시험은 **실제 Claude/Gemini API를 호출**하므로 **키와 비용이 필요**합니다. 키는 **서버 env에만**, 실행은 **소유주가 dev에서** 합니다(에이전트는 키가 없어 직접 호출 불가). 코딩 에이전트는 **시험 도구(CLI)와 승격 절차**를 만들고, 시험 **통과가 확인된 provider만 1줄로 승격**합니다.

**화면 변화:** 합격 provider가 드롭다운에서 회색→활성으로.

---

## 0. 위치

3C-2(live 어댑터, gated) 위. matrix/adapter/canary(runner·caps)/llmLog 재사용. 신규 = **canary 실행 CLI** + **결과 기록(test report)** + **승격(matrix user_selectable=true) 절차**. 순서 **Claude → Gemini**. DeepSeek live는 제외(별도).

## 1. 목적

- Claude/Gemini를 **실 API smoke canary**로 검증.
- 기준 통과 provider만 **user_selectable=true 수동 승격**.
- 실패 provider는 experimental + user_selectable=false 유지.

## 2. 범위

| 만든다 | 안 만든다 |
|---|---|
| `canary:provider` 실행 CLI(서버, 1 provider smoke) | 자동 CI 실행, 자동 승격 |
| caps 가드(provider ≤10, 전체 ≤20, ≤$5) | provider→provider 자동 폴백/라우팅 |
| first/subsequent latency 기록 | statistical(N≥20)·stable 승격(후속) |
| payload_class 검증(public+writer-safe만) | DeepSeek live |
| 통과 시 user_selectable=true 승격(1줄) + test report + decision log | UI 재설계 |

## 3. canary 실행 방식

- `server/canary/runCli.ts` (npm `canary:provider -- <claude|gemini>`): seedBank(N=5) × 1호출 = provider당 **최대 5 calls**(pairwise 미포함 → 10 미만).
- **gated-live 실행은 별도 dev 플래그** `ALLOW_GATED_LIVE_CANARY=1`로 허용(= "mock 승격"이 아니라 **gated live provider를 canary로 실행 허용"**). 기존 `ALLOW_MOCK_PROVIDERS`와 별개. + provider 키 env 필요(없으면 즉시 중단·안내).
- `runCanaryBounded`로 caps 강제. 각 케이스: schema_ok / json_parse_failed / caps_ok / **secret_leak_count**.
- **payload 캡처 검증**: 실제 어댑터로 보낸 payload가 **public_seed + writer-safe만**인지 케이스별 **내부 검사**(private/secret 문자열 미포함). 위반 시 leak 카운트. **원문 payload는 report/log에 미저장** — boolean(`payload_class_ok`) + 필요 시 hash/redacted만 기록.
- 결과 = `CanaryReport`(canary_version, provider, model, adapter_mode, status_before/after, schema_success_rate, json_parse_failure_rate, fallback_rate, cap_compliance_rate, private_secret_leak_count) + **latency 분리**(`first_request_latency_ms`, `subsequent_latency_ms_p50/p95`).
- **실행은 수동**(소유주, dev). 에이전트는 CLI·집계·기록만 구현.

## 4. 캡(하드)

- provider당 **≤10 calls**(실제 smoke 5).
- 전체(Claude+Gemini) **≤20 calls**.
- 총비용 **≤$5**(verified 가격 기준 누적, 초과 전 중단).
- 초과 시 abort + 미완료 보고. 자동 재시도 루프 없음.

## 5. 승격 기준 (전부 충족해야 통과)

- `private_secret_leak_count = 0` (필수).
- `schema_success_rate = 100%` (smoke, N=5).
- `fallback_rate = 0`.
- payload_class = public+writer-safe 확인.

통과 → 해당 provider **matrix `user_selectable=true`**, status `experimental → beta`(smoke 통과). stable은 statistical(N≥20)+사람검토 후 후속.
실패(하나라도 위반) → **experimental + user_selectable=false 유지**, 사유 기록. 누출 시 status=disabled.

**`can_generate_real_output`은 수동 세팅하지 않음** — `adapter_mode==="live" && user_selectable===true`에서 **파생**. matrix에 두 필드를 함께 저장하면 **invariant 테스트로 강제**(모든 엔트리: `can_generate_real_output === (adapter_mode==="live" && user_selectable)`). 승격 시 `user_selectable`만 바꾸고 파생값은 함께 갱신(불일치 금지).

## 6. 승격 적용 방식 (누가/어떻게)

- 에이전트는 CLI·기록·승격 코드 경로를 구현하되, **실제 user_selectable=true 플립은 canary 통과 결과가 확인된 provider에만** 적용.
- 흐름: (1) 에이전트가 CLI/도구 구현·커밋 → (2) 소유주가 키로 `canary:provider claude` 실행 → 결과 공유 → (3) 통과면 에이전트가 matrix 1줄 승격 + test report + decision log 커밋. Gemini 동일 반복.
- 즉, **이번 제안 승인 = 도구 구현 + (결과 통과 시) 승격까지** 권한. 통과 안 하면 승격 안 함.

## 7. 실패 정책 (3C-2 유지)

- 조용한 provider 대체 금지(`provider_unavailable` 409).
- canary 중 timeout/429/schema_invalid → 그 케이스 fallback 카운트 → fallback_rate>0이면 **불합격**(승격 안 함).

## 8. 보안 체크

- [ ] 키는 서버 env만: **`ANTHROPIC_API_KEY` / `GEMINI_API_KEY`**. CLI 로그·report·decision log에 **키·원문 프롬프트·원문 payload 미기록**(boolean/hash/redacted만).
- [ ] payload_class=public+writer-safe 검증(private/secret 미전송) 케이스별, **원문 미저장**.
- [ ] gated-live canary는 **`ALLOW_GATED_LIVE_CANARY=1`**(별도 dev 플래그)로만. prod 미설정.
- [ ] caps 가드(≤10/≤20/≤$5) 강제, 초과 중단.
- [ ] 승격은 통과 provider만. 미통과 user_selectable=false 유지.

## 9. 테스트 계획

- [ ] typecheck/build/lint/doc-lang.
- [ ] unit: CLI 집계·caps·payload 검증 로직을 **mock adapter**로 테스트(실 네트워크 없이). 키 없음 시 안내·중단 테스트.
- [ ] **invariant 테스트**: 모든 matrix 엔트리 `can_generate_real_output === (adapter_mode==="live" && user_selectable)`.
- [ ] report/log에 **원문 payload 미저장**(boolean/hash만) 테스트.
- [ ] 실 API smoke canary = **소유주 수동 실행**(키), 결과를 `docs/test_reports/2026-MM-DD/`에 기록.
- [ ] secret scan(staged diff, report/log에 키·`sk-`·원문 prompt/payload 부재).

## 10. 산출물 기록

- **test report**: `docs/test_reports/YYYY-MM-DD/test_provider_canary_<provider>_vNNN.md` (CanaryReport + latency + payload_class 확인 + pass/fail).
- **decision log**: 승격/미승격 결정 + 사유.

## 11. rollback

- 승격 후 문제 → matrix `user_selectable=false`(또는 status="disabled") 1줄 → 즉시 회색/거부.
- CLI/도구는 독립 → 영향 없음. 데이터/스키마 변경 없음.

## 12. 구현 순서

1. `server/canary/runCli.ts` + npm `canary:provider`(gated-live 허용 분기, 키 확인, caps, payload 검증, latency 분리, report 출력).
2. unit 테스트(mock adapter; caps/payload/키없음).
3. typecheck/build/lint/test → 커밋(도구).
4. (소유주) `canary:provider claude` 실행 → 결과 공유.
5. 통과 시: matrix Claude `user_selectable=true`+`can_generate_real_output=true`+status `beta`, test report + decision log → 커밋.
6. Gemini 동일(4~5 반복).
7. 미통과 provider는 유지 + 사유 기록.

## 13. 참고

- 평가/표본 근거(기존): MT-Bench/Arena 2306.05685, HELM 2211.09110. smoke=100%(소표본) 기준은 3C-2 §6와 동일.
- 모델/가격: 3C-2 verified(Claude haiku-4-5/sonnet-4-6, Gemini 2.5-flash-lite/3.5-flash, snapshot 2026-06-09).

## 14. 승인 체크리스트

- [ ] 실 API smoke canary는 **소유주가 키로 수동 실행**, 에이전트는 도구·기록·승격만.
- [ ] 키 서버 env만(`ANTHROPIC_API_KEY`/`GEMINI_API_KEY`), report/log에 키·원문 프롬프트·**원문 payload 미기록**(boolean/hash/redacted만).
- [ ] gated-live canary는 **`ALLOW_GATED_LIVE_CANARY=1`** 전용 플래그(`ALLOW_MOCK_PROVIDERS`와 별개).
- [ ] `can_generate_real_output`은 **파생값**(`live && user_selectable`), invariant 테스트로 강제.
- [ ] caps: provider ≤10, 전체 ≤20, 총 ≤$5, 초과 중단.
- [ ] 통과 기준: leak=0 + schema 100% + fallback 0 + payload_class 확인.
- [ ] first/subsequent latency 기록.
- [ ] 통과 provider만 user_selectable=true(+beta), 실패는 experimental/user_selectable=false 유지.
- [ ] 결과 test report + decision log 기록.
- [ ] 순서 Claude → Gemini. DeepSeek live 제외.
- [ ] 추적 주석·헌법 §9 워크플로·아카이브.

## 15. 승인 요청

`APPROVE: proceed` / 수정 `REVISE: ...` / 거절 `REJECT: ...`

> 승인 시 먼저 canary CLI·테스트를 구현·커밋합니다. 그 후 Claude 키로 실행해 주시면(또는 결과 공유) 통과 시 승격하겠습니다. 키는 `.env`(서버)에만 넣어 주세요.
