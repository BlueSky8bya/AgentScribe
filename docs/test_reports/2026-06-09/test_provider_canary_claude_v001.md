<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2b_provider_canary_promotion_v001.md] real-API smoke canary result -->
# Test Report: Provider Canary — Claude (smoke)

- 날짜: 2026-06-09 / 실행: `ALLOW_GATED_LIVE_CANARY=1 npm run canary:provider -- claude` (.env 키)
- canary_version: 2026-06-09.1 / model: claude-sonnet-4-6 / adapter_mode: live

## 결과 (redacted — 키·원문·payload 미기록)

| 지표 | 값 |
|---|---|
| calls | 5 (cap 10 이내) |
| cost_usd | 0.125516 (cap $5 이내) |
| schema_success_rate | 1.0 |
| fallback_rate | **0.2** (5콜 중 1콜 fallback) |
| private_secret_leak_count | 0 |
| cap_compliance_rate | 1.0 |
| payload_class_ok | true (public+writer-safe만) |
| first_request_latency_ms | 9538 |
| subsequent_p50_ms | 66575 |
| subsequent_p95_ms | 68511 |
| aborted | false |

## 판정: **FAIL**

- 사유: `fallback_rate=0.2`(기준 0 필요). leak/schema/payload는 통과.
- 1콜이 1회 재시도 후에도 실패 → 결정론 fallback(에이전트가 LlmDraft 파싱/호출 실패를 안전 처리). 정확한 원인(schema_invalid vs timeout)은 후속 조사 대상.
- subsequent latency p50 66초로 매우 느림 — 후속에서 max_tokens/effort/timeout 튜닝 검토 필요.

## 조치

- **승격하지 않음.** Claude는 `experimental` + `user_selectable=false` 유지(matrix 무변경).
- 후속: fallback 원인 조사(구조화 출력 형식·재시도·timeout) → 별도 제안 후 재측정.
