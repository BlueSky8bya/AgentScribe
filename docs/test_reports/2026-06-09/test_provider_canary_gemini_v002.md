<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2c_canary_fallback_fix_v001.md] re-measure after hardening; §9.1 exit condition -->
# Test Report: Provider Canary — Gemini (diagnosis, v002 after hardening)

- 날짜: 2026-06-09 / model: gemini-3.5-flash
- 강건화 적용: 중앙 JSON 추출, withTimeout (공통).

## 진단 (canary:diagnose gemini) — redacted
- counts: ok=3 / **api_error=2** / json_parse=0 / zod_invalid=0 / timeout=0 / rate_limit=0.
- top_failures: `api_error × 2`.
- representative_zod_paths: 없음(스키마 실패 아님).
- latency: first 2712ms / subsequent p50 35211ms / p95 48833ms.

## 판정: **FAIL (승격 보류)** — §9.1 종료 조건 적용

- 승격 보류 사유(top-N): **`api_error`(2/5)**. 대표 zod path: 없음(JSON/스키마 문제 아님 → `responseSchema`로 해결 불가).
- `api_error`는 generateContent 호출 자체 예외(안전 필터 차단/일시 오류 추정). 이 제안 범위(구조화 출력 강건화)로 미해결.
- **추가 재시도/조사는 별도 제안서로 분리**(이 제안에서 무한 반복 금지). 후보: Gemini 안전설정·재시도/백오프·원인 로깅(원문 미기록).
- Gemini는 `experimental` + `user_selectable=false` 유지(matrix 무변경).

## 종합

- Claude: PASS → 승격(v002). Gemini: api_error로 보류 → 별도 제안.
- 강건화(추출+max_tokens)는 Claude의 truncation/parse 실패를 정확히 해소함. Gemini 실패는 다른 계열(api_error)로 별도 트랙.
