# 제안서: Phase 3 Implementation — Minimal Seed + Agent Auto-Expansion (Mixed-Initiative)

## 한눈에 보는 요약 (초보용)

사용자는 **딱 필요한 것만** 적습니다 — 제목·장르·분위기·배경·인물 몇 명(이름/역할/성별/한 줄 성격)·작품 길이. 나머지(인물 과거·비밀·관계·주제·복선)는 **시스템이 초안을 자동으로 만들어 줍니다.** 사용자는 그 초안을 보고 **마음에 드는 것만 남기고 고칩니다.**

작품 길이는 어려운 숫자 대신 **단편 / 중편 / 장편 / 시리즈** 중 하나만 고르면 됩니다. 회차 수·글자 수는 자동으로 채워지고, 고른 길이와 실제 분량이 어긋나면 **쉬운 말로 알려주고 버튼으로 맞춰** 줍니다.

> **레고 비유:** 사용자가 "레고 상자 + 주인공 이름"만 주면, 시스템이 일단 **성 모양 초안**을 만들어 줍니다. 사용자는 마음에 드는 블록만 남기고 바꿉니다. (이번 Phase 3A의 초안 생성기는 똑똑한 AI 작가가 아니라 **규칙 기반 자동 초안 생성기**입니다 — §4.)

**화면 예시:**
```text
[새 작품] 1.기본  2.인물  3.길이                       (1/3)
 장르 [무협 v]  분위기 [비장 v]   (← 장르 고르면 분위기 자동 추천)
 배경 [칼과 의리의 난세...]
 작품 길이:  ( ) 단편   ( ) 중편   (•) 장편   ( ) 시리즈
   "장편 = 여러 사건과 인물 변화가 쌓이는 긴 이야기"
 [예시에서 시작]  [다음]
 ─ 입력 직후 미리보기(즉시) ─
   로그라인 제안: "복수를 좇던 검객이..."   인물 한 줄 3개 제안
```

---

## 0. 위치

Phase 1(시드 저장)·Phase 2(Editorial Room 결정론 검수·잠금) 위에 올림. 설계 전문: `docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md`.

> 로드맵 재조정: 원래 Phase 3는 "회차 루프"였으나, 사장님 요청대로 **"최소 시드 + 자동 확장 + 길이 자동 맞춤"**을 먼저. 회차 본문 생성(Writer)은 Phase 4 유지.

## 1. 목적

초기 세팅이 길면 사용자가 루즈해진다. 그래서 **입력은 최소**, **나머지는 시스템이 초안 생성**, 사용자는 **검토·수정**(mixed-initiative). 또한 고른 작품 길이와 실제 분량이 어긋나지 않게 **자동 맞춤**.

## 2. 사용자가 입력하는 최소 시드

| 항목 | 설명 | 필수 |
|---|---|---|
| 제목 | 작품명 | 선택 |
| 장르 / 분위기 | 장르 고르면 분위기·시점 자동 추천(smart default) | 필수 |
| 배경 | 한두 문장 | 필수 |
| 인물 1~N | **이름 · 역할 · 성별 · 간단 성격(한 줄)** | 필수(최소 1) |
| 세계 규칙 | 절대 금지/일반 몇 개 | **선택**(접힘, progressive disclosure) |
| 작품 길이 | **단편/중편/장편/시리즈 버튼 1개** (회차수·글자수는 자동) | 필수 |

**복잡한 숫자 필드는 기본 숨김.** 고급 설정에서만 회차 수·회차 길이 직접 수정.

## 3. 작품 길이 자동 맞춤 (Scale Consistency Guard = 쉬운 UX)

### 3.1 사용자 화면 (쉬운 말 + 버튼만)

길이는 4개 중 하나만 고름:
- **단편** — 짧게 끝나는 이야기
- **중편** — 한 가지 큰 사건을 충분히 다루는 이야기
- **장편** — 여러 사건과 인물 변화가 쌓이는 긴 이야기
- **시리즈** — 여러 아크로 이어지는 큰 이야기

