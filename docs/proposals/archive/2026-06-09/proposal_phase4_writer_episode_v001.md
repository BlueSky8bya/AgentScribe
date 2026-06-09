# 제안서: Phase 4 — Writer 회차 본문 생성 (OpenAI/Claude)

## 한눈에 보는 요약 (초보용)

지금까지는 "설계"(인물·관계·복선)만 만들었습니다. **Phase 4는 드디어 실제 "회차 본문(소설 문장)"을 AI가 씁니다.** 사용자가 회차를 고르고 provider(OpenAI 또는 Claude)를 고르면, AI가 그 회차 한 편을 **한국어로** 써 줍니다.

> **비유:** 편집실이 짜 둔 설계도(누가·언제·무엇)를 작가에게 주고 "이 화를 써 주세요" 시킴. 작가는 설계도 안에서만 쓰고(정해진 인물/사건), **비밀 설정(아직 밝히면 안 되는 반전)은 작가에게 안 보여줌**. 작가가 방 안 냄새·작은 몸짓 같은 **사소한 묘사는 자유롭게** 더하되, 새 인물·새 사건·금지된 반전은 못 만듭니다.

**사용 가능 provider:** OpenAI(stable) + Claude(beta)만. **Gemini/DeepSeek은 선택 불가**(회색) 유지.

**중요 안전:** private/secret(비밀 과거사·반전)은 작가 프롬프트에 **절대 미포함**(기존 firewall). 실패하면 **가짜 본문을 만들지 않고** "생성 실패"로 알리고 저장 안 함.

**화면 흐름:**
```text
편집실/잠금 → [회차 선택 ▼ + provider ▼(OpenAI/Claude) + 품질 ▼] → 본문 생성 중…
           → 본문 검토(저장/재생성) → (저장된 회차)
```

---

## 0. 위치

Phase 3(설계) 위. provider 인프라(adapter/router/firewall/costLedger/canary) 재사용. Writer = 설계 자산을 받아 **회차 본문 생성**. 기존 `contextPackager.packForWriter`(public만) + `assertNoPrivateLeak` 재사용.

## 1. Writer 입력 최소 구조 (요청 1)

Writer는 **writer-safe(public) 정보만** 받음. 클라이언트가 WorkRecord public group에서 조립해 서버로 전송(server firewall 재검증).

`WriterContract`(회차 1편 생성용 최소):
```text
work_id, episode_index,
authorial_intent: { lasting_feeling, desired_emotion, final_image(optional) }   // 톤/지향
blueprint_slice: { arc_label, episode_goal, prev_summary(public, optional) }      // 이 화 위치/목표
episode_contract: {
  pov, scale/episode_length(목표 글자수),
  active_characters: [{ character_id, name, role, public_summary }],             // public만
  active_relationship_beats: [{ from, to, beat }],
  allowed_character_reveals: [...], forbidden_character_reveals: [...],           // reveal 스케줄
  allowed_new_characters: number, world_rules: [public rules],
  reader_experience_goals: [...]
}
```
- 출처: WorkRecord.public(seed/intent/shape/character_bibles/cast/relationship_map/reveal_schedule/world_rules/blueprint/episode_cards) + RevealSchedule(allowed/forbidden by episode).
- **private group(private_backstory/secrets/hidden_truth) 미포함**(firewall §5).

## 2. provider 선택 + 실패 정책 (요청 2)

- 사용 가능 = **`user_selectable=true` provider만** = 현재 OpenAI(stable), Claude(beta). Gemini/DeepSeek 회색(선택 불가) — `/api/providers` 그대로 사용.
- `/api/write` options.provider(enum: openai|claude) + quality_pref. 라우터가 Capability Matrix allowlist에서 모델 결정(클라 모델명 임의지정 불가).
- **조용한 대체 금지**: 선택 provider가 `can_generate_real_output=false`(Gemini/DeepSeek 등) → `provider_unavailable` 409. 미지정 시 기본 openai.
- 실패 시 §6.

## 3. 본문 생성 결과 스키마 (요청 3)

