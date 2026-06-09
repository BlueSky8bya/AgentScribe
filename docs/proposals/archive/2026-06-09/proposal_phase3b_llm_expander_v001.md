# 제안서: Phase 3B Implementation — LLM 설계 보조자 + 서버 model_router (v2)

## 한눈에 보는 요약 (초보용)

Phase 3A는 "규칙 기반 초안 생성기"(LLM 없음)였습니다. **3B는 그 자리에 AI를 끼웁니다.** 단, 3B의 AI는 **"AI 작가"가 아니라 "AI 설계 보조자"**입니다. 회차 본문(소설 문장)은 만들지 않습니다(그건 Phase 4 Writer). 3B는 **인물 과거·관계·주제·복선·아크 초안만 더 풍부하게** 만들어 줍니다. 사용자는 여전히 검토·수정·삭제합니다.

**가장 중요한 안전 규칙:** AI를 부르는 **열쇠(API key)는 작은 서버에만** 둡니다. 브라우저에는 절대 안 보입니다. 브라우저는 "초안 만들어줘"라고 **우리 서버에** 부탁하고, 서버가 열쇠로 AI를 부른 뒤 결과만 돌려줍니다.

> **비유:** 손님이 프런트(브라우저)에서 주문하면, 프런트는 금고 열쇠가 없고, **뒷방 직원(서버)**이 금고 열쇠로 재료(AI)를 꺼내 요리해 내옵니다. 손님은 금고를 못 봅니다.

**외부 전송 안내(중요):** 초안 생성을 누르면 입력한 작품 정보(시드·공개 인물 정보·세계 규칙)가 **외부 AI 회사 서버로 전송**됩니다. 화면에 이 사실을 안내합니다. 비밀 설정(private/secret)은 **기본적으로 안 보냅니다**.

**화면 흐름(3A와 동일, 속도/안내만 추가):**
```text
시드 입력 → [외부 AI 전송 안내 확인] → [AI가 설계 초안 만드는 중...] → 초안 검토(수락/수정/삭제) → 편집실 → 잠금
```

---

## 0. 위치 / 역할 정정

Phase 3A(최소 시드 + 결정론 Expander + mixed-initiative 검토) 위에 올림. **`ExpanderAdapter` 인터페이스는 3A와 동일** → 결정론 구현을 LLM 구현으로 교체만. 설계 전문: `docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md`.

**3B 역할(정확):** LLM 기반 **설계 초안 생성기**. 만드는 것 = CharacterBible / Cast / Relationship / ThemeLedger / Foreshadow / (firewalled) private backstory + 시리즈는 아크 단위 초안. **만들지 않는 것 = 회차 본문(Writer = Phase 4).**

> 이번엔 **백엔드(서버) 추가**. 보안·구조 변화라 별도 제안(이 문서)으로 승인.

## 1. 목적

3A의 거친 규칙 초안을 **LLM 기반 고품질 설계 초안**으로 올림. 단 **API key를 프론트에 절대 노출하지 않기 위해** 서버 전용 `model_router`를 둠(설계 §10.5.5).

## 2. 범위

| 구분 | 만든다 (3B) | 안 만든다(후속) |
|---|---|---|
| 백엔드 | 최소 Node 서버 + `/api/expand` | 회차 본문 생성 API(Phase 4) |
| provider | **승인 시 4개 중 1개 선택**(GPT/Gemini/Claude/DeepSeek) | 선택 안 된 provider(후속 multi-provider fallback) |
| 라우팅 | 서버 전용 `model_router`(provider 고정, budget/effective_scale/risk로 **모델 등급** 선택) | 다중 provider 라우팅 고도화 |
| LLM | `LlmExpander`(ExpanderAdapter 구현) | Writer 본문(Phase 4) |
| 방화벽 | **Input/Prompt Firewall**(시드+public/writer-safe만 전송) | — |
| 검증 | 구조화 출력 시도 → 안 되면 JSON 프롬프트+zod+1회 재시도 | — |
| 생성량 | effective_scale별 **상한**(아래 §9) | — |
| 관측 | 호출 로그(provider/model/cost/latency/error_type; **key·원문 미기록**) | 대시보드 |
| UX | 생성 중 진행 표시 + **외부 전송 안내** | 사전렌더 캐시(Phase 7) |
| 안전 | key 서버 env, 입력검증, CORS localhost, body 크기/ rate limit, 실패 시 3A fallback | 공개 배포 인증/사용량 제한(후속 필수) |

