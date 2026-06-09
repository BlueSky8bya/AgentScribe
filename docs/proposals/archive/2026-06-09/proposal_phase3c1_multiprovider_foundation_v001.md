# 제안서: Phase 3C — Multi-Provider Foundation + Contract Canary (2단계)

## 한눈에 보는 요약 (초보용)

목표는 같습니다 — 나중에 GPT·Gemini·Claude·DeepSeek를 화면에서 딸깍 골라 쓰기. 하지만 **4개를 한 번에 "정식"으로 열지 않습니다.** 먼저 **틀(어댑터)과 시험장(canary)을 만들고**, 각 provider를 **시험 통과한 것부터 하나씩 정식 개방**합니다.

> **비유:** 식당에 화구 4개 자리를 다 만들되(배관·다이얼=틀), 새 화구는 바로 손님 요리에 쓰지 않고 **주방장이 같은 레시피 10~20개로 시험**해서 합격한 화구만 "정식" 라벨을 붙임. 시험 전엔 "실험용(beta)" 라벨.

**왜 두 단계?** 모델마다 한국어 품질·JSON 안정성·비용·지연·비밀유출 위험이 다릅니다. 검증 없이 다 열면 어떤 모델은 깨진 초안·과금 폭탄·비밀 유출을 낼 수 있습니다. **시험(canary)으로 거른 뒤 개방.**

- **Phase 3C-1 (이번 제안 핵심):** 어댑터 공통 틀 + Capability Matrix + `/api/providers` + allowlist + 키 가용성 + **mock 테스트** + 가격표 확장 + UI 드롭다운 뼈대 + **Contract Canary 하네스**. **실제 외부 API 호출 없음(mock).**
- **Phase 3C-2 (후속 별도 제안):** GPT/Gemini/Claude/DeepSeek 실제 API를 하나씩 연결. canary 통과 전엔 beta/experimental 표시, 통과해야 기본 선택 가능.

**화면 스케치(3C-1 뼈대):**
```text
┌ AI 설정 ───────────────────────────────┐
│ provider ▼ : GPT(stable) · Gemini(beta) · Claude(experimental) · DeepSeek(experimental·주의) │
│ 품질 ▼     : 저비용 / 고품질              │
│ ⓘ experimental = 시험중, DeepSeek=데이터/검열 주의 │
│ ☑ AI로 더 풍부하게 (외부 전송 안내)        │
└────────────────────────────────────────┘
```

---

## 0. 위치

Phase 3B(backend + OpenAI 1개) 위. 3B의 router/expander/pricing/firewall/costLedger를 **provider 다중 틀**로 확장. 인터페이스(`ExpanderAdapter`, `/api/expand`)는 유지.

> 본 제안 = **Phase 3C-1**(틀 + canary, mock). 실제 provider 연결은 **3C-2 별도 제안**.

## 1. 목적

- provider 어댑터 **공통 틀**과 **시험장(Contract Canary)**을 먼저 구축.
- 각 provider를 **검증 통과 후 단계적 개방**(disabled→experimental→beta→stable).
- 자동 라우팅은 **이번 범위 제외**(로그 쌓인 뒤 후속).

## 2. 두 단계 분리

### Phase 3C-1 — Multi-provider adapter foundation (이번 제안)
- `ProviderAdapter` 공통 인터페이스 + **mock 어댑터**(실 API 미호출).
- **Provider Capability Matrix**(§3).
- `GET /api/providers`(가용성·status; **키 미반환**).
- provider/tier **allowlist**(클라이언트 임의 모델 차단).
- key availability check(env 존재 여부만).
- providerPricing **4 provider 확장**(§7.2): 각 항목 `price_status(verified|placeholder)` + `usable_for_cost_estimate`. openai=verified, 나머지=placeholder(실값은 3C-2 공식확인 후 verified 전환).
- UI provider/tier 드롭다운 **skeleton** + status 라벨 + DeepSeek 주의.
- **Contract Canary 하네스**(§4) — mock으로 동작 검증, 실 provider는 3C-2에서 투입.
- mock adapter tests.