`EpisodeDraft`(zod, 신규):
```text
schema_version, work_id, episode_id, episode_index,
title(optional), body_text(Korean),
char_count, target_char_count,
provenance: "agent_writer", provider, model,
status: "draft" | "failed",                 // 생성 성공/실패
commit_status: "generated" | "user_saved" | "discarded",   // 저장 라이프사이클 (요청 2)
beats_covered: [relationship beat ids/labels](optional),
created_at: ISO8601 string,                  // 서버 주입 (요청 4)
notes(optional, 모델 메모; 원문 프롬프트·키 미포함)
```

### 3.1 저장 라이프사이클 (요청 1·2)
`status`(생성 결과)와 `commit_status`(저장 상태)를 분리:
| 시점 | status | commit_status | 저장 위치 |
|---|---|---|---|
| 생성 성공 직후 | `draft` | `generated` | **임시(메모리/세션, 미영속)** — 디스크 미저장 |
| 사용자 "저장" 클릭 | `draft` | `user_saved` | `data/works/<work_id>/episodes/<episode_id>.json` (committed) |
| 사용자 "버림"/재생성 | `draft` | `discarded` | 저장 안 함(또는 committed였다면 discarded 표시) |
| 생성 실패 | `failed` | — | **절대 저장 안 함**(헌법: reject never commits) |

- **생성 직후 draft는 영속 저장 안 함**(클라 화면 임시 보관). **committed 저장은 사용자 "저장" 클릭 시에만**(`user_saved`).
- `failed`는 status·commit 무관하게 **디스크 미저장**.
- 채택 회차 = `commit_status="user_saved"`로 초안과 구분(후속 연재/NMK가 이것만 사용).
- draft 본문 저장은 사용자 작품물 → MVP 로컬 저장(설계 §10.5.6 "draft 미저장"은 운영 DB 항목, 후속 재검토).

### 3.2 created_at 주입 (요청 4)
- `created_at`은 **서버에서 ISO8601 주입**(`new Date().toISOString()` — 서버 코드, 워크플로 스크립트 아님). 클라가 보낸 값 신뢰 안 함.
- **테스트는 고정 clock 주입**(`now: () => "2026-01-01T00:00:00Z"` 같은 주입 가능한 시계)로 결정론 보장. 프로덕션은 실제 시계.

## 4. 한국어 출력 + micro-detail 허용 범위 (요청 4)

- **기본 출력 = 한국어**(system prompt 고정). 영어/타언어 출력 시 실패 처리 → 재시도.
- **허용(micro-detail)**: 감각·분위기·사소한 몸짓·배경 소품·자연스러운 대사 톤 등 **캐논과 모순 없는 작은 묘사**.
- **금지**: allowed_new_characters 초과 새 인물, 줄거리 사건 임의 추가, `forbidden_character_reveals`/스케줄 위반 반전, world_rules 위반, private/secret 추정·노출.
- 길이: `target_char_count = episode_length`(기본 5000자) 목표, ±범위 허용(예 ±30%). 과소/과대는 경고(차단 아님, 후속 게이트에서 정교화).

## 5. Firewall 원칙 유지 (요청 5)

- Writer 프롬프트 = `packForWriter`(public/writer-safe)만. `assertNoPrivateLeak`로 전송 전 검증.
- `/api/write` 서버 입력도 zod로 public-only 강제(private/secret 키 strip). 사용자 자유텍스트는 DATA, 시스템 프롬프트 고정("이전 지시 무시/키 출력" 무력화).
- 로그·costLedger·결과에 키·원문 프롬프트 미기록.

## 6. 실패 / 재시도 / 부분 실패 정책 (요청 6)

