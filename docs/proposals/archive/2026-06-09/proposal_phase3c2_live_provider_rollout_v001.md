# 제안서: Phase 3C-2 — Live Provider Rollout (Gemini/Claude/DeepSeek)

## 한눈에 보는 요약 (초보용)

3C-1에서 4개 화구 자리(어댑터 틀)와 시험장(canary)을 깔았습니다. 지금은 GPT만 실제로 불이 들어옵니다. **3C-2는 나머지 3개(Gemini·Claude·DeepSeek)에 실제 배관을 연결**하고, **시험(canary)으로 안전 확인된 것부터** 사용자에게 정식 개방합니다.

> **비유:** 새 화구에 가스를 연결(실 API) → 주방장이 같은 레시피 5개로 시험 → 불이 고르게 들어오고(스키마 OK), 연기 안 나고(비밀 유출 0), 가격표 확인되면 "정식" 라벨. 시험 전엔 계속 "실험중". 합격 못 하면 다이얼 잠금(disabled).

**중요 안전:** 사용자가 Claude를 골랐는데 GPT가 돌아가는 일은 **절대 없음**(조용한 대체 금지, 3C-1 정책 유지). 실패하면 그 요청만 규칙기반(3A)으로 안전 처리.

**화면 변화:** provider 드롭다운에서 시험 통과한 provider가 회색→활성으로 바뀜. DeepSeek은 주의배너 유지.

---

## 0. 위치

3C-1(틀 + canary, mock) 위. 3C-1의 `ProviderAdapter`/`capabilityMatrix`/`modelRouter`/`/api/providers`/`canary`/`providerPricing`/firewall/costLedger를 **그대로 사용**, mock 어댑터 3개를 **실 어댑터**로 교체 + canary 실측 + status 승격. 인터페이스 변경 없음.

## 1. 목적

- Gemini/Claude/DeepSeek **실 API 연결**(provider별 live adapter).
- canary **실측**으로 안전성/품질 확인 후 **status 단계 승격**.
- 조용한 대체 금지·키 미노출 등 **3C-1 보안 정책 전부 유지**.

### 1.1 "실 API 연결"과 "사용자 UI 활성화"는 별개 (요청 1)
두 개념을 **분리**한다. live adapter가 붙었다고 일반 UI에서 바로 선택 가능해지면 안 됨.

| 플래그 | 의미 | 누가 결정 |
|---|---|---|
| `adapter_mode = live` | 실 API 호출 가능(어댑터 구현 + 키) | 구현 |
| `user_selectable` (신규) | 일반 UI 노출·선택 가능 | **canary 기준 통과(§6) 후에만 true** |
| `can_generate_real_output` | 서버가 실생성 수락(라우터 게이트) | `adapter_mode=live && user_selectable` |

- 3C-2 기본: adapter 연결 직후 `adapter_mode=live` + **`user_selectable=false`**(experimental). canary 통과해야 user_selectable=true(beta/stable).
- `/api/providers`·UI·라우터 모두 `user_selectable`/`can_generate_real_output` 기준으로 회색/활성 판단(같은 의미).

---

## 2. 공식 모델명 + 출처 확인 방식 (요청 1)

**모델명은 이 제안서에 고정하지 않음.** 구현 직전 각 provider 공식 docs로 확인 후 `capabilityMatrix` + `providerPricing`에 `source_url` + `price_snapshot_date`와 함께 기록. 확인 방법:

| Provider | SDK(예정) | 모델 목록 출처 | 가격 출처 | 구조화 출력 출처 |
|---|---|---|---|---|
| Gemini/Google | `@google/genai`(설치됨 여부 구현 시 확인) | https://ai.google.dev/gemini-api/docs/models | https://ai.google.dev/gemini-api/docs/pricing | https://ai.google.dev/gemini-api/docs/structured-output |
| Claude/Anthropic | `@anthropic-ai/sdk` | https://platform.claude.com/docs/en/about-claude/models/overview | (동 overview) | https://platform.claude.com/docs/en/build-with-claude/structured-outputs |
| DeepSeek | OpenAI 호환(`openai` SDK + `baseURL`) | https://api-docs.deepseek.com/ | https://api-docs.deepseek.com/quick_start/pricing-details-usd/ | https://api-docs.deepseek.com/ |

- 각 provider에 대해 **가능하면 Models API/목록으로 런타임 확인**(예: OpenAI 호환 DeepSeek `/models`). 안 되면 docs 수기 확인 + snapshot date 기록.
- 확인 안 된 모델명은 **placeholder 유지**(§8 DeepSeek 특히).
- **DeepSeek 후보(공식 docs 현재값):** cheap=`deepseek-v4-flash`, quality=`deepseek-v4-pro`. **단 구현 직전 재확인 전까지 placeholder 유지**(§8).
- **사용 금지(deprecated 예정):** `deepseek-chat`, `deepseek-reasoner`. 매트릭스/코드에 넣지 않음.

