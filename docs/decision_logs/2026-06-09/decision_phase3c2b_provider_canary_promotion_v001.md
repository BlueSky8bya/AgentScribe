<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2b_provider_canary_promotion_v001.md] Phase 3C-2b (approved; tooling implemented, real-API run pending owner) -->
# Decision Log: Phase 3C-2b — Provider Canary 승격 (tooling)

- 날짜: 2026-06-09 / 상태: APPROVED + TOOLING IMPLEMENTED (실 API canary + 승격은 소유주 실행 대기)
- 제안서: `docs/proposals/archive/2026-06-09/proposal_phase3c2b_provider_canary_promotion_v001.md`
- 승인: `APPROVE: proceed` / 순서 Claude → Gemini

## 구현 결정 (도구)

- **canary CLI**: `server/canary/runCli.ts` + npm `canary:provider -- <claude|gemini>`. 핵심 로직 `runProviderCanary(provider, deps)` 분리(테스트는 expandCost·latencies 주입 → 무네트워크).
- **gated-live 전용 플래그**: `ALLOW_GATED_LIVE_CANARY=1`(= "gated live canary 실행 허용", `ALLOW_MOCK_PROVIDERS`와 별개). 미설정/키없음 시 즉시 중단·안내. 키는 CLI 인자 금지, 서버 env(`ANTHROPIC_API_KEY`/`GEMINI_API_KEY`)만.
- **caps**: provider ≤10 calls(smoke 5), ≤$5. `runCanaryBounded`가 초과 전 중단(aborted).
- **승격 기준(smoke)**: `evaluatePromotion` = `leak=0 && schema_success_rate=1.0 && fallback_rate=0 && payload_class_ok`. 통과→`user_selectable=true`/status `beta`. 실패→experimental/user_selectable=false 유지.
- **can_generate_real_output = 파생 invariant**: `expectedCanGenerate(entry)=adapter_mode==="live" && user_selectable`. 수동 세팅 금지. **invariant 테스트로 강제**(모든 엔트리 일치).
- **payload_class**: `payloadClassOk(input)` 구조 검사(private_backstory/secrets 부재). 산출물엔 boolean만, **원문 payload 미저장**.
- **latency 분리**: `splitLatency` → `first_request_latency_ms` + subsequent p50/p95(Claude schema-compile 워밍업 가시화). llmLog `is_first_request` 사용.
- **CLI 출력 redacted**: 숫자/boolean/model id/latency만. 키·원문 prompt·원문 payload 미출력.

## 승격 적용 방식

- 에이전트는 도구·기록·승격 코드 경로만 구현. **실제 user_selectable=true 플립은 canary PASS 확인된 provider에만** 적용.
- 흐름: (도구 커밋) → 소유주가 키로 `ALLOW_GATED_LIVE_CANARY=1 npm run canary:provider -- claude` 실행 → 결과 공유 → PASS면 matrix Claude `user_selectable=true`+status `beta` + test report + decision log 커밋. Gemini 동일.
- 현재 matrix: Claude/Gemini 여전히 `user_selectable=false`(승격 미적용). 일반 UI 회색 유지.

## 검증

- `tsc -p server/tsconfig.json` + `npm run build` + `npm run lint`(eslint+doc-lang) 통과.
- `npm test` **70/70** 통과(신규: matrix invariant, payloadClassOk, splitLatency, runProviderCanary PASS/FAIL/redacted — 전부 무네트워크 mock).
- 실 API smoke canary = **소유주 수동 실행 대기**(키 필요). 결과는 `docs/test_reports/2026-06-DD/test_provider_canary_<provider>_v001.md`에 기록 예정.

## 보안 확인

- 키 서버 env만(`ANTHROPIC_API_KEY`/`GEMINI_API_KEY`). CLI 인자·로그·report에 미노출. 테스트 `sk-` 부재.
- 원문 payload/prompt 미저장(boolean/숫자만). secret scan clean.
- gated-live는 전용 플래그로만. 조용한 대체 금지(3C-2) 유지.

## 후속

- 소유주 실 canary 실행 → PASS provider 승격(Claude → Gemini).
- stable 승격(N≥20 statistical + 사람검토)은 후속.
- DeepSeek live는 별도 제안(공식 모델명/데이터 정책 재확인 후).
- rollback: `user_selectable=false`/`status="disabled"` 1줄, 또는 커밋 revert(데이터 무변경).