### Phase 3C-2 — Live provider rollout (후속 별도 제안)
- GPT/Gemini/Claude/DeepSeek **실 API** 하나씩 연결.
- 각 provider **canary 통과 전 beta/experimental**.
- canary 통과한 provider만 **기본 선택 가능(stable)**.
- 실패율 높은 provider는 회색/"실험용" 표시.

## 3. Provider Capability Matrix (3C-1)

provider/model마다 기록(`server/providers/capabilityMatrix.ts`):
```text
provider_id, model_id, tier(cheap|quality),
adapter_mode(live|mock|disabled),
can_generate_real_output(true|false),
supports_json_mode, supports_json_schema, supports_tool_use,
usage_token_fields, cached_token_supported, reasoning_token_supported,
max_input_tokens, max_output_tokens, timeout_ms, retry_policy,
price_snapshot_date, source_url,
status(disabled|experimental|beta|stable)
```
필드 의미:
- `adapter_mode=mock` → 테스트용, **실제 외부 모델 호출 아님**.
- `can_generate_real_output=false` → **일반 UI에서 선택 불가**(실생성 불가).
- `status=experimental`이어도 **live adapter가 없으면 실제 생성 불가**.

- 라우터·어댑터·UI가 이 매트릭스를 **단일 출처**로 사용(같은 의미). status·adapter_mode·can_generate_real_output가 UI 라벨·선택가능·라우팅을 함께 결정.
- 3C-1 기본값: **openai = live / can_generate_real_output=true / stable**. Gemini·Claude·DeepSeek = **mock / can_generate_real_output=false / experimental**(준비중). 실 연결·status 승격은 3C-2 + canary.

## 4. Provider Contract Canary (3C-1 하네스, 3C-2 실측)

같은 한국어 작품 시드 10~20개를 모든 provider에 투입, provider별 기록(`server/canary/`):
```text
지표:
schema_success_rate, json_parse_failure_rate, retry_rate, fallback_rate,
latency_p50, latency_p95, estimated_cost_usd,
private_secret_leak_count,
character_count_within_cap, relationship_count_within_cap, foreshadow_count_within_cap,
korean_design_usefulness_score, human_review_notes
결과 메타(각 run 기록):
canary_version, fixture_id, provider_id, model_id, adapter_mode, status_before, status_after
```

### 4.1 Canary seed bank (버전 관리)
`tests/fixtures/providerCanary.fixtures.ts`(또는 `server/canary/seedBank.ts`)에 고정 한국어 시드 10~20개 + `canary_version`. 커버:
- 장르 다양성(무협/판타지/SF/로맨스 등).
- 비밀 과거사 포함 케이스.
- 비인간 종족/휴머노이드 케이스.
- 관계가 많은 케이스.
- 복선이 필요한 케이스.
- 단편/장편/시리즈 케이스.
시드 변경 시 `canary_version` 올림. provider별 결과는 항상 `canary_version`과 함께 저장(재현·비교 가능).

**초기 운영 기준 (AgentScribe 내부 기준 — 산업 표준 아님):**
- `private_secret_leak_count = 0` (필수, 위반 시 즉시 disabled).
- `schema_success_rate ≥ 95%` → stable 후보.
- `fallback_rate > 5%` → beta/experimental 유지.
- DeepSeek은 데이터 전송/검열/구조화 안정성 확인 전까지 **experimental 고정**.

> 위 수치는 **절대 산업 표준이 아니라 AgentScribe 초기 운영 기준**. 운영하며 조정.

- 3C-1: 하네스 + 시드 묶음 + 집계 로직 + mock 결과로 자기검증.
- 3C-2: 실 provider로 측정 → status 갱신.

## 5. 품질 평가 = pairwise (bias 회피)

단일 점수 대신 **두 provider 결과를 나란히 비교**:
- 인물 설정이 더 쓸 만한가 / 관계가 더 자연스러운가 / 복선이 과하지 않은가 / 한국어가 자연스러운가 / 사용자가 수정하기 쉬운가.

LLM judge 사용 가능하되 **MT-Bench·Chatbot Arena가 지적한 position bias·verbosity bias 회피**:
- A/B 순서 무작위 섞기(swap).
- 긴 답변 보너스 방지(길이 정규화/길이 무관 지시).
- judge rationale 기록.
- 일부 결과 **사람 검토**(human-in-the-loop).
- 결과는 `canary/pairwise/`에 기록. 자동 결정 아닌 **참고 자료**.