## 3. Provider 선택 (승인 시 1개 선택 — 아직 미확정)

기본 모델을 특정 모델로 고정하지 않음. **승인 시 오너가 4개 후보 중 1개를 선택**. 선택 전까지 provider 미확정.

### 3.1 후보 (4개)
- **GPT / OpenAI**
- **Gemini / Google**
- **Claude / Anthropic**
- **DeepSeek**

### 3.2 선택 기준
| 기준 | 의미 |
|---|---|
| 비용 | 입력/출력 단가, 설계 초안 1건당 예상 비용 |
| 한국어 창작 품질 | 한국어 인물·관계·주제·복선 초안 자연스러움 |
| 긴 컨텍스트 | 장편/시리즈 시드+자산 한 번에 처리 |
| 구조화 출력 안정성 | JSON/스키마 강제 출력의 신뢰도 |
| 서버 SDK 안정성 | 공식 서버 SDK 성숙도·타입 지원 |
| rate limit / timeout 대응 | 재시도·백오프·한도 |
| 보안 궁합 | key 서버보관·로그 미기록 원칙과의 적합성 |

### 3.3 선택 방식
- **승인 시 4개 중 1개 선택**(§18 4개 승인 문구 중 하나).
- **선택된 provider 1개만 이번 Phase 3B에서 구현.**
- 선택 안 된 나머지 3개는 이번 범위 제외 → 후속 **multi-provider fallback/routing** 후보.
- **선택된 provider의 key만 서버 env에 저장**(이름은 §3.5). 브라우저에는 어떤 provider key도 미노출.
- 구현 기준 = §4(선택 provider). 모든 SDK 시그니처·모델명은 구현 직전 해당 provider 공식 docs로 재확인.

### 3.4 Provider 비용 비교표 (참고용 — 어려운 토큰식 화면 미노출)
화면엔 토큰 계산식 대신 아래 형태로 보여줌. **가격은 자주 바뀜 → 구현 직전 각 provider 공식 pricing 확인, `price_snapshot_date` 기록.** 토큰/비용은 "설계 초안 1건" 기준 추정(실측 후 갱신).

| Provider | 예상 용도 | 예상 토큰 | 예상 비용 | 비고 |
|---|---|---:|---:|---|
| GPT / OpenAI | 균형형 | 약 n tokens | 약 $n | 구조화 출력 강점 |
| Gemini / Google | 긴 컨텍스트 후보 | 약 n tokens | 약 $n | 장문 입력 후보 |
| Claude / Anthropic | 창작/긴 글 후보 | 약 n tokens | 약 $n | 설계 품질 후보 |
| DeepSeek | 저비용 후보 | 약 n tokens | 약 $n | 저비용 실험 후보(주의 §9C) |

> `n`은 구현 시 각 공식 pricing × 평균 토큰 실측으로 채움. 표 하단에 `price_snapshot_date` 표기.

### 3.5 env key 이름 (선택 provider에 따라)
| 선택 | env key |
|---|---|
| GPT / OpenAI | `OPENAI_API_KEY` |
| Gemini / Google | `GEMINI_API_KEY` |
| Claude / Anthropic | `ANTHROPIC_API_KEY` |
| DeepSeek | `DEEPSEEK_API_KEY` |

> 선택된 1개만 `.env`에 저장(서버만). 나머지는 미사용.

## 4. 기술 결정 (선택된 provider 1개 기준)