## 3. env key / 키 미노출 (요청 2)

| Provider | env key (서버 only) |
|---|---|
| Gemini | `GEMINI_API_KEY` |
| Claude | `ANTHROPIC_API_KEY` |
| DeepSeek | `DEEPSEEK_API_KEY` |

- 키는 **서버 env만**. 클라이언트 번들·`VITE_`·`/api/providers`·`/api/expand` 응답·로그(llmLog/costLedger)·canary 결과에 **절대 미기록**(3C-1 타입 강제 유지).
- `.env.example`에 칸만(빈값). 실제 `.env` 미커밋.
- 어댑터 생성 시 키 없으면 해당 provider `available=false`(회색). 키 있는데 호출 실패는 §5.

## 4. provider별 live adapter — 포함/제외 (요청 3)

**포함(3C-2):**
- `geminiAdapter`/`claudeAdapter`/`deepseekAdapter` 구현(공통 `ProviderAdapter.generate` → `{rawJson, usage}`).
- 각 provider 구조화/JSON 출력 호출 + **토큰 usage 정규화**(provider마다 필드명 다름 → `usage_token_fields` 매트릭스 참조).
- timeout/retry는 매트릭스 값 사용.
- 3C-1 후처리(LlmDraft zod → 결정론 overlay → 1회 재시도 → 3A fallback) **그대로 재사용**.

**제외(후속):**
- 이미지/음성 등 비텍스트, 스트리밍 UI, provider→provider 자동 폴백, 자동 라우팅, tool-use 고급기능. (텍스트 설계초안 1회 호출만.)

## 5. 실패 정책 (요청 5) — 조용한 대체 절대 금지

| 상황 | 동작 |
|---|---|
| 명시 선택 provider `can_generate_real_output=false`/키없음 | **HTTP 409 `provider_unavailable`**(3C-1 유지). openai로 안 바꿈 |
| timeout | 1회 재시도 → 실패 시 **그 요청만 3A 결정론 fallback**(cost.fallback_used=true, reason="timeout"). provider 교체 안 함 |
| rate_limit(429) | 동일: 1회 재시도(백오프) → 3A fallback, reason="rate_limit" |
| schema_invalid(JSON/zod 실패) | 1회 재시도 → 3A fallback, reason="schema_invalid" |
| 반복 실패 provider | canary/운영 로그로 status 강등(§6), 자동 provider 교체는 안 함 |

핵심: **사용자가 고른 provider가 아닌 다른 provider로 몰래 바꾸지 않음.** 실패는 규칙기반 안전망 + 사용자 고지.

## 6. status 승격/강등 기준 (요청 6)

`capabilityMatrix.status`: `disabled → experimental → beta → stable`. + `adapter_mode: mock → live`.

표본 수에 따라 기준 분리(요청 2): 작은 표본에 95% 같은 비율 기준은 무의미 → **smoke는 100% 통과**, 비율(95%) 기준은 **최소 표본 20 이상**일 때만 적용.

| 전이 | 표본 | 조건 |
|---|---|---|
| mock → live | — | 실 adapter 구현 + 키 존재 + **smoke canary 1회 성공 실행**(호출 동작 확인). **user_selectable=false 유지** |
| experimental → beta | **smoke N=5(또는 10)** | **100% 통과**(schema_success_rate=1.0, fallback_rate=0) + **private_secret_leak_count=0(필수)**. 통과 시 `user_selectable=true` |
| beta → stable | **statistical N≥20** | `private_secret_leak_count=0` + `schema_success_rate ≥ 95%` + `fallback_rate ≤ 5%` + **사람 검토(pairwise) 통과**. 서로 다른 날 실행 권장 |
| 임의 → disabled | — | leak>0 즉시 / 반복 schema 실패 / 비용 폭주 / 운영 판단. `user_selectable=false` |

- 기준 수치는 **AgentScribe 내부 운영 기준(산업표준 아님)**. 매트릭스 status/user_selectable는 코드 1줄(또는 운영 플래그)로 조정.
- **DeepSeek은 데이터 전송/보관·검열·구조화 확인 전까지 experimental 고정**(자동 승격 제외).

## 7. canary 실측 방식 / 호출수 / 비용 상한 (요청 4)