## 6. 자동 라우팅 = 후속 (이번 범위 제외)

FrugalGPT·RouteLLM류 비용/품질 기반 자동 라우팅은 유용하나 **내부 canary + 실제 사용자 선택 로그가 먼저** 필요. 이번 3C:
- 사용자가 **직접 provider/tier 선택**.
- 비용/품질/실패율 **기록**.
- 자동 추천/자동 라우팅은 **후속**(로그 축적 후 별도 제안).

## 7. 키 일괄 저장 + 가용성 (보안)

`.env`(서버, gitignore) 4칸:
```text
OPENAI_API_KEY=  / GEMINI_API_KEY=  / ANTHROPIC_API_KEY=  / DEEPSEEK_API_KEY=
```
- `GET /api/providers` → `[{ id, status, adapter_mode, can_generate_real_output, available, tiers, note? }]`. **available = env 키 존재 여부만**. 키 값·일부·길이 **절대 미반환**.
- UI: available=false / status=disabled / `can_generate_real_output=false` → 회색/비활성("준비중"·"실험 준비"·"키 필요"·"canary 전"). status별 라벨(stable/beta/experimental).
- 키 4개 다 넣을 필요 없음 — 넣은 것만 활성.

### 7.1 mock provider는 일반 사용자에게 실생성용으로 노출 금지
- 3C-1: openai만 live. Gemini/Claude/DeepSeek은 mock → 일반 UI **선택 불가**(can_generate_real_output=false, "준비중" 표시).
- **mock provider 선택은 개발/test mode에서만**(예: `?dev=1` 또는 env 플래그). 일반 화면엔 실생성 가능 provider처럼 보이지 않음.

### 7.2 provider 선택 실패 = 조용한 대체 금지
- provider 미지정 → 기본 **openai**.
- 사용자가 **명시적으로** Gemini/Claude/DeepSeek 선택했는데 키 없음/live adapter 없음 → **조용히 openai로 바꾸지 않고 `provider_unavailable` 반환**. UI는 "이 provider는 아직 준비 중입니다" 쉬운 안내.
- 사용자가 Claude를 눌렀는데 실제로 GPT가 실행되는 일은 **없어야 함**.

### 7.3 placeholder 가격은 비용 계산에 미사용
- providerPricing에 `price_status(verified|placeholder)`, `usable_for_cost_estimate(true|false)`.
- **placeholder 가격은 costLedger 계산에 사용 안 함.** WorkCostPanel은 "가격 확인 전 / 비용 계산 준비중" 표시.
- 실 연결 전 공식 pricing 확인 + `price_snapshot_date` 기록 후 **verified로 전환**해야 비용 계산 사용.

### 7.4 `.env.example` 커밋 가능하게 (3B에서 발견된 버그)
현재 `.gitignore:22 .env.*`가 **`.env.example`도 무시** → 3B 커밋에서 누락됨(확인됨). 수정:
```text
.env
.env.*
!.env.example
```

## 8. 런타임 선택 (3C-1 뼈대, 3C-2 실동작)

- `/api/expand` options에 `provider`,`quality_pref` 추가(firewall **enum 검증**).
- `modelRouter.route({provider, effective_scale, budget_class, quality_pref})` → Capability Matrix allowlist에서 `{provider, model, tier}`. 클라이언트 **모델명 직접 지정 불가**.
- 명시 선택 provider가 `can_generate_real_output=false`/키없음 → **`provider_unavailable` 반환**(조용한 openai 대체 금지, §7.2).
- 3C-1: openai 실동작 유지 + 나머지는 mock/experimental(일반 UI 선택 불가). 3C-2에서 실 어댑터 연결.

## 9. 예상 부작용

- 3C-1은 **mock 중심** → 실 비용/호출 거의 없음. 신규 의존성은 3C-2에서(이번엔 틀만; mock).
- Capability Matrix/Canary 유지보수 부담 → 단일 출처·테이블화로 완화.
- provider별 구조화 출력/토큰필드 차이 → Matrix가 명시, 어댑터가 정규화.
- DeepSeek: 모델명·deprecation 변동 위험 → §11.
- 키 4개 관리 → 넣은 것만 활성.