- **백엔드:** 최소 **Node + TypeScript** 서버(`server/`). 경량 프레임워크(express 권장, 구현 시 확정). Vite dev는 `/api` 프록시.
- **SDK·모델·env (선택 provider에 따라):**
  - **선택 provider의 공식 서버 SDK** 사용. env key는 §3.5(선택 1개만).
    - GPT/OpenAI → 공식 OpenAI Node SDK / `OPENAI_API_KEY`
    - Gemini/Google → 공식 Google GenAI Node SDK / `GEMINI_API_KEY`
    - Claude/Anthropic → 공식 `@anthropic-ai/sdk` / `ANTHROPIC_API_KEY`
    - DeepSeek → 공식 DeepSeek API(SDK/HTTP) / `DEEPSEEK_API_KEY`
  - 모델 등급은 §8 라우터에서 budget/scale/risk로 선택(저비용/고품질 모델명은 구현 직전 해당 provider 공식 docs로 확정).
  - 구조화 출력은 해당 provider의 구조화/JSON 출력 시도 → §5 순서.
  - **SDK 호출 시그니처·모델명·옵션은 추측 금지.** 구현 직전 선택 provider 공식 docs/SDK로 재확인 후 확인된 방식만 코드화.
- **키 보관:** 선택 provider key는 **서버 env/secret만**. Vite 클라이언트 번들·`VITE_` prefix에 금지. `.env`는 gitignore(이미 적용), **`.env.example`만 커밋**.
- **ExpanderAdapter 교체:** 인터페이스 동일 → 프론트는 `/api/expand` 호출. 실패 시 **3A `DeterministicExpander` graceful fallback**.
- **Mixed-initiative 유지:** 생성물=제안(provenance agent_preflight), 사용자 검토. Canonical(시드) 불변.

## 5. 구조화 출력 처리 순서 (SDK 단언 금지)

선택 provider의 구조화 출력(JSON schema)·모델명·옵션은 provider·SDK 버전마다 다름 → **구현 전 해당 provider 공식 문서로 재확인**. 해당 모델/SDK에서 구조화 출력이 바로 안 되면:

1. **JSON 출력 프롬프트**(스키마 형태 명시)
2. **zod 검증**(Phase 2 스키마)
3. **1회 재시도**
4. 실패 시 **3A DeterministicExpander fallback**

## 6. 아키텍처

```text
[브라우저 (Vite)]                         [Node 서버 (server/)]            [외부 LLM provider]
  Wizard 시드 입력 + 외부전송 동의           /api/expand                       (선택 provider 모델)
    → POST /api/expand {seed, public chars}─▶ Input Firewall (public만)
                                              → model_router.route(...)
                                              → LlmExpander.expand()  ───────▶ 구조화/ JSON 출력
                                              ← zod 검증 (재시도 1회)
    ◀──────────────────────────────────────  (실패 시 DeterministicExpander)
  ExpandReview(수락/수정/삭제) → 저장(localStore) → Preflight Room(Phase 2)
  ※ provider key는 서버에만. 클라이언트는 결과 JSON만. 로그에 key·원문 미기록.
```

## 7. 폴더·모듈 (신규/확장)

```text
server/
  index.ts              // 서버 진입점, /api/expand, CORS(localhost), body limit, rate limit
  modelRouter.ts        // provider 고정 + budget/effective_scale/risk -> 모델 등급 선택, key env
  inputFirewall.ts      // /api/expand 입력에서 public/writer-safe만 통과, private/secret/지시문 무력화
  llmExpander.ts        // ExpanderAdapter 구현 (선택 provider SDK; 구조화/JSON+zod+재시도)
  obs/llmLog.ts         // 호출 로그(provider/model/cost/latency/error_type; key·prompt 원문 미기록)
  pricing/providerPricing.ts // 서버 전용 price table (출처+price_snapshot_date)
  cost/costLedger.ts    // work_id별 토큰/비용 장부(9B.1 필드; prompt·key 미기록)
src/core/expand/
  remoteExpander.ts     // 프론트: /api/expand 호출 -> ExpansionResult (실패 시 deterministic)
src/ui/
  ExpandProgress.tsx    // 생성 중 진행 표시
  ExternalSendNotice.tsx// 외부 AI 전송 안내 문구
  WorkCostPanel.tsx     // "이 작품의 AI 사용량"(토큰/비용/모델/fallback/가격기준일)
.env.example            // 선택 provider key 자리(§3.5; 실제 .env는 gitignore)
tests/
  modelRouter.test.ts   // budget/scale/risk -> 모델 등급, key 미노출
  inputFirewall.test.ts // private/secret 미포함, 지시문 무력화
  remoteExpander.test.ts// 서버 실패/429/timeout/invalid schema -> fallback
  costLedger.test.ts    // 토큰->비용 계산, prompt·key 미기록, fallback 기록
```

