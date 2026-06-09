<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2_live_provider_rollout_v001.md] Phase 3C-2 (approved + implemented, partial: Claude+Gemini; DeepSeek deferred) -->
# Decision Log: Phase 3C-2 — Live Provider Rollout (Claude + Gemini; DeepSeek deferred)

- 날짜: 2026-06-09 / 상태: APPROVED + IMPLEMENTED (Claude+Gemini live adapters, gated)
- 제안서: `docs/proposals/archive/2026-06-09/proposal_phase3c2_live_provider_rollout_v001.md`
- 승인: `APPROVE: proceed` / 순서 Claude → Gemini → DeepSeek(마지막, 재확인 후)

## 구현 결정 (이번 라운드 = Claude + Gemini)

- **live ≠ user-selectable 분리**: `CapabilityEntry.user_selectable` 추가. Claude/Gemini = `adapter_mode:"live"` + `user_selectable:false` + `can_generate_real_output:false`(experimental). canary 통과 시 수동 승격(코드/플래그 1줄). openai만 user_selectable/stable.
- **canRunRealGeneration**: 키 + (can_generate_real_output OR dev override `ALLOW_MOCK_PROVIDERS=1`). gated-live(Claude/Gemini)는 일반 사용 차단, dev에서만 실행. `provider_unavailable`(409) 유지(조용한 대체 금지).
- **live 어댑터**: `claudeAdapter`(`@anthropic-ai/sdk@^0.102`, `messages.create`, system에 JSON-only 지시 + 코드펜스 strip, usage input/output/cache_read), `geminiAdapter`(`@google/genai@^2.8`, `models.generateContent` + `responseMimeType:"application/json"` + systemInstruction, usage promptTokenCount/candidatesTokenCount). registry: openai/claude/gemini live, deepseek mock.
- **확정 모델/가격(공식 확인 2026-06-09)**:
  - Claude(claude-api 레퍼런스): cheap=`claude-haiku-4-5`($1/$5), quality=`claude-sonnet-4-6`($3/$15).
  - Gemini(공식 pricing): cheap=`gemini-2.5-flash-lite`($0.10/$0.40), quality=`gemini-3.5-flash`($1.50/$9). preview 모델 회피.
  - providerPricing에 verified 추가(source_url + price_snapshot_date 2026-06-09).
- **첫 요청 지연**: `LlmLogEntry.is_first_request` 추가 + `isFirstRequest()`. Claude structured outputs schema compile/cache 워밍업 가시화.
- **canary 상한**: `CanaryCaps`/`DEFAULT_CANARY_CAPS`(≤30 calls, ≤$5), `withinCaps`, `runCanaryBounded`(상한 초과 전 중단, aborted 반환).
- **status 기준**: smoke(N=5)=100%→beta, N≥20·95%·≤5%·사람검토→stable. mock 자동승격 금지. (이번엔 어댑터만 연결, 승격은 canary 실측 후 후속.)

## DeepSeek (이번 미진행 — 마지막 단계)

- placeholder/mock 유지(`deepseek-pending-cheap/quality`). 후보 `deepseek-v4-flash`/`deepseek-v4-pro`는 **구현 직전 재확인 후** 적용.
- `deepseek-chat`/`deepseek-reasoner` 사용 금지(deprecated). 데이터 전송/보관·검열·구조화 안정성 확인 선행. experimental 고정.

## 데이터 정책 / payload_class (제안 §12.1)

- 외부 전송 payload = **public_seed + writer_safe_only**(private/secret firewall 미포함). provider 무관.
- 학습 사용: OpenAI/Anthropic API 입력 기본 미학습; Gemini 유료 "Data usage: No"(제품 개선 미사용). 출처: 각 공식 pricing/terms. 미학습 정책이 아니면 해당 provider 보류.

## 검증

- `tsc -p server/tsconfig.json`(Claude/Gemini SDK 바인딩 타입 검증) 통과.
- `npm run build`(client) 통과.
- `npm run lint`(eslint + doc-lang) 통과.
- `npm test` **63/63** 통과(신규: liveAdapters[claude/gemini mock client], userSelectableGating[gated + dev override + canary caps], priceStatus verified gemini/claude). 실 API canary는 키 필요 → 수동(미실행).

## 보안 확인

- 3 key(ANTHROPIC/GEMINI/DEEPSEEK) 서버 env만. 어댑터에서만 읽음. `/api/providers`·응답·로그에 미노출. 테스트 `sk-` 부재 검증.
- gated-live: canary 통과 전 일반 UI 선택 불가(user_selectable=false), 조용한 대체 금지.
- 비용: placeholder(deepseek) 미계산. canary 상한 가드.

## 후속

- **provider canary 승격**: Claude/Gemini 실 API smoke canary(키) → 기준 통과 시 user_selectable=true 수동 승격(별도 단계).
- **DeepSeek live**: 공식 모델명/가격/데이터 정책 재확인 후 별도 진행.
- Phase 4 = Writer 회차 생성.
- rollback: 문제 provider `user_selectable=false`/`status="disabled"` 1줄, 또는 키 제거, 또는 커밋 revert(데이터 무변경).