고른 길이와 실제 회차·글자 수가 어긋나면 **쉬운 문장 + 추천 버튼**으로 안내:
- 장편 골랐는데 3화 × 1,000자 → "지금 설정은 장편보다는 단편에 가까워요." `[장편에 맞게 늘리기] [단편으로 바꾸기] [이대로 진행]`
- 단편 골랐는데 80화 × 5,000자 → "지금 설정은 단편보다는 장편/시리즈에 가까워요." `[장편/시리즈로 바꾸기] [분량 줄이기] [이대로 진행]`
- 일부러 예외 → "특별한 형식으로 진행" + 간단 이유 선택/입력(예: "짧은 장편 실험", "긴 단편 연재", "사용자 의도").

### 3.2 내부 계산 (사용자에게 필드명 노출 안 함)

```text
declared_scale        // 사용자가 고른 규모
target_episodes       // 목표 회차 수 (기본값 자동)
episode_length        // 회차당 글자 수 (기본 5000)
episode_length_unit   // "ko_chars"
planned_total_length  // target_episodes x episode_length
effective_scale       // 실제 계산된 규모(회차 수 밴드 기준)
scale_consistency     // ok | warn | blocking_warn
scale_override_reason // 예외 선택 시 사용자 이유
```

- **이 필드명은 화면에 절대 안 보임.** 화면엔 쉬운 안내 문장·버튼만.
- 사용자가 "이대로 진행/특별 형식"을 고르면 `scale_override_reason` 저장.
- **Blueprint·Gates·Expander는 declared_scale이 아니라 `effective_scale` 기준으로 동작**(고른 라벨이 실제와 다를 때 실제를 따름).

### 3.3 AgentScribe 초기 기본값 (※ 문학 기준 아님, 조정 가능)

전통 문학상은 **단어 수**로 나누지만(SFWA Nebula 등), 한국 웹소설은 **회차 수 × 회차당 글자 수**가 중요. AgentScribe는 회차 기준으로 계산. 회차당 기본 **5,000자**(고급 설정에서 조정).

| 규모 | 회차 수 | 대략 글자 | 성격 |
|---|---|---|---|
| 단편 | 1~9화 | ~5천~4.5만 | 하나의 사건/감정 변화 중심 |
| 중편 | 10~30화 | ~5만~15만 | 뚜렷한 아크 1개 |
| 장편 | 31~120화 | ~15.5만~60만 | 복선·관계 변화·중후반 반전 |
| 시리즈 | 121화+ 또는 여러 arc | ~60만+ | 1부/2부·여러 지역/적·세대 변화 |

> 출처(§11): SFWA Nebula(단어 수 기준 — 참고용), 한국문학번역원(웹소설 ≈ 5,000자 1화), 문피아(3화 ≈ 15,000자 → 1화 ≈ 5,000자). **이 값은 AgentScribe 초기 운영 기본값일 뿐, 나중에 조정 가능.**

## 4. 자동 초안 생성 — Phase 3A는 "규칙 기반 초안 생성기"

**3A는 LLM이 없습니다.** 그러니 "진짜 똑똑한 AI 작가"가 아니라 **규칙 기반 자동 설계 초안 생성기**입니다.

예: 사용자가 "무협 · 복수극 · 주인공 A는 냉정함"만 넣으면, 시스템이 임시로 **A의 과거 후보 · 조력자 후보 · 갈등 관계 후보 · 초반 복선 후보**를 만들어 줍니다. 사용자는 이를 **수락/수정/삭제**합니다.

> 레고 비유(재확인): 상자 + 주인공 이름만 주면 시스템이 **성 모양 초안**을 깔아주고, 사용자는 마음에 드는 블록만 남깁니다. 진짜 정교한 성(LLM 품질)은 **3B(서버+LLM)**에서.