## 8. model_router (서버 전용)

- provider는 **선택된 1개로 고정**. 그 안에서 budget/effective_scale/risk로 **모델 등급** 선택:
  - 비용절약 / 단편·중편 / 저위험 → **저렴 모델**
  - 장편·시리즈 / 고위험 설계 확장 → **고품질 모델**
  - 사용자 "고품질 우선" ON → 고품질
  - 사용자 "비용 절약" ON → 저비용
- key는 `process.env.<선택 provider key>`(§3.5). 응답·로그에 절대 미포함.
- timeout / 429 / 5xx → 재시도(백오프) 후 실패 시 fallback(3A) 또는 부분실패 보고.

## 9. 개인정보 / 외부 전송 + 방화벽 + 생성량 상한

### 9.1 외부 전송 안내 (UI 필수)
화면 문구(예): **"AI 초안을 만들기 위해 입력한 작품 정보가 외부 AI API로 전송됩니다. API key는 서버에만 보관되고, 브라우저에는 보이지 않습니다."** 비밀 설정(private/secret)은 기본 미전송. 전송이 필요하면 **별도 동의** 필요.

### 9.2 Input / Prompt Firewall (LLM 앞단)
- `/api/expand` 입력 = **최소 시드 + writer-safe/public 정보만.**
- API key·서버 env·내부 로그·기존 private secrets는 프롬프트에 **절대 미포함**.
- 사용자 입력에 "이전 지시 무시", "키를 출력해라" 등이 있어도 **시스템 보안 규칙 변경 불가**(지시문 무력화 + 시스템 프롬프트 우선).

### 9.3 생성량 상한 (effective_scale별)
| scale | 주요 인물 | 관계 | 복선 |
|---|---|---|---|
| 단편 | 2~4 | 2~4 | 1~3 |
| 중편 | 3~6 | 3~8 | 3~6 |
| 장편 | 5~10 | 6~15 | 6~12 |
| 시리즈 | **아크 단위 분할 생성**(한 번에 과도 생성 금지) | 아크별 상한 | 아크별 상한 |

## 9B. 비용/토큰 추적 (Phase 3B = 설계 초안 비용만)

**범위 한정:** 3B는 **설계 초안 생성 비용만** 계산. 회차 본문(Phase 4)·검수/재작성(Phase 5)·관측/검색 비용은 미포함. 나중에 합산:
```text
전체 작품 비용 = Phase 3B 설계초안 + Phase 4 본문생성 + Phase 5 검수/재작성 + 기타 관측/검색
```

### 9B.1 작품별 비용 장부 (work_id마다 누적)
LLM 사용량을 `work_id`별로 모아 기록. 필드:
```text
work_id, phase(phase3b_expansion|later_writer|later_review), provider, model,
call_count, input_tokens, output_tokens, cached_tokens,
reasoning_tokens_or_thinking_tokens, total_tokens,
unit_price_input, unit_price_output, estimated_cost_usd, actual_cost_usd,
price_snapshot_date, fallback_used, fallback_reason
```
> 저장은 서버/로컬. **prompt 원문·key는 미기록**(§12 준수). 토큰 수·비용만.

### 9B.2 사용자 화면 (쉽게)
```text
"이 작품의 AI 사용량"
- 설계 초안 생성: 42,000 tokens / 약 $0.18
- 사용한 모델: GPT 저비용 모델
- fallback: 없음
- 가격 기준일: 2026-06-09
```
또는 규모별 예상(숫자 대신 등급):
```text
"예상 비용 수준" — 단편: 낮음 / 중편: 보통 / 장편: 높음 / 시리즈: 매우 높음
```

### 9B.3 가격표 분리 (하드코딩 금지)
`server/pricing/providerPricing.ts`(서버 전용 price table). 항목마다 **출처+확인일 필수**:
```text
provider, model,
input_price_per_1m_tokens, output_price_per_1m_tokens, cached_input_price_per_1m_tokens,
source_url, price_snapshot_date
```
> 가격 변동 시 이 파일만 갱신. 비용 계산은 이 표 × 장부 토큰.

## 9C. DeepSeek 선택 시 주의 (저비용 후보)

