<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] Phase 3B (approved + implemented) -->
# Decision Log: Phase 3B — LLM 설계 보조자 + 서버 model_router

- 날짜: 2026-06-09 / 상태: APPROVED + IMPLEMENTED
- 제안서: `docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md`
- 승인: `APPROVE: proceed with GPT / OpenAI`

## 구현 결정

- **provider = GPT/OpenAI 확정**(승인 시 4개 후보 중 선택). 나머지(Gemini/Claude/DeepSeek)는 후속 multi-provider fallback로 보류. 코드는 OpenAI 1개만 구현.
- **3B = LLM 설계 보조자**(인물 요약·과거사 초안·secret·주제 질문·관계 상태). 회차 본문은 Phase 4(미구현).
- **백엔드 신규**: `server/` Node + Express. `POST /api/expand`만. CORS는 localhost dev만, body 64kb 제한, 간단 rate limit(분당 30/IP).
- **키 보안**: `OPENAI_API_KEY`는 서버 env만. 클라이언트 번들·`VITE_`·로그·응답에 절대 미포함. `.env.example`만 커밋(.env는 gitignore).
- **Input/Prompt Firewall**(`server/inputFirewall.ts`): zod가 미선언 키 strip → private_backstory/secrets/주입 필드 통과 불가. 사용자 자유텍스트는 DATA로만 전달, 시스템 프롬프트는 서버 고정("키 출력" 등 무력화).
- **model_router**(`server/modelRouter.ts`): provider 고정 + budget/effective_scale/risk → 등급. cheap=`gpt-5.4-mini`, quality=`gpt-5.4`. budget save가 quality보다 우선(비용). key는 결정에 미포함.
- **llmExpander**(`server/llmExpander.ts`): OpenAI SDK(`response_format json_object`) → zod `LlmDraft` 검증 → **결정론 스켈레톤에 LLM 텍스트 overlay**(항상 스키마 유효) → 1회 재시도 → 실패/키없음 시 **3A DeterministicExpander fallback**. 생성량 caps(scale별 관계/복선 slice).
- **비용/관측**: `cost/costLedger.ts`(work_id별 토큰·비용, §9B.1 필드), `pricing/providerPricing.ts`(가격 분리, source_url + price_snapshot_date 2026-06-09), `obs/llmLog.ts`. **key·원문 프롬프트 미기록**(타입으로 강제).
- **ExpanderAdapter seam**: 인터페이스를 `ExpansionResult | Promise<ExpansionResult>`로 확장, `bootstrapWork`가 `await`. 프론트 `RemoteExpander`(async, 실패 시 deterministic fallback, `lastCost` 노출).
- **UI**: `ExternalSendNotice`(외부 전송 안내 + private 미전송), `ExpandProgress`, `WorkCostPanel`(이 작품 AI 사용량). Wizard에 AI on/off 토글, App→ExpandReview로 cost 전달.
- **모델/가격 출처**: OpenAI 공식 pricing(2026-06-09 확인) — gpt-5.5/5.4/5.4-mini/5.4-nano. 라우터는 5.4/5.4-mini 사용. SDK = `@anthropic-ai/sdk` 아님, **공식 OpenAI Node SDK v6**.

## 검증

- `tsc -p server/tsconfig.json`(서버 타입체크) 통과.
- `npm run build`(client tsc -b + vite) 통과.
- `npm run lint`(eslint + doc-lang guard) 통과 — agent-facing 문서 영어 유지.
- `npm test` **40/40** 통과(기존 28 + 신규 modelRouter/inputFirewall/costLedger/remoteExpander).
- 수동 smoke(키 필요)는 미실행. 키 없음 경로는 fallback 테스트로 검증.

## 보안 확인

- API key: 서버 env만. 비교표/응답/로그/테스트에 `sk-` 미존재 검증.
- firewall: private_backstory/secrets/주입 필드 strip 테스트.
- cost ledger: key/prompt 필드 부재 테스트.
- `.env`는 gitignore, `.env.example`만 커밋.

## 후속

- Multi-provider fallback(Gemini/Claude/DeepSeek). DeepSeek 선택 시 데이터 전송/검열/구조화 테스트 선행.
- Phase 4 = Writer 회차 생성(별도 제안). 전체 비용 합산(3B+4+5+관측).
- 공개 배포 시 인증/사용량 제한 필수.