## 10. 대안

- **A. 3B처럼 GPT 단일:** 단순하나 전환·검증 없음.
- **B. 4개 즉시 stable 개방:** 깨진 초안·과금·유출 위험(검증 없음) → 위험.
- **C. 틀+canary 먼저, 통과분만 개방 (추천):** 안전한 단계적 롤아웃.

## 11. DeepSeek 주의 (최신 docs 기준)

- DeepSeek은 OpenAI/Anthropic **호환 API** 제공하나 **모델명·deprecation 변동** 가능.
- **구현 직전 공식 docs 확인 필수.** deprecated 예정 모델명 **하드코딩 금지**.
- 모델명은 `providerPricing` + `source_url` + `price_snapshot_date`와 함께 관리(매트릭스 단일 출처).
- 데이터 전송/보관·검열·구조화 안정성 확인 전 **experimental 고정**. private/secret 절대 미전송(firewall 유지).

## 12. 보안 체크 (필수)

- [ ] 4 key 전부 서버 env만. 클라이언트 번들·`VITE_`·로그·응답·`/api/providers`에 키 미노출.
- [ ] `/api/providers`는 available(boolean)+status만. 키 값/일부/길이 미반환.
- [ ] `/api/expand` provider·quality_pref enum 검증, 모델명은 **서버 allowlist만**.
- [ ] private/secret firewall 유지(provider 무관). 사용자 텍스트=DATA.
- [ ] costLedger/llmLog에 key·원문 프롬프트 미기록(provider 무관).
- [ ] canary 로그에 private/secret 원문 미저장(leak count만, 위반 시 disabled).
- [ ] `.gitignore`: `.env`·`.env.*` 무시 + **`!.env.example` 예외**로 example만 커밋.

## 13. 테스트 / 완료 기준 (DoD, 3C-1)

- [ ] 서버 타입체크 + client build + lint(eslint+doc-lang) + `npm test` 통과.
- [ ] `/api/providers`: 키 있는 provider만 available=true, status 포함, **응답에 키 문자열 없음** 테스트.
- [ ] modelRouter: provider+tier allowlist 선택, 임의 모델명 거부, key 미포함 테스트.
- [ ] **mock 어댑터**: JSON→LlmDraft→ExpansionResult 정상, 실패 시 fallback 테스트.
- [ ] Capability Matrix: 필수 필드·status enum·adapter_mode·can_generate_real_output 검증 테스트.
- [ ] **provider_unavailable**: 명시 선택 mock/키없음 provider → 조용한 openai 대체 안 함 테스트.
- [ ] **price_status**: placeholder 가격이 costLedger 비용 계산에 미사용 테스트(verified만 계산).
- [ ] Canary 하네스: mock 입력으로 집계(성공률/fallback/cap준수/leak=0) + canary_version 기록 산출 테스트.
- [ ] firewall: provider 무관 private/secret 미전송 테스트.
- [ ] `.env.example`이 실제 `git add` 대상이 되는지 확인(`!.env.example` 예외, 체크인 가능).
- [ ] UI: status 라벨(experimental/beta/stable) + 미가용 회색 + DeepSeek 주의 표시.
- [ ] 추적 주석 + agent-facing English(doc-lang) + UTF-8. docs(architecture/schemas/state) 갱신.

## 14. 구현 순서 (3C-1)

1. `.gitignore`에 `!.env.example` 추가 + `.env.example` 4칸. example 커밋 가능 확인.
2. `server/providers/types.ts`(ProviderAdapter) + `mockAdapter.ts`.
3. `server/providers/capabilityMatrix.ts`(4 provider×tier, status, 필수필드).
4. `providerPricing.ts` 4 provider 확장(placeholder+source_url+price_snapshot_date).
5. `modelRouter.ts` provider 파라미터화 + Matrix allowlist.
6. `server/index.ts` `GET /api/providers` + `/api/expand` options(enum 검증).
7. `server/canary/`(시드 묶음 + runner + 집계, mock) + `canary/pairwise/`(순서 swap·rationale·human notes 양식).
8. 프론트: providers 조회 + Wizard 드롭다운 skeleton(status 라벨/회색/DeepSeek 배너) + remoteExpander options 전달.
9. 테스트(mock/router/providers/matrix/canary/firewall). 문서 갱신.
10. build/타입체크/lint/test → 헌법 §9 커밋·푸시.

