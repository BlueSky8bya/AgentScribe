<!-- [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md] Phase 4 (approved + implemented; real-body smoke pending) -->
# Decision Log: Phase 4 — Writer 회차 본문 생성

- 날짜: 2026-06-09 / 상태: APPROVED + IMPLEMENTED (코드). 실 본문 smoke = 키 실행 대기.
- 제안서: `docs/proposals/archive/2026-06-09/proposal_phase4_writer_episode_v001.md`
- 승인: `APPROVE: proceed` (REVISE 5건 반영: 저장 분리/commit_status/report 본문 미저장/created_at 주입/non_korean 기준)

## 구현 결정

- **WriterContract**(client, `src/core/writer/writerContract.ts`): WorkRecord **public group만** 조립(intent/blueprint/episode_contract). reveal allowed/forbidden = episode_index vs RevealSchedule. `assertNoPrivateLeak`로 전송 전 차단. private/secret 미포함.
- **EpisodeDraft**(`src/core/schemas/episodeDraft.ts`): `status`(draft|failed) + `commit_status`(generated|user_saved|discarded) 분리. created_at 서버 ISO 주입(테스트 고정 clock). WorkRecord 스키마 무변경(별도 저장).
- **저장 분리**: 생성 직후 draft=화면 임시(미영속), 사용자 "저장" 클릭 시에만 committed(`user_saved`, `data/works/<id>/episodes/`). LocalStore는 **status=failed 저장 거부**.
- **server/writer**: 한국어 프롬프트(micro-detail 허용 / 새인물·사건·예정반전·world위반·secret 금지), `validateBody`(빈문자/한글비율<0.5 → 실패; 소량 외국어 허용), `writeEpisode`(adapter 재사용, withTimeout, **재시도 ≤2**, **결정론 fallback 없음 → 실패 시 status=failed·본문 빈문자·미저장**), costLedger `later_writer`, llmLog.
- **/api/write**: firewall 재검증 + `canRunRealGeneration` allowlist(OpenAI/Claude만) + `provider_unavailable`(Gemini/DeepSeek 409, 조용한 대체 금지). 기본 openai.
- **provider**: OpenAI(stable)/Claude(beta)만 선택 가능. Gemini/DeepSeek 회색 유지.
- **UI**: `EpisodeWriter`(회차/provider/품질 → 생성 → 저장/버림). WorkCostPanel 재사용(later_writer cost).

## 검증

- `tsc -p server/tsconfig.json` + `npm run build` + `npm run lint`(eslint+doc-lang) 통과.
- `npm test` **90/90** 통과(신규 writer.test: validate 한국어/빈문자, contract firewall, writeEpisode draft/failed[non_korean·api_error], store failed 저장 거부; 전부 무네트워크 mock + 고정 clock).
- 실 본문 smoke(OpenAI/Claude 각 1회) = 키 실행 대기. report엔 **본문 원문 미저장**(char_count/한글비율/cost/latency/hash·snippet만).

## 보안 확인

- private/secret firewall(packForWriter/assertNoPrivateLeak + 서버 zod/assert) 유지.
- 키 서버 env만, 로그·결과·costLedger 미기록. provider_unavailable(조용한 대체 금지).
- 실패 시 가짜 본문 미생성·미저장.

## 후속

- 실 Writer smoke 실행 → test report(본문 원문 미기록).
- Phase 5: Creative Review / Immersion Gates(10축, 본문 품질·정합성 게이트). reveal/world 위반 자동 검출은 Phase 5 게이트(현재는 프롬프트 규칙).
- Gemini api_error / DeepSeek live = 보류(별도).
- rollback: /api/write·EpisodeWriter 제거(별도 저장이라 WorkRecord 영향 없음), 커밋 revert.
