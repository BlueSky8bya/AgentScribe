# 제안서: Phase 3C-2c — Canary Fallback 원인 조사 + 구조화 출력 강건화

## 한눈에 보는 요약 (초보용)

3C-2b canary에서 Claude·Gemini가 **fallback**(규칙기반 안전망으로 빠짐) 때문에 불합격했습니다. 보안·비용은 정상이었고, "AI 답을 우리 형식(JSON)으로 못 읽은 경우"가 많았던 걸로 보입니다. **이번엔 (1) 왜 빠졌는지 종류별로 집계하고, (2) 그 원인을 고친 뒤, (3) 다시 시험해서 통과한 provider만 정식 개방합니다.**

> **비유:** 새 화구가 자꾸 꺼진 이유를 "가스 약함/점화 실패/타이머 만료" 식으로 분류표를 만들어 확인 → 원인별로 고침 → 다시 켜봐서 안정되면 정식. **기록엔 손님 주문서 원문(프롬프트)·열쇠(키)는 안 남기고, "어떤 종류 실패가 몇 번"만** 남깁니다.

**안전 유지:** raw prompt·키·원문 payload는 기록 안 함. 기준도 그대로(leak=0, schema=100%, fallback=0).

---

## 0. 위치

3C-2b(canary 도구 + 실측, 둘 다 FAIL) 위. matrix/adapter/canary/expander 재사용. 신규 = **실패 분류(진단) 도구** + **provider별 구조화 출력 강건화 수정** + **재측정**. 순서 Claude → Gemini. DeepSeek 제외.

## 1. 목적

- canary fallback **원인을 종류별로 집계**(provider/seed별).
- 원인 수정(Claude/Gemini 구조화 출력·파서·timeout).
- 재측정 후 **통과 provider만 user_selectable=true 승격**.

## 2. 범위

| 만든다 | 안 만든다 |
|---|---|
| 실패 분류기 `classifyDraftFailure`(json_parse/zod_invalid/empty/timeout/rate_limit/api_error) | raw prompt/output/payload 저장 |
| 진단 canary(provider/seed별 failure_type 집계, redacted) | 자동 라우팅/폴백 |
| Claude 강건화(파서 + max_tokens + 필요 시 tool/JSON schema 강제) | DeepSeek live |
| Gemini 강건화(responseSchema 적용) | stable 승격(N≥20, 후속) |
| 어댑터 timeout/abort + latency 점검 | UI 재설계 |
| 재측정 + 통과분 승격 + test report v002 | — |

## 3. 진단 방식 (raw 미기록)

- `classifyDraftFailure(rawJson)` → `{ type, zod_paths? }`:
  - `ok` / `json_parse`(JSON.parse 실패) / `zod_invalid`(LlmDraft.parse 실패 — **실패 path는 스키마 키만**, 예 `characters.0.character_id`·`relationships.1.from`; 사용자 데이터 아님) / `empty`(빈/누락) / `timeout` / `rate_limit` / `api_error`.
  - zod_invalid 세부: missing field / invalid enum / wrong type 등 issue.code 집계.
- **진단 canary**: provider/seed별로 adapter.generate 호출 → classify → **failure_type 카운트만 집계**. raw prompt/output/payload·키 **미저장**(필요 시 길이/hash만).
- 산출물: `failure_type × fixture_id × provider` 표 + latency(first/subsequent) + timeout 발생 여부.

## 4. 실패 taxonomy (집계 항목)

```text
provider, fixture_id, failure_type(ok|json_parse|zod_invalid|empty|timeout|rate_limit|api_error),
zod_issue_codes[](예: invalid_type, invalid_enum_value, too_small),
zod_paths[](스키마 키 경로만),
first_request_latency_ms, subsequent_latency_ms, timed_out(bool)
```
- 원문·키·payload 없음. 숫자/enum/스키마경로만.

## 5. Claude 강건화 (조사 후 택1+)

- **가설**: max_tokens=4096 + sonnet-4-6 느림(p50 66s) → 출력 truncate → invalid JSON → fallback. 또는 prose 혼입.
- 후보:
  - 출력 파서 강화(코드펜스/선행 prose 제거 후 **첫 `{`~마지막 `}` 추출** 재파싱).
  - max_tokens 상향(설계초안엔 충분히). 응답 길이 축소 지시.
  - **structured output 강제**: Anthropic tool(input_schema=LlmDraft) 또는 공식 structured outputs로 스키마 강제(구현 직전 claude-api docs 재확인).
- 진단 결과 보고 후 최소 침습안부터 적용.

## 6. Gemini 강건화

- 현재 `responseMimeType:"application/json"`만 → **`responseSchema`(LlmDraft 대응 스키마) 적용**으로 구조 강제(구현 직전 Gemini structured-output docs 재확인).
- 파서 강화 동일 적용.

## 7. timeout / latency

- 어댑터에 **명시 timeout/abort**(matrix `timeout_ms`) 적용 — 현재 SDK 호출에 미적용. 초과 시 failure_type=timeout으로 분류(조용한 대체 아님, fallback로 카운트).
- subsequent latency p50/p95 재점검(Claude 66s 원인 = truncation/대형 출력인지 확인).