## 15. 참고 문헌

**연구 근거:**
- FrugalGPT — arXiv:2305.05176 (https://arxiv.org/abs/2305.05176): 여러 모델을 비용/품질 기준으로 조합.
- RouteLLM — arXiv:2406.18665 (https://arxiv.org/abs/2406.18665): 자동 라우팅은 선호 데이터가 쌓인 뒤.
- MT-Bench / Chatbot Arena — arXiv:2306.05685 (https://arxiv.org/abs/2306.05685): LLM judge의 position/verbosity bias → pairwise + 순서 섞기.
- HELM — arXiv:2211.09110 (https://arxiv.org/abs/2211.09110): 같은 조건·여러 지표로 비교.

**Structured output (provider별 방식·제한 다름 → canary 필요):**
- OpenAI: https://developers.openai.com/api/docs/guides/structured-outputs · models https://platform.openai.com/docs/models · pricing https://openai.com/api/pricing/
- Gemini: https://ai.google.dev/gemini-api/docs/structured-output · pricing https://ai.google.dev/gemini-api/docs/pricing
- Claude: https://platform.claude.com/docs/en/build-with-claude/structured-outputs · models https://platform.claude.com/docs/en/about-claude/models/overview
- DeepSeek: https://api-docs.deepseek.com/ · pricing https://api-docs.deepseek.com/quick_start/pricing-details-usd/

## 16. 승인 체크리스트

- [ ] 3C를 **3C-1(틀+canary, mock)** / **3C-2(실 provider 롤아웃)** 2단계로 분리.
- [ ] 4 provider를 바로 stable로 열지 않고, **canary 통과 전 beta/experimental** 표시.
- [ ] **Provider Capability Matrix**가 structured output·token usage·pricing·timeout 차이 기록.
- [ ] **Provider Contract Canary**가 같은 한국어 시드 묶음으로 schema 성공률·비용·지연·fallback·품질 비교(기준: leak=0 필수, ≥95% stable후보, fallback>5% beta유지 — 내부 기준).
- [ ] 품질 비교 = **pairwise + 순서 섞기 + 길이 bias 방지 + rationale + 일부 사람 검토**.
- [ ] **자동 provider routing은 3C 범위 제외**(후속).
- [ ] DeepSeek은 공식 docs 재확인 전 **모델명 고정 금지**, experimental 고정.
- [ ] 4 key 서버 env 일괄 저장, 미노출, `/api/providers`는 available+status만.
- [ ] 클라이언트 모델명 임의지정 차단(allowlist), provider/quality enum 검증.
- [ ] **`.env.example`이 실제로 Git에 포함될 수 있는지 확인**(`!.env.example` 예외).
- [ ] 실패 시 3A 결정론 fallback 유지. private/secret firewall 유지.
- [ ] **mock provider는 일반 사용자에게 실제 생성 가능 provider처럼 보이지 않는다**(개발/test mode만).
- [ ] **명시 선택 provider가 unavailable이면 조용히 openai로 대체하지 않고 `provider_unavailable`로 알린다.**
- [ ] **placeholder 가격은 실제 비용 계산에 사용하지 않는다**(price_status=verified만 계산).
- [ ] **canary seed bank는 버전 관리**되고, provider별 결과는 `canary_version`과 함께 저장된다.
- [ ] **adapter_mode/status/can_generate_real_output이 UI와 라우터에서 같은 의미**로 사용된다.
- [ ] 추적 주석·헌법 §9 워크플로·아카이브.

## 17. 승인 요청

`APPROVE: proceed` (= Phase 3C-1 구현) / 수정 `REVISE: ...` / 거절 `REJECT: ...`

> 3C-2(실 provider 연결)는 3C-1 완료 후 **별도 제안**으로 올립니다. 기본 provider/등급 선호 있으면 알려주세요(없으면 openai=stable 유지, 나머지 experimental로 시작).
