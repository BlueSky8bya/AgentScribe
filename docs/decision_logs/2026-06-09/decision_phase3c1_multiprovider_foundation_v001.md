<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md] Phase 3C-1 (approved + implemented) -->
# Decision Log: Phase 3C-1 — Multi-Provider Foundation + Contract Canary (mock)

- 날짜: 2026-06-09 / 상태: APPROVED + IMPLEMENTED
- 제안서: `docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md`
- 승인: `APPROVE: proceed`

## 구현 결정

- **2단계 중 1단계.** 3C-1 = 틀 + canary(mock). 실 provider 연결(Gemini/Claude/DeepSeek live)은 **3C-2 별도 제안**.
- **Capability Matrix**(`server/providers/capabilityMatrix.ts`) = provider/model/tier 단일 출처. 필드: adapter_mode(live|mock|disabled), can_generate_real_output, status(disabled|experimental|beta|stable), json_mode/schema/tool_use, token 필드, timeout, retry, price 포인터. 라우터·UI 동일 의미 사용.
  - openai = **live / stable / can_generate=true**(gpt-5.4-mini=cheap, gpt-5.4=quality).
  - gemini/claude/deepseek = **mock / experimental / can_generate=false**(model_id placeholder, 3C-2에서 확정).
- **ProviderAdapter**(`server/providers/types.ts`) + `openaiAdapter`(live) + `mockAdapter`(canned LlmDraft, 외부 호출 없음) + `registry.resolveAdapter`. `llmExpander`를 adapter 기반으로 리팩터(공통 후처리 유지).
- **런타임 선택**: `/api/expand` options.provider/quality_pref(enum). `modelRouter.route({provider,...})` → Matrix allowlist에서 model 결정. **클라이언트 모델명 임의지정 불가**.
- **조용한 대체 금지**: 명시 선택 provider가 `canRunRealGeneration=false`(mock·dev플래그 없음·키 없음) → **HTTP 409 `provider_unavailable`**. openai로 바꾸지 않음. provider 미지정만 openai 기본.
- **mock = dev/test 전용**: `ALLOW_MOCK_PROVIDERS=1`일 때만 mock 실생성 허용. 일반 UI는 회색/"준비중".
- **`GET /api/providers`**: `{id,status,adapter_mode,can_generate_real_output,available,tiers,note}`. available=env 키 존재 여부(boolean)만. **키 값 절대 미반환**.
- **가격 분리**(`providerPricing.ts`): `price_status(verified|placeholder)` + `usable_for_cost_estimate`. **placeholder 가격은 costLedger 계산 미사용**(0). `CostLedgerEntry.price_status` 추가, WorkCostPanel은 미검증 시 "비용 계산 준비중" 표시.
- **Contract Canary**(`server/canary/`): `seedBank`(CANARY_VERSION + 한국어 시드 5종 — 무협/판타지/SF/로맨스/미스터리, 비밀·비인간·다관계·복선·단편/장편/시리즈), `runner`(runCanaryCase/aggregateCanary → schema 성공률·cap준수·**leak count**·canary_version·status_before/after), `pairwise`(순서 swap·length-bias·rationale·human review 양식; 3C-1은 구조만). 기준 = **AgentScribe 내부(산업표준 아님)**: leak>0→disabled, live+≥95%→stable, mock은 stable 자동승격 안 함.
- **자동 라우팅 = 후속**(이번 제외). 사용자 직접 선택 + 기록만.
- **`.env.example` 버그 수정**: 3B에서 `.gitignore .env.*`가 example까지 무시 → `!.env.example` 예외 추가(`git add --dry-run`으로 커밋 가능 확인). `.env.example` 4 key 칸.

## 검증

- `tsc -p server/tsconfig.json` 통과.
- `npm run build`(client) 통과.
- `npm run lint`(eslint + doc-lang) 통과 — agent-facing 영어 유지(architecture/schemas의 한글 잔류 수정).
- `npm test` **54/54** 통과(신규: capabilityMatrix, providerRouting+mockAdapter, priceStatus, canary).

## 보안 확인

- 4 key 서버 env만. `/api/providers`·응답·로그·매트릭스·테스트에 키 미노출(`sk-` 부재 검증).
- provider_unavailable로 조용한 대체 차단. allowlist로 임의 모델 차단.
- placeholder 가격 비용계산 미사용. canary leak count(원문 미저장).

## 후속

- **Phase 3C-2**: Gemini/Claude/DeepSeek 실 어댑터 연결. canary 실측 → status 승격. DeepSeek 모델명 공식 docs 확인(하드코딩 금지)·데이터/검열 검토 선행.
- Phase 4 = Writer 회차 생성.
- 자동 provider routing(FrugalGPT/RouteLLM류)은 로그 축적 후.