## 5. 핵심 흐름

```text
[최소 시드 입력]  (smart default / 예시 템플릿 / progressive disclosure / Live Preview)
  → [작품 길이 자동 맞춤 §3]
  → [Magic 초안 만들기]: 규칙 기반 Expander가
       Character Bible(과거/비밀 후보) · Cast · Relationship · Theme · Foreshadow · 아크 골격 생성
  → [Editorial Room 검토(Phase 2)]: 각 항목 수락/수정/삭제 (mixed-initiative)
  → [Candidate Gates + Schema Canary] → [Lock]   ※ effective_scale 기준
```

## 6. Mixed-Initiative 원칙 (연구 방향 §11)

AI 입력 과잉은 작가의 관여감을 낮춘다는 연구 방향(Beyond Prompts) 참고:
- 생성물은 **전부 편집 가능 + 수락/거절**. 사용자가 최종 결정자.
- 생성물에 **provenance=`agent_preflight`** 표시("AI 제안" 가시화).
- 사용자가 적은 시드(Canonical)는 **에이전트가 못 덮어씀**(firewall/불변).

## 7. 구현 단계 — 3A(이번 승인) / 3B(서버·LLM, 별도 go)

LLM key는 프론트에 절대 노출 금지 → 실 LLM은 서버 필요. 안전·MVP 위해 분리:

- **3A (이번 범위, 서버 없음):** `ExpanderAdapter` 인터페이스 + **결정론 `deterministicExpander`**(규칙/아키타입) + 최소 시드 UI(성별·성격·세계규칙·smart default·예시 템플릿·progressive disclosure·Live Preview) + 길이 자동 맞춤 + Editorial Room mixed-initiative 편집.
- **3B (별도 승인):** Node 서버 `model_router`(**key는 서버 env/secret만**) + LLM Expander로 교체(인터페이스 동일 → 3A 재사용) + 호출 관측(key 미기록) + Prompt Firewall. 백엔드 추가는 보안·구조 변화라 별도 제안·승인.

## 8. 스키마 변경 (최소, 하위호환)

- `CharacterPublicSeed`에 `gender`, `personality_brief` 추가.
- 시드/Canonical에 `world_rules: WorldRule[]` 추가.
- **ScaleCheck**(내부): declared_scale·target_episodes·episode_length·episode_length_unit·planned_total_length·effective_scale·scale_consistency·scale_override_reason.
- `WorkRecord` 0.2.0 → 0.3.0 + `migrateWork` 확장(기본값 채움).
- Expander 출력은 기존 Phase 2 스키마 재사용.

## 9. 폴더·모듈 (신규/확장)

```text
src/core/
  scale/ scaleCheck.ts        // declared vs effective, consistency, defaults
  expand/ ExpanderAdapter.ts  deterministicExpander.ts
  schemas/ character.ts(gender,personality_brief) worldRule.ts scaleCheck.ts index(0.3.0)
src/ui/
  NewWorkWizard.tsx           // 최소 시드 + 길이 버튼 + smart default + 템플릿 + Live Preview
  ScaleGuide.tsx              // 길이 안내 + 어긋남 알림 버튼
  ExpandReview.tsx            // 초안 수락/수정/삭제
tests/
  scaleCheck.test.ts  expander.test.ts  migration_0_3.test.ts
```

## 10. 예상 부작용

- 3A 초안은 **품질 거칢**(규칙 수준). 진짜 풍부함은 3B(LLM).
- 스키마 0.2.0→0.3.0 마이그레이션 필요(테스트 포함).
- 길이 자동 맞춤이 잘못 추천할 수 있음 → "이대로 진행/특별 형식"으로 항상 사용자 우선.
- 3B는 백엔드 추가(보안·배포) → 별도 승인.

## 11. 참고 문헌 (검증된 방향 vs 참고 — 수치 단언 안 함)

