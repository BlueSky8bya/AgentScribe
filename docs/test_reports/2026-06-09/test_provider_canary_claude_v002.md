<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2c_canary_fallback_fix_v001.md] re-measure after hardening -->
# Test Report: Provider Canary — Claude (smoke, v002 after hardening)

- 날짜: 2026-06-09 / model: claude (haiku-4-5 cheap + sonnet-4-6 quality, 시드 scale별 혼합)
- 강건화 적용: max_tokens 4096→8192, 중앙 JSON 추출(extractJsonObject), withTimeout.

## 진단 (canary:diagnose claude)
- counts: ok=5 / 나머지 0. top_failures: 없음. zod_paths: 없음.
- 결론: 3C-2b의 fallback 원인 = **출력 truncation → invalid JSON**. max_tokens 상향 + 추출로 해소.

## 재측정 (canary:provider claude) — redacted

| 지표 | 값 |
|---|---|
| calls | 5 (≤10) |
| cost_usd | 0.167266 (≤$5) |
| schema_success_rate | 1.0 |
| fallback_rate | **0** |
| private_secret_leak_count | 0 |
| cap_compliance_rate | 1.0 |
| payload_class_ok | true |
| first_request_latency_ms | 10593 |
| subsequent_p50_ms | 48061 |
| subsequent_p95_ms | 61114 |
| verdict | **PASS** |

## 조치: 승격

- Claude **user_selectable=true** + can_generate_real_output=true(파생) + status `experimental → beta`. (haiku/sonnet 양 tier 통과.)
- 참고: subsequent latency p50 ~48s(느림). 기능엔 영향 없으나 후속에서 latency 개선 검토 가능(별도).