- 본문은 **결정론 fallback 없음**(규칙으로 좋은 소설 못 만듦) → **가짜 본문 생성 금지**.
- transient(timeout/429/5xx) 또는 출력 무효(빈 본문/비한국어/firewall 위반 감지) → **재시도(최대 2)**.
- **`non_korean` 판정(MVP 휴리스틱)**: 본문에서 공백·문장부호·숫자 제외한 "문자" 중 **한글 비율 < 임계(예 0.5)**이면 실패로 간주. 단 **대사/표지판/고유명사 속 외국어는 허용**(전체 비율 기준이라 소량 외국어는 통과). 임계는 운영값(산업표준 아님), fixture로 조정.
- 재시도 후에도 실패 → `status="failed"` + `error_type`(timeout|rate_limit|empty|non_korean|provider_unavailable|api_error) 반환, **저장 안 함**, 사용자에게 "생성 실패, 다시 시도/다른 provider" 안내.
- 부분 실패(예: 길이 초과로 잘림)도 무효 처리(저장 안 함). 회차 단위 all-or-nothing.
- timeout = Capability Matrix `timeout_ms`(withTimeout 재사용).

## 7. 최소 canary / fixture (요청 7)

- Writer fixture 1~2개(작은 WriterContract). 검증:
  - 출력이 **한국어**인지(휴리스틱: 한글 비율 임계).
  - **private/secret 미전송**(프롬프트 검사) + 출력에 forbidden_reveal 표지 부재(휴리스틱).
  - allowed_new_characters 초과 새 고유명 미등장(느슨한 휴리스틱, 경고 수준).
  - 길이 target ± 범위.
- mock provider로 무네트워크 단위 테스트. 실 API smoke는 수동(키), 상한(≤3 calls, ≤$2) — 본문은 길어 비용↑이라 보수적.
- **smoke test report에 본문 원문 미저장**(요청 3): 작품 본문은 길고 저작물 → report엔 **char_count·한글비율·길이판정·provider/model·cost·latency·pass/fail + hash/짧은 snippet(최대 ~1줄)만**. 전체 body_text·프롬프트·키 미기록.

## 8. 비용 / latency 기록 (요청 8)

- costLedger 재사용, `phase="later_writer"`. provider/model/토큰/비용/ price_status(verified만 계산). placeholder 미사용.
- llmLog `is_first_request` + latency. 본문은 출력 토큰 큼 → cost 표시(WorkCostPanel 확장: 설계 + 본문 누적, "전체 작품 비용" 방향).

## 9. 테스트 계획 (요청 9)

- [ ] typecheck/build/lint/doc-lang.
- [ ] unit(무네트워크, mock provider): WriterContract 조립, firewall no-leak(assertNoPrivateLeak), EpisodeDraft zod 검증, 실패→재시도→status=failed(미저장), 비한국어/빈출력→failed, provider_unavailable(Gemini 선택) 409.
- [ ] Writer fixture canary(mock): 한국어 휴리스틱·길이·새인물 휴리스틱.
- [ ] 실 API smoke(소유주 수동, ≤3 calls/≤$2): OpenAI·Claude 각 1회 회차 생성 확인, 결과 test report 기록(키·원문 미기록).
- [ ] secret scan.

## 10. rollback 계획 (요청 10)

- Writer UI/엔드포인트 **기능 플래그/라우트 제거**로 비활성(설계 단계 영향 없음).
- `EpisodeDraft`는 **별도 파일 저장**(WorkRecord 스키마 무변경) → 마이그레이션 위험 없음. 커밋 revert로 원복.
- provider 문제 시 기존 `user_selectable=false`/`status=disabled` 1줄(3C 메커니즘).

## 11. 범위

| 만든다 (Phase 4) | 안 만든다(후속) |
|---|---|
| `/api/write` + WriterContract firewall + Writer LLM 호출(OpenAI/Claude) | Gemini api_error 조사 / DeepSeek live |
| EpisodeDraft 스키마 + 회차별 저장 | Creative Review / Immersion Gates(10축) Phase 5 |
| 한국어 본문 + micro-detail 규칙(프롬프트) | NMK Event Ledger 커밋, 멀티회차 자동 연재 |
| 재시도/실패정책, cost/latency, fixture canary | Director 자동 repair plan |
| UI 회차 생성/검토 화면 | 사전렌더 캐시 |

## 12. 아키텍처

