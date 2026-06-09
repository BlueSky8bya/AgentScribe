<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2b_provider_canary_promotion_v001.md] real-API smoke canary result -->
# Test Report: Provider Canary — Gemini (smoke)

- 날짜: 2026-06-09 / 실행: `ALLOW_GATED_LIVE_CANARY=1 npm run canary:provider -- gemini` (.env 키)
- canary_version: 2026-06-09.1 / model: gemini-3.5-flash / adapter_mode: live

## 결과 (redacted — 키·원문·payload 미기록)

| 지표 | 값 |
|---|---|
| calls | 5 (cap 10 이내) |
| cost_usd | 0.000615 (cap $5 이내) |
| schema_success_rate | 1.0 |
| fallback_rate | **0.6** (5콜 중 3콜 fallback) |
| private_secret_leak_count | 0 |
| cap_compliance_rate | 1.0 |
| payload_class_ok | true (public+writer-safe만) |
| first_request_latency_ms | 4257 |
| subsequent_p50_ms | 4370 |
| subsequent_p95_ms | 36760 |
| aborted | false |

## 판정: **FAIL**

- 사유: `fallback_rate=0.6`(기준 0 필요). leak/payload 통과, 비용 매우 낮음($0.0006).
- 3콜이 재시도 후에도 실패 → 결정론 fallback. 원인(JSON/스키마 형식 등)은 후속 조사 대상.

## 조치

- **승격하지 않음.** Gemini는 `experimental` + `user_selectable=false` 유지(matrix 무변경).
- 후속: 구조화 출력(responseSchema 적용 등)·재시도 강건화 → 별도 제안 후 재측정.

## 종합 (Claude+Gemini)

- 두 provider 모두 **fallback_rate 기준 미달**로 승격 보류. 보안/누출/비용/payload는 전부 정상.
- 공통 원인 = LLM 출력 → `LlmDraft` 검증 실패 추정(structured output 강건화 필요). 도구·게이트·기록은 설계대로 동작(불합격을 정확히 잡아냄).