## 8. 기준 (유지)

- `private_secret_leak_count = 0`, `schema_success_rate = 100%`, `fallback_rate = 0`, payload_class=public+writer-safe.
- smoke(N=5) 100% 통과 → user_selectable=true/beta. 미달 → experimental 유지.

## 9. 재측정 + 승격 흐름

1. 진단 canary 실행(소유주 키, 상한 ≤10/≤$5 유지) → failure_type 표 공유.
2. 원인별 수정 적용(Claude→Gemini).
3. smoke 재측정(Claude→Gemini).
4. 통과 provider만 matrix `user_selectable=true`+status `beta` 승격 + test report v002 + decision log.
5. 미통과는 experimental 유지 + 사유.

### 9.1 강건화 후에도 실패 시 (종료 조건)
- **이 제안의 수정 적용 후 재측정에서도 실패하면, provider별 "승격 보류 사유"를 decision log에 `failure_type top N`(예: top 3) + **대표 zod path**(스키마 키 경로만, raw 미포함)까지만 남기고 종료.**
- **추가 재시도/추가 수정은 이 제안 범위 밖 → 별도 제안서로 넘김.** 같은 제안에서 무한 반복 금지(scope creep 차단).
- 미통과 provider는 experimental/user_selectable=false 유지.

## 10. 보안 체크

- [ ] 진단/report/log에 raw prompt·키·원문 payload **미기록**(failure_type·enum·스키마경로·숫자만).
- [ ] 키 서버 env만(`ANTHROPIC_API_KEY`/`GEMINI_API_KEY`), gated-live는 `ALLOW_GATED_LIVE_CANARY=1`.
- [ ] payload_class=public+writer-safe 유지. caps(≤10/≤$5) 유지.
- [ ] can_generate_real_output 파생 invariant 유지.

## 11. 테스트 계획

- [ ] typecheck/build/lint/doc-lang.
- [ ] unit(무네트워크, mock): `classifyDraftFailure`가 json_parse/zod_invalid(enum/missing)/empty/ok 정확 분류. 진단 집계 로직. timeout 경로(가짜 지연). 파서 강화(펜스/선행 prose → 추출 성공).
- [ ] Gemini responseSchema·Claude 강건화의 단위 검증(mock client로 형식 처리).
- [ ] 실 API 진단+재측정 = 소유주 수동 실행, 결과 test report 기록.
- [ ] secret scan(키·raw 부재).

## 12. 산출물

- 진단 report: `docs/test_reports/2026-MM-DD/test_canary_diagnosis_v001.md`(failure_type 표).
- 재측정 test report v002 + 승격/미승격 decision log.

## 13. rollback

- 수정이 회귀 유발 → 해당 커밋 revert(어댑터/파서 독립, 데이터 무변경).
- 승격 후 문제 → `user_selectable=false`/`status=disabled` 1줄.

## 14. 구현 순서

1. `classifyDraftFailure` + 진단 집계(server/canary/diagnose.ts) + unit.
2. 어댑터 timeout/abort + 파서 강화(공통 JSON 추출 유틸).
3. Gemini responseSchema 적용.
4. Claude 강건화(파서 + max_tokens, 필요 시 tool/structured output — docs 재확인).
5. typecheck/build/lint/test → 커밋(도구+수정).
6. (소유주) 진단 canary 실행 → 표 공유.
7. (소유주) smoke 재측정 Claude→Gemini → 통과분 승격 + report v002 + decision log → 커밋.

## 15. 참고

- Anthropic structured outputs / tool use: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output
- 평가/표본 근거(기존): MT-Bench/Arena 2306.05685, HELM 2211.09110.

## 16. 승인 체크리스트

- [ ] 실패 원인을 **provider/seed별 failure_type으로 집계**(zod path/enum/json_parse 등), raw 미기록.
- [ ] Claude 파서/structured output 강건화, Gemini responseSchema 적용.
- [ ] 어댑터 timeout/abort + subsequent latency 점검.
- [ ] canary 기준 유지(leak=0, schema=100%, fallback=0), caps(≤10/≤$5).
- [ ] 수정 후 Claude → Gemini smoke 재측정, **통과분만 user_selectable=true 승격**.
- [ ] 진단·재측정 결과 test report + decision log 기록.
- [ ] **강건화 후에도 실패 시**: decision log에 `failure_type top N` + 대표 zod path(스키마 키만)만 남기고 종료, **추가 재시도는 별도 제안**으로 넘김(이 제안에서 무한 반복 금지).
- [ ] 키·raw·payload 미노출. 추적 주석·헌법 §9 워크플로·아카이브.

## 17. 승인 요청

`APPROVE: proceed` / 수정 `REVISE: ...` / 거절 `REJECT: ...`

> 승인 시: 진단 도구+강건화 구현·커밋 → 소유주가 키로 진단/재측정 실행(또는 에이전트가 .env로 실행) → 통과 provider 승격. 키는 `.env`(서버)만.