비교표에 **저비용 실험 후보**로 포함. **DeepSeek을 선택하면** 아래를 먼저 테스트/확인해야 함:
- **데이터 전송/보관 정책** 확인 필요(해외 서버 저장 가능성)
- **검열/정책 편향** 가능성 확인 필요
- **구조화 출력 안정성** 테스트 필요
- 한국어 창작 품질 확인
- private/secret 정보는 다른 provider와 **동일하게 절대 전송 안 함**(firewall §9.2)

> 화면 비교표에서 DeepSeek은 "저비용"과 함께 위 주의 문구를 같이 표기.

## 10. 예상 부작용

- 백엔드 추가 = 운영 대상 1개 증가(dev는 Vite 프록시, 배포는 후속 결정 + 인증/사용량 제한 필수).
- LLM 호출 = 비용·지연. budget/모델등급/생성상한/fallback으로 통제.
- 비결정적 → 같은 시드라도 결과 다름(검토 단계가 안전망).
- 외부 전송 = 개인정보 이슈 → 안내 + private 미전송 + firewall로 차단.
- key 유출 위험 → 서버 env + 로그 미기록 + .env gitignore + VITE_ 금지로 차단.

## 11. 대안

- **A. 브라우저 직접 LLM 호출:** 서버 불필요하나 **key 노출** → 불가(§10.5.5).
- **B. 사용자 BYO key(브라우저):** 키 노출·UX 나쁨 → 보류.
- **C. 서버 model_router + LlmExpander (추천):** key 안전, 인터페이스 재사용, fallback 안전망, provider 1개 먼저 확정.

## 12. 보안 체크 (필수)

- [ ] 선택 provider key는 서버 env만. 클라이언트 번들·로그·git 미포함.
- [ ] `.env.example`만 커밋, 실제 `.env` 커밋 금지.
- [ ] `VITE_` prefix에 API key 금지.
- [ ] CORS는 개발용 localhost만 허용.
- [ ] 요청 body 크기 제한 + 간단 rate limit.
- [ ] `/api/expand` 입력 zod 검증, 응답은 ExpansionResult만(프롬프트 원문·key 미반환).
- [ ] 로그에 prompt 원문 전체 저장 금지. key/token/Authorization header 로그 금지.
- [ ] private/secret 필드는 firewall에서 차단(payload·프롬프트 미포함).
- [ ] 공개 배포 시 인증/사용량 제한은 후속 필수(이번 범위는 로컬 dev).

## 13. 테스트 / 완료 기준 (DoD)

- [ ] `npm run build`(client) + 서버 **TypeScript 빌드/타입체크** + `npm run lint`(eslint + doc-lang) + `npm test` 통과.
- [ ] **key 없으면** LLM 호출 대신 **3A fallback** 동작.
- [ ] 서버가 **429/timeout/invalid schema** 반환 시 fallback.
- [ ] **private/secret 필드가 `/api/expand` payload에 미포함** 테스트.
- [ ] **로그 객체에 key/prompt 원문 없음** 테스트.
- [ ] model_router가 **budget/effective_scale/risk로 모델 등급 선택** 테스트.
- [ ] inputFirewall: 지시문("키 출력") 무력화 테스트.
- [ ] 생성량 상한(scale별) 준수 테스트.
- [ ] **비용 장부**: 호출 후 work_id별 토큰/비용 누적, **prompt·key 미기록** 테스트.
- [ ] **providerPricing.ts**: 각 항목에 source_url + price_snapshot_date 존재. 가격 하드코딩 금지(파일 분리) 확인.
- [ ] UI에 **"외부 AI API 전송 안내"** + **"이 작품의 AI 사용량"**(토큰/비용/모델/fallback/가격기준일) 표시 확인.
- [ ] 신규 파일 추적 주석 + agent-facing English(doc-lang guard) + UTF-8.
- [ ] `docs/architecture.md`·`docs/schemas.md`·`docs/state.md` 갱신(English). 신규 `docs/model_routing.md` 생성 시 CLAUDE.md §5 경로 1줄 추가는 별도 승인.

## 14. package scripts (서버 추가 반영)

```jsonc
// 예시 — 구현 시 확정
"dev":        "동시 실행 또는 안내(dev:client + dev:server)",
"dev:client": "vite",
"dev:server": "tsx watch server/index.ts",   // 런너는 구현 시 확정
"build":      "tsc -b && vite build",         // client
"build:server":"tsc -p server/tsconfig.json", // server 타입체크/빌드
"test":       "vitest run"
```