- **smoke canary**: seedBank(3C-1, `CANARY_VERSION`) 고정 시드 **N=5**, 100% 통과 기준(exp→beta).
- **statistical canary**: 반복 실행으로 **표본 N≥20** 누적(beta→stable의 95%/≤5% 기준). 시드 반복(같은 버전) 또는 시드 확장.
- provider별 smoke 1 run = 시드 5개 × **1호출** = 5 calls. pairwise 비교용 추가 1 run 가능 → provider당 최대 **10 calls/회**.
- **호출 상한(하드)**: provider당 1회 ≤ 10 calls, 전체 3 provider ≤ **30 calls/회**. 초과 시 **중단**. statistical(N≥20)도 동일 회당 상한 내에서 **여러 회 누적**(1회에 몰지 않음).
- **비용 상한(하드)**: 1회 canary 총비용 한도 **$5**(provider 합산). costLedger 누적이 한도 도달 시 **즉시 중단**(abort)하고 미완료 보고.
- canary 실행은 **수동/명시 트리거 전용**(자동·CI 매호출 아님). dev에서 키 넣고 실행. 결과는 `canary_version`·provider·model·adapter_mode·status_before/after와 함께 기록(키·원문 미기록).
- 토큰 usage 실측 → 비용은 **verified 가격만**(placeholder면 비용 미산정·"확인 전").
- **첫 요청 지연 분리(요청 4)**: Claude 등은 structured outputs의 schema grammar compile/cache로 **첫 요청이 느릴 수 있음**. canary·llmLog에 `first_request_latency_ms`와 `subsequent_latency_ms`를 **구분 기록**(최소한 첫 요청 지연 가능성을 observability에 표기). latency_p50/p95는 subsequent 기준 우선.

## 8. DeepSeek 모델명 placeholder 유지 (요청 7)

- 공식 docs 현재 후보: cheap=`deepseek-v4-flash`, quality=`deepseek-v4-pro`. **구현 직전 재확인 전까지 `deepseek-pending-*` placeholder 유지**, `adapter_mode=mock`/`experimental` 고정.
- 재확인 후에만 실 모델명 + `price_status=verified` + `source_url`/`price_snapshot_date` 기록 + live 전환.
- **`deepseek-chat` / `deepseek-reasoner`는 deprecated 예정 → 사용 금지**(매트릭스/코드에 미포함).
- 모델명 **하드코딩 지양**. 가능하면 DeepSeek `/models`(OpenAI 호환)로 런타임 확인.
- 데이터/검열/구조화 리스크 검토 전 stable 승격 금지(주의배너 유지).

## 9. 테스트 계획 (요청 8)

- [ ] **typecheck**: `tsc -p server/tsconfig.json` + `tsc -b`(client).
- [ ] **build**: `npm run build`.
- [ ] **lint + doc-lang**: `npm run lint`(eslint + check-doc-lang).
- [ ] **unit**: 각 live adapter를 **mock client 주입**으로 테스트(실 네트워크 호출 없이 usage 정규화·JSON 파싱·실패→fallback 검증).
- [ ] **canary**: mock client로 하네스 회귀(leak=0/cap/aggregate) + 비용·호출 상한 가드 테스트. **실 API canary는 수동 1회**(키 필요, 결과 decision log 첨부).
- [ ] **secret scan**: staged diff에 `sk-`/키 패턴·실 `.env` 부재. `/api/providers`·로그·canary 결과에 키 문자열 없음 테스트.
- [ ] 추적 주석 + agent-facing English(doc-lang) + UTF-8. docs(architecture/schemas/state) 갱신.

## 10. rollback 계획 (요청 9)

- **즉시(코드무변경)**: 문제 provider `capabilityMatrix.status="disabled"` + `can_generate_real_output=false` 1줄 → UI 회색·라우터 거부. 또는 해당 `.env` 키 제거 → `available=false`.
- **부분**: provider별 adapter는 독립 → 한 provider만 mock으로 되돌림(registry 분기).
- **전체**: 3C-2 커밋 revert → 3C-1(mock) 상태 복귀. 데이터/스키마 변경 없어 마이그레이션 불필요.
- 비용 폭주 시: canary/요청 차단(status disabled) + 키 회수.
- rollback 후 build/lint/test 재확인 + decision log 기록.

## 11. 예상 부작용

- 신규 의존성: `@google/genai`(미설치 시), `@anthropic-ai/sdk`. DeepSeek=openai 재사용(무추가).
- 실 API 비용·지연 발생(canary는 상한·수동). provider별 구조화/usage 차이 → 어댑터 정규화.
- DeepSeek 데이터/검열 리스크 → experimental 고정 + 배너 + private 미전송.

## 12. 보안 체크 (필수)

- [ ] 3 key 서버 env만. 클라이언트·`VITE_`·`/api/providers`·응답·로그·canary 결과 미노출.
- [ ] provider_unavailable 유지(조용한 대체 금지). 모델명 allowlist(클라 임의지정 차단).
- [ ] private/secret firewall 유지(provider 무관). canary leak=0 필수.
- [ ] costLedger/llmLog/canary에 key·원문 프롬프트 미기록.
- [ ] canary 비용·호출 상한 가드(초과 중단).
- [ ] DeepSeek experimental 고정(확인 전).