```text
[브라우저] preflight/lock 통과 작품
  packForWriter(work) -> writer-safe WriterContract (private 제거, assertNoPrivateLeak)
  POST /api/write {contract, options:{provider,quality_pref}}
        -> 서버 inputFirewall(public-only 재검증)
        -> modelRouter(provider allowlist; user_selectable만) -> {provider,model}
        -> writerAdapter(=기존 provider adapter 재사용) 호출(한국어 system, withTimeout)
        -> 출력 검증(비어있음/한국어/firewall) -> 무효면 재시도(최대2) -> 실패 status
        -> costLedger(later_writer) / llmLog
  <- EpisodeDraft(draft|failed) + cost
  본문 검토(저장/재생성) -> 저장 시 data/works/<id>/episodes/<episode_id>.json
```

## 13. 구현 순서

1. `EpisodeDraft` zod 스키마 + episode 저장(StoreAdapter 확장 or episodes 경로).
2. `src/core/writer/writerContract.ts`(packForWriter 기반 조립) + firewall 재검증.
3. `server/writer/`(writePrompt 한국어/micro-detail 규칙, 출력 검증기, 재시도/실패) — provider adapter 재사용.
4. `server/index.ts` `POST /api/write`(provider allowlist, provider_unavailable, firewall, cost).
5. 프론트: 회차 생성/검토 UI + provider 드롭다운(user_selectable만) + WorkCostPanel 확장.
6. Writer fixture canary(mock) + unit 테스트.
7. typecheck/build/lint/test → 헌법 §9 커밋. 실 smoke는 수동(키) → test report.
8. docs(architecture/schemas/state/testing) 갱신(English).

## 14. 보안 체크

- [ ] private/secret firewall 유지(packForWriter + assertNoPrivateLeak + 서버 zod strip).
- [ ] 키 서버 env만, 로그·결과·costLedger 미기록. provider_unavailable(조용한 대체 금지).
- [ ] 사용 가능 provider = user_selectable만(OpenAI/Claude). Gemini/DeepSeek 선택 불가.
- [ ] 실패 시 가짜 본문 미생성·미저장.

## 15. 참고

- OpenAI/Claude: 기존 3C verified(모델/가격). 한국어·길이는 프롬프트로 제어.
- 본문 길이/구조 게이트(정교화)는 Phase 5(Immersion Gates).

## 16. 승인 체크리스트

- [ ] Writer 입력 = writer-safe WriterContract(Episode Contract/Blueprint/Authorial Intent 최소), private 미포함.
- [ ] 사용 provider = OpenAI/Claude(user_selectable)만, Gemini/DeepSeek 선택 불가. provider_unavailable 유지.
- [ ] EpisodeDraft 스키마(status draft|failed + **commit_status generated|user_saved|discarded**, 한국어 body, cost) + 회차별 저장(WorkRecord 무변경).
- [ ] **저장 분리**: 생성 직후 draft는 임시(미영속), **사용자 "저장" 클릭 시에만 committed(user_saved)**, failed는 절대 미저장.
- [ ] **created_at = 서버 ISO 주입**, 테스트는 고정 clock 주입.
- [ ] 한국어 기본 + micro-detail 허용/금지 규칙 + **non_korean 휴리스틱(한글 비율<임계, 소량 외국어 허용)** 명시.
- [ ] firewall(packForWriter/assertNoPrivateLeak) 유지.
- [ ] 실패=가짜 본문 금지, 재시도(≤2) 후 status=failed·미저장.
- [ ] fixture canary(mock) + 실 smoke(≤3 calls/≤$2 수동), **report에 본문 원문 미저장**(hash/snippet/metadata만).
- [ ] cost(later_writer)/latency 기록.
- [ ] 테스트/ rollback(별도 저장·기능 플래그)·추적 주석·헌법 §9·아카이브.

## 17. 승인 요청

`APPROVE: proceed` / 수정 `REVISE: ...` / 거절 `REJECT: ...`

> Gemini api_error 조사·DeepSeek live는 진행하지 않습니다(후속). 승인 시 구현 후, 실 본문 smoke는 키로 실행(또는 .env로 에이전트 실행)해 OpenAI/Claude 각 1회 확인합니다.