## 15. 구현 순서

1. provider 확정(승인 항목) → 해당 공식 SDK 설치 + `.env.example`.
2. `server/inputFirewall.ts`(+테스트) → public만 통과, 지시문 무력화.
3. `server/modelRouter.ts`(provider 고정, 등급 선택, key env) + 테스트.
4. `server/llmExpander.ts`(공식 SDK 재확인 후; 구조화/JSON+zod+1회 재시도).
5. `server/obs/llmLog.ts`(key·원문 미기록).
6. `server/index.ts`(`/api/expand`, CORS localhost, body limit, rate limit).
7. `src/core/expand/remoteExpander.ts`(fallback 포함) + 테스트.
8. `src/ui/ExpandProgress.tsx` + `ExternalSendNotice.tsx` + Wizard 연결.
9. Vite dev 프록시(`/api`) + package scripts. 문서 갱신.
10. build/타입체크/lint/test → 헌법 §9 워크플로 커밋·푸쉬.

## 16. 참고 문헌 (공식 — 4개 후보 전부)

선택된 provider 1개의 docs/pricing이 구현 기준. providerPricing.ts 채울 때 해당 공식 pricing 확인 + `price_snapshot_date` 기록.

**GPT / OpenAI**
- Pricing: https://openai.com/api/pricing/
- Models: https://platform.openai.com/docs/models
- Node SDK: https://github.com/openai/openai-node
- Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs

**Gemini / Google**
- Pricing: https://ai.google.dev/gemini-api/docs/pricing

**Claude / Anthropic**
- Models/Pricing: https://platform.claude.com/docs/en/about-claude/models/overview
- Structured Outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs

**DeepSeek**
- Pricing: https://api-docs.deepseek.com/quick_start/pricing-details-usd/

> 구현 직전 선택 provider 공식 docs로 모델명·SDK 시그니처 재확인 후 확정.

## 17. 승인 체크리스트

- [ ] Phase 3B 역할 = **LLM 설계 보조자**(인물·관계·주제·복선·아크 초안). 회차 본문은 Phase 4.
- [ ] Phase 3B provider = **GPT/Gemini/Claude/DeepSeek 4개 중 1개 선택**(승인 시 §18 문구로 지정).
- [ ] **선택 provider key만**(§3.5) 서버 env에 저장, 브라우저 미노출.
- [ ] **선택된 1개만 구현.** 나머지 3개는 후속 **multi-provider fallback** 보류.
- [ ] 선택 provider 안에서 **budget/effective_scale/risk로 모델 등급** 분리.
- [ ] SDK 구체 호출은 구현 직전 **공식 문서 재확인** 후 확인된 방식만 코드화. 구조화 실패 시 JSON+zod+1회 재시도 → fallback.
- [ ] **외부 전송 안내 UI** + private/secret 기본 미전송(필요 시 별도 동의).
- [ ] **Input/Prompt Firewall**(public만, key·env·secret 미포함, 지시문 무력화).
- [ ] **생성량 상한**(scale별) 적용.
- [ ] **비용 추적**: 3B는 설계초안 비용만. work_id별 장부 + 가격표 파일 분리(출처+기준일) + 쉬운 UI 표시. DeepSeek 선택 시 저비용+주의(데이터/검열/구조화) 동시 표기.
- [ ] 백엔드(Node+TS) 추가 동의(배포·인증은 후속).
- [ ] 실패 시 **3A 결정론 Expander fallback**, mixed-initiative·Canonical 불변 유지.
- [ ] 보안 체크(§12)·테스트(§13)·package scripts(§14)·추적주석·헌법 §9 워크플로·아카이브.

## 18. 승인 요청

Phase 3B provider는 **아직 미확정**. 승인하실 때 4개 중 하나를 골라 주세요(선택된 1개만 구현):

- `APPROVE: proceed with GPT / OpenAI`
- `APPROVE: proceed with Gemini / Google`
- `APPROVE: proceed with Claude / Anthropic`
- `APPROVE: proceed with DeepSeek`

수정 `REVISE: ...` / 거절 `REJECT: ...`