### 12.1 provider 데이터 보존/학습/로깅 정책 (요청 5)
- provider별 **데이터 보존·모델 학습 사용 여부·로깅 정책**을 공식 docs로 확인하고 `docs`에 출처+확인일과 함께 기록(예: 학습 사용 opt-out 가능 여부, 보존 기간).
- private/secret firewall이 있어도 **외부로 나가는 payload 등급을 명시 기록**: `payload_class = public_seed + writer_safe_only`(private/secret 미포함). 어떤 등급이 어느 provider로 가는지 표로 관리.
- provider가 학습에 사용/장기 보존하는 정책이면 status·배너에 반영(필요 시 해당 provider 보류).

## 13. 구현 순서

1. 모델명/가격/구조화 출력 공식 docs 확인 → `capabilityMatrix`·`providerPricing` 갱신(verified, snapshot). DeepSeek은 확인되면만.
2. `@google/genai`(필요시)·`@anthropic-ai/sdk` 설치.
3. `geminiAdapter`/`claudeAdapter`/`deepseekAdapter`(usage 정규화) + registry 분기 live 전환.
4. live adapter unit 테스트(mock client 주입).
5. canary 비용·호출 상한 가드 + 실측 트리거(수동).
6. 실 canary 1회 실행(키) → status 승격(기준 충족분만) → decision log.
7. UI: 활성 provider 반영(자동, /api/providers 기반). DeepSeek 배너 유지.
8. typecheck/build/lint/test/secret scan → 헌법 §9 커밋·푸시.

## 14. 참고 문헌 (공식)

- Gemini: models https://ai.google.dev/gemini-api/docs/models · pricing https://ai.google.dev/gemini-api/docs/pricing · structured https://ai.google.dev/gemini-api/docs/structured-output
- Claude: https://platform.claude.com/docs/en/about-claude/models/overview · structured https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- DeepSeek: https://api-docs.deepseek.com/ · pricing https://api-docs.deepseek.com/quick_start/pricing-details-usd/
- 평가/라우팅 근거(3C-1과 동일): FrugalGPT 2305.05176, RouteLLM 2406.18665, MT-Bench/Arena 2306.05685, HELM 2211.09110.

## 15. 승인 체크리스트

- [ ] **`adapter_mode=live`와 `user_selectable`/`can_generate_real_output`를 분리.** live 붙어도 canary 통과 전엔 UI 선택 불가(user_selectable=false).
- [ ] 모델명/가격/구조화 출력을 **구현 직전 공식 docs로 확인** 후 매트릭스/가격표에 source_url+snapshot 기록.
- [ ] 3 key 서버 env만, 미노출, `/api/providers`는 available+status만.
- [ ] live adapter 범위 = 텍스트 설계초안 1회 호출 + usage 정규화. 비텍스트/스트리밍/자동폴백 제외.
- [ ] canary 실측: provider당 ≤10 calls, 전체 ≤30 calls, 총비용 **≤$5**, 초과 중단. 수동 트리거.
- [ ] **smoke(N=5/10)=100% 통과로 exp→beta**, **95%/≤5% 비율 기준은 N≥20**(statistical)에서만 적용.
- [ ] **첫 요청 지연**(Claude schema compile/cache 등): `first_request_latency_ms` vs `subsequent_latency_ms` 구분 기록(또는 최소 observability에 표기).
- [ ] 실패(unavailable/timeout/rate_limit/schema_invalid) 시 **조용한 provider 대체 금지**, 그 요청만 3A fallback + 사유 기록.
- [ ] status 승격 기준(leak=0 필수, smoke 100%→beta, N≥20·95%·≤5%·사람검토→stable) 적용. mock 자동 stable 금지.
- [ ] **DeepSeek 모델명 공식 확인 전 placeholder 유지**(후보 v4-flash/v4-pro), `deepseek-chat`/`deepseek-reasoner` 사용 금지, experimental 고정.
- [ ] **provider 데이터 보존/학습/로깅 정책 확인** + 외부 전송 `payload_class`(public/writer-safe만) 기록.
- [ ] 테스트: typecheck/build/lint/doc-lang/unit/canary/secret scan.
- [ ] rollback: status=disabled 1줄 / 키 제거 / 커밋 revert(데이터 무변경).
- [ ] 추적 주석·헌법 §9 워크플로·아카이브.

## 16. 승인 요청

`APPROVE: proceed` / 수정 `REVISE: ...` / 거절 `REJECT: ...`

> 실 API canary는 키가 필요합니다. 승인 시, 어느 provider부터 연결할지(예: Claude→Gemini→DeepSeek 순) 지정해 주시면 그 순서로 진행합니다. DeepSeek은 공식 모델명 확인 후 마지막.