검증된 방향(출처 확인):
- **Mixed-Initiative / Beyond Prompts** arXiv:2305.07465 — AI 과잉이 관여감↓, 균형 필요. https://arxiv.org/abs/2305.07465
- **Shaping Human-AI Collaboration (Scaffolding)** arXiv:2402.11723 — https://arxiv.org/abs/2402.11723
- **Sudowrite Story Bible** — 구조화 입력이 AI에 자동 투입되는 가이드형 설계 참고. https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/what-is-story-bible/jmWepHcQdJetNrE991fjJC

규모 기준(참고 방향, AgentScribe 기본값 산정 근거):
- SFWA Nebula Rules(단어 수 구분, 문학상 기준 — 직접 적용 아님) — https://nebulas.sfwa.org/about-the-nebulas/nebula-rules/
- 한국문학번역원 웹소설 자료(≈5,000자 1화) — https://www.ltikorea.or.kr/upload/dataevent/20230227081543996388.pdf
- 문피아 아카데미 모집(3화 ≈ 15,000자) — https://www.newswire.co.kr/newsRead.php?no=998925
- Writer's Digest word count guide — https://www.writersdigest.com/publishing/novel-and-short-story-word-counts

참고(수치 단언 제거): 온보딩 UX(필드 줄이기·smart default·progressive disclosure·예시로 빈 화면 회피)는 일반 UX 통설로 **방향만** 차용. 특정 이탈률 수치는 출처별 상이하여 제안서에서 단언하지 않음.

## 12. 승인 체크리스트 (이번 = 3A)

- [ ] 최소 시드 = 제목(선택)/장르/분위기/배경/인물(이름·역할·성별·간단성격)/세계규칙(선택)/작품 길이.
- [ ] 나머지(과거·비밀·관계·주제·복선·아크)는 **규칙 기반 자동 초안**, 사용자 **수락/수정/삭제**(mixed-initiative).
- [ ] 사용자는 작품 길이를 **단편/중편/장편/시리즈** 중 하나로 먼저 고른다.
- [ ] 회차 수·회차 길이는 **기본값 자동**, 고급 설정에서만 수정.
- [ ] 내부적으로 `planned_total_length`·`effective_scale` 계산하되, **복잡한 내부 필드명은 사용자에 미노출.**
- [ ] 고른 길이와 실제 회차·글자 수가 어긋나면 **쉬운 문장 + 추천 버튼**으로 안내.
- [ ] Blueprint/Gates/Expander는 필요 시 declared_scale보다 **effective_scale** 기준.
- [ ] Phase 3A는 **LLM 없는 규칙 기반 초안 생성기**임을 사용자에게 쉽게 설명.
- [ ] 스키마 0.3.0(gender·personality_brief·world_rules·ScaleCheck) + 마이그레이션.
- [ ] **3B(LLM+서버·key 서버보관)는 별도 승인**으로 분리.
- [ ] 제안서는 **초보자도 이해 가능한 한국어 요약 + 실제 화면 예시** 포함(이 제안서 상단 반영).
- [ ] **CLAUDE.md §2 Developer-facing 규칙 보강**(아래 §12.1)을 승인 시 함께 반영.
- [ ] agent-facing 코드/문서 English(doc-lang guard), 추적 주석, 헌법 §9 워크플로. 승인안 아카이브.

### 12.1 CLAUDE.md에 추가할 규칙 (English, 승인 시 §2에 삽입)

```md
- Write Korean proposals for a nontechnical owner: elementary-friendly, plain, warm, concrete.
- Explain jargon on first use with an AgentScribe or publishing-house example.
- Each Korean proposal must open with a short elementary-friendly summary and a concrete
  screen/workflow example before any detailed technical section.
```

## 13. 승인 요청

`APPROVE: proceed` (=3A + CLAUDE.md §2 규칙 보강) / 수정 `REVISE: ...` / 거절 `REJECT: ...`
