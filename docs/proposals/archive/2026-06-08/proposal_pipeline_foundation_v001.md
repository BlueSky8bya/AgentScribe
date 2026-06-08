# 제안서: Pipeline Foundation v001 — 몰입 보존형 자동 장편 생성 파이프라인

## 0. 이 제안서의 위치

직전 초안들은 (1) 저수준 계약 → (2) 전체 파이프라인 → (3) 일관성 보존 메모리 순으로 다듬어졌습니다. 이번 수정은 프레임을 **"일관성 보존"에서 "몰입 보존(immersion-preserving)"으로 격상**하고, 운영에 필요한 **실패 정책·비용 예산·관측/프로파일링**까지 설계에 포함합니다.

- 이번 범위: 시드 입력 → 에이전트 협업 → 최종화 완결까지의 흐름·역할·메모리·게이트·스케일·관측 설계.
- **구현 코드는 만들지 않습니다.** 문서(설계) 골격까지만.
- FlowScribe·공개 논문은 **개념만 참고**, 코드 복사 없음. AgentScribe 어휘로 재설계.
- 계승: 소지품(인벤토리) 추적 안 함. 서사 메모리는 Narrative Memory Kernel(7컴포넌트) 유지.
- 문서 전체 한국어 UTF-8(BOM 없음).

### 0.1 헌법 정합성 메모 (승인 후 구현 시 준수)

이 제안서는 설계 문서이며, 승인 후 실제 구현은 `CLAUDE.md`(헌법)를 따른다:

- **언어 정책(헌법 §2):** agent-facing prompts·skills는 **concise English**로 작성한다. 개발자용 보고·제안서는 한국어 유지. 작품 본문은 한국어 기본(§8).
- **라우팅(헌법 §5):** 이 제안서의 세부 내용은 헌법에 담지 않고 해당 문서로 라우팅한다 —
  - 아키텍처·파이프라인·NMK·게이트 흐름 → `docs/architecture.md`
  - 모든 스키마(§10.2: Fixture·Telemetry·Craft·Character/Cast·Firewall 등) → `docs/schemas.md`
  - 게이트·픽스처·캐너리·품질 기준 → `docs/testing.md`
  - 에이전트 역할·프롬프트 → 각 agent skill 문서(`src/agents/*/＊_skill.md`, `src/python_engine/qa/qa_skill.md`)
- **추적 주석(헌법 §3.1):** 이 제안서로 생기는 **모든 코드 변경**에는 `[PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §<섹션>] <이유>` 형식의 traceability comment를 붙인다(언어별 주석 기호, 신규 파일은 헤더 블록).
- **변경 절차(헌법 §3):** 각 Phase 구현은 별도 제안서·승인을 거친다. 문서 먼저 갱신 후 코드(DOC BEFORE CODE).

## 1. 도입 목적

목표는 **"사람이 거의 개입하지 않아도, 독자 몰입을 끝까지 지키며 한 편(또는 시리즈)을 완결하는 자동 생성 시스템"** 입니다.

장편으로 갈수록 무너지는 것은 사실 정합성만이 아닙니다. 감정선이 끊기고, 같은 사건이 반복되고, 작가 의도(톤·시점)가 흐려지고, 한국어 본문에 까닭 없는 외국어가 섞이고, 본문이 장면 없이 줄거리 요약처럼 밋밋해집니다. 이 모두가 **몰입 붕괴**입니다.

목적: 몰입 붕괴 요인을 **다축 게이트**로 막고, 길이(단편~시리즈)에 따라 **같은 아키텍처를 스케일 조절**하며, **비용은 캐스케이드·예산으로 통제**하고, 운영 중 **무엇이 느리고 어디서 실패하는지 관측**하는 파이프라인을 설계합니다.

## 2. 전체 파이프라인 (한눈에)

```text
[사용자]                                                              [완결]
   │                                                                    ▲
   ▼                                                                    │
① World Seed 입력(UI): 제목·장르·배경·인물·세계규칙·시점·분량·Scale     │
   ▼                                                                    │
② Seed 저장 → NMK Canonical Store + seed_settings                       │
   ▼                                                                    │
②a Authorial Intent Bible (§3.3): 무엇을·왜·어떤 정서·여백 — 작가 의도  │
   ▼                                                                    │
②b Narrative Shape Mode 선택 (§3.4): 갈등호/기승전결/미스터리/여행귀환/일상축적
   ▼                                                                    │
②b' Craft Trait Selection (§3.4b): 작가 모방 아님 — 추상 특성 선택·가중   │
     ※ Phase 1은 stub/방향만, 실제 구현은 후속 Phase                     │
   ▼                                                                    │
②c Editorial Room / Masterpiece Preflight (§3.5)                        │
   │  산출물: Theme Ledger · Series Blueprint · Character Contradiction  │
   │          Ledger · Foreshadow/Reveal Ledger · Episode Card 1..N      │
   │  → Masterpiece Candidate Gates 검수                                 │
   │  → Locked Blueprint(Hard/Soft/Fluid) + Episode Cards 승인(잠금)     │
   │  ※ Preflight 통과·잠금 전에는 Writer 본문 생성 불가                │
   ▼                                                                    │
③ Director: 잠긴 Blueprint/Episode Card로 회차 목표 배정 ──────────────┐ │
   │            ┌─── 회차 루프 (버튼/사전렌더, N=1 … 최종화) ───┐       │ │
   ▼            │                                          │            │ │
④ Planner: 상태추출(결정론) + 비트계획(저temp) + NMK 검색  │            │ │
   ▼            │                                          │            │ │
④b Scene Board / E-konte (§3.5.8): 장면별 첫이미지·감정온도·  │        │ │
   │            숨은목적·대사밀도·침묵/행동/시선·끝이미지·연결 │        │ │
   │            ※ Phase 1은 방향만, 실제 구현은 후속 Phase      │        │ │
   ▼            │                                          │            │ │
⑤ Writer: Episode Contract + Scene Board로 집필(고temp, 한국어) │       │ │
   │   ※ 고위험 회차(반전·결말·인물붕괴·대형회수)만 2~3 초안(§5.6)│      │ │
   ▼            │                                          │            │ │
⑥ Creative Review Room(§5.5): 비평가 캐스케이드(Scale·위험도) │        │ │
   │            │  ※ Phase 1은 방향만, 실제 구현은 후속 Phase           │ │
   ▼            │  Continuity/Emotion/Scene/Theme/Surprise/Language     │ │
   │            │  + Producer/Chief Editor → (고위험: 초안 비교·선택)    │ │
   ▼            │                                          │            │ │
⑦ Immersion Gates(10축: +Pacing +인물/노출, 캐스케이드)→PASS/반려│       │ │
   │   반려→재작업(최대 2회)→실패 시 Director repair plan ──┘            │ │
   ▼            그래도 실패 → 부분 실패 보고서로 정지                   │ │
⑦b Reader Transportation Probe(§6.7): 독자 몰입 사후 평가     │        │ │
   ▼            │  (회차별 자동 + 아크경계/최종화 강화)                  │ │
   │            │  ※ Phase 1은 방향만, 실제 구현은 후속 Phase           │ │
⑧ 커밋: (PASS만) Entity State 갱신 + Event Ledger append + 요약 갱신 ───┘ │
   │   최종화 도달 시 완결 ─────────────────────────────────────────────┘

(전 과정에 관측/프로파일링 계측 — §9, 플래그로 on/off)
```

## 3. ① 초기 세계관 시드 (World Seed)

### 3.1 최소 입력 항목

| 항목 | 설명 | 필수 |
|---|---|---|
| 제목 | 작품명 | 선택 |
| 장르 / 분위기 | 예: 무협 / 비장 | 필수 |
| 배경 | 세계관 한두 단락 | 필수 |
| 핵심 인물 1~N | 이름 + 한 줄 성격 + 역할 | 필수(최소 1) |
| 세계 규칙 | 절대 금지 / 일반 규칙 | 선택 |
| 시점(POV) | 1인칭 주인공 / 3인칭 관찰자 / 전지적 등 | 필수 |
| 분량 + **Scale Mode** | 단편 / 중편 / 장편 / 시리즈 (§7) | 필수 |

> 입력값 = NMK **Canonical Store(불변)** + `seed_settings.json`. 에이전트 수정 금지.

### 3.2 입력 UI (텍스트 스켈레톤)

```text
┌─ AgentScribe · 새 작품 만들기 ──────────────────────┐
│  [1.기본]  2.인물   3.규칙   4.분량·Scale   (1/4)    │
│  제목   [____________]                               │
│  장르   [무협 ▼]   분위기 [비장 ▼]   시점 [3인칭 ▼]  │
│  배경   [__________________________________]         │
│                                       [다음 →]       │
└──────────────────────────────────────────────────────┘
Step4:  Scale [장편 ▼]  목표 화수 [50]  회차 길이 [2000자 ▼]
        → [검토] → [작품 시작 ▶]
```

> 스택 Vite+TS(헌법 SEED). 실제 폼·검증은 후속 Phase.

## 3.3 Authorial Intent Bible (작가 의도 성서) — Seed 이후, Blueprint 이전

일본 장편/애니 제작실은 설계 전에 **"이 작품으로 무엇을 남길 것인가"** 를 먼저 못 박습니다. World Seed가 "무엇을 쓰나(소재)"라면, Authorial Intent Bible은 **"왜·어떤 정서로 쓰나(의도)"** 입니다. 이후 모든 설계·검수의 기준선.

| 항목 | 내용 |
|---|---|
| **남길 감각** | 작품이 독자에게 끝내 남길 감각·느낌 한 줄 |
| **왜 이 이야기인가** | 이 이야기를 굳이 해야 하는 이유 |
| **닮고 싶은 정서** | 지향하는 정서·레퍼런스 결 |
| **피해야 할 클리셰** | 절대 빠지지 않을 상투·전개 |
| **마지막 이미지** | 끝에 남길 최종 장면 이미지 |
| **말하지 않을 것 / 여백** | 의도적으로 설명 않고 비울 영역 |

- Canonical Store 옆에 **불변 의도 기준**으로 저장(시드급, 에이전트 수정 금지).
- Masterpiece Candidate Gates·Theme Critic·Creative Review Room이 이 Bible을 기준으로 판정.
- 미구현 — 포맷 PENDING.

## 3.4 Narrative Shape Mode (서사 형태 모드)

작품이 어떤 **이야기 형태**로 흐르는지 1개 선택(혼합 가능, PENDING). 이 모드가 Series Blueprint 아크 구조와 Episode Card 배치를 좌우합니다.

| 모드 | 형태 | Series Blueprint 영향 | Episode Card 영향 |
|---|---|---|---|
| **conflict_arc** | 갈등 상승→절정→해소 | 갈등 고조 곡선 중심 아크맵 | 회차마다 갈등 단계·고조 비트 |
| **kishotenketsu** | 기·승·전·결(갈등 없이 전환) | 4단 전환 구조, '전(轉)'에 반전 배치 | 전환점 회차에 시점/국면 변화 |
| **mystery_reveal** | 수수께끼→단서→공개 | Reveal Schedule이 아크 주도 | 단서 심기·공개 회차 명시 |
| **journey_return** | 떠남→시련→귀환(성장) | 여정 단계로 아크 분할 | 회차=여정 구간, 귀환 시 변화 대비 |
| **slice_of_life_accumulation** | 일상 누적→정서 축적 | 큰 갈등 대신 감정 누적 곡선 | 회차마다 작은 정서 보상, 누적 효과 |

- 선택 모드는 Pacing Gate(§6.1 9번)·Emotional Rhythm Map 기준에 반영(예: slice_of_life는 사건 밀도 낮아도 정상, conflict_arc는 정체 시 reject).
- Masterpiece Candidate Gate(결말-초반 연결성)도 모드별 기준 적용.

## 3.4b Craft Trait Library / Authorial Virtue Matrix (창작 특성 라이브러리)

> 위치: **Authorial Intent Bible 이후, Series Blueprint 이전.** 갱신된 전체 흐름:
> `World Seed → Authorial Intent Bible → Narrative Shape Mode → Craft Trait Selection → Series Blueprint/Theme Ledger/Character Contradiction Ledger/Episode Cards → Scene Board → Writer → Creative Review Room → Immersion Gates → NMK Commit`

특정 작가를 모방하지 않습니다. 대신 여러 작가·작품론·서사 이론에서 **관찰되는 창작상의 장점을 추상화**한 특성 라이브러리를 만들고, World Seed·Authorial Intent·Shape Mode에 맞춰 **필요한 특성만 선택·가중·조합**합니다.

### 3.4b.1 작가 모방 금지 원칙 (필수)

- 특정 생존 작가·유명 작가의 문체를 **그대로 흉내 내지 않는다.**
- "OO 작가처럼 써라" 금지. "복선 회수 밀도·장면 여백·인물 모순·생활감·정서 누적·대사 절제" 같은 **추상 특성으로만** 다룬다.
- 작가명은 내부 참고 메타데이터로도 최소화/선택사항. **실제 생성 지시에 작가명이 직접 들어가지 않는다.**
- Writer에 전달되는 것은 작가 이름이 아니라 **trait id·trait 설명·적용 강도·적용 금지 조건**뿐.
- 특정 작품의 고유 설정·문장·장면·캐릭터·문체 패턴을 **복제하지 않는다.**

### 3.4b.2 Craft Trait 최소 필드

```json
{
  "trait_id": "trait_scene_negative_space",
  "trait_name": "장면의 여백",
  "category": "scene | character | plot | theme | prose | pacing | world | dialogue | suspense | ending",
  "abstract_principle": "모든 것을 설명하지 않고 이미지·행동·침묵으로 감정을 남긴다.",
  "best_for": ["slice_of_life_accumulation", "kishotenketsu", "journey_return"],
  "risk_if_overused": ["모호함", "전개 정체", "감정 전달 실패"],
  "conflicts_with": ["trait_fast_plot_velocity", "trait_high_exposition_density"],
  "supports": ["trait_emotional_aftertaste", "trait_visual_scene_memory"],
  "application_targets": ["Authorial Intent Bible","Theme Ledger","Episode Card","Scene Board","Writer","Creative Review Room"],
  "strength_range": "0.0~1.0",
  "default_strength_by_scale": { "short": 0.4, "medium": 0.5, "long": 0.7, "series": 0.7 },
  "positive_signals": ["침묵/행동/이미지로 감정 전달", "설명 없이 여운"],
  "negative_signals": ["독자가 상황 이해 못 함", "중요 정보까지 숨겨 혼란"],
  "gate_links": ["scene_quality", "pacing", "theme_fidelity"],
  "critic_links": ["Scene Critic", "Emotion Critic", "Theme Critic"],
  "source_basis": "작품론/서사이론/공개 인터뷰에서 추상화한 참고 방향",
  "copyright_safety": "no_style_imitation | no_text_reuse | abstract_trait_only",

  "source_type": "narrative_theory | craft_book | public_interview | internal_observation | user_defined",
  "source_refs": ["url_or_bibliographic_ref"],
  "evidence_level": "verified_source | plausible_craft_direction | experimental",
  "style_safety_level": "safe_abstract_trait | caution_style_adjacent | blocked_direct_imitation",
  "allowed_in_writer_prompt": true,
  "requires_human_review": false
}
```

- **provenance/evidence/safety**: 각 trait가 어디서 온 추상화인지(`source_type`·`source_refs`), 근거 강도(`evidence_level`), 생성 지시에 써도 안전한지(`style_safety_level`·`allowed_in_writer_prompt`·`requires_human_review`)를 추적. `blocked_direct_imitation`/`caution_style_adjacent`는 Writer 프롬프트 차단 또는 인간 검토 요구.

### 3.4b.3 기본 trait 카테고리 (최소)

| 카테고리 | 예시 특성 |
|---|---|
| **Character** | 인물 모순, 자기기만, 욕망/두려움 대비, 관계 변화 |
| **Plot** | 복선 회수, 반전 준비, 사건 압축, 장기 떡밥 관리 |
| **Scene** | 첫 이미지, 끝 이미지, 침묵, 시선, 감각 앵커, 여백 |
| **Theme** | 중심 질문 반복, 대립 가치 압력, 결말 의미 도착 |
| **Prose/Dialogue** | 대사 절제, 말투 차별화, 설명 절제, 한국어 자연성 |
| **Pacing** | 빠른 전개, 느린 정서 축적, 정보 공개 간격, 휴식 구간 |
| **World** | 생활감 있는 세계, 규칙의 비용, 세계관의 사회적 결과 |
| **Suspense/Mystery** | 정보 비대칭, 오해, 지연 공개, 독자만 아는 정보 |
| **Ending** | 마지막 이미지, 정서적 잔향, 주제 회수 |

### 3.4b.4 Craft Trait Selection 단계

입력: World Seed · Authorial Intent Bible · Narrative Shape Mode · Scale Mode · 장르/분위기 · 목표 독자 경험 · 금지 클리셰 · 비용/속도 예산.

출력:
```json
{
  "selected_traits": [
    { "trait_id": "trait_character_contradiction", "strength": 0.8,
      "reason": "장편 인물 중심 + Authorial Intent가 내면 변화",
      "applies_to": ["Character Contradiction Ledger","Episode Card","Emotion Critic"] }
  ],
  "rejected_traits": [
    { "trait_id": "trait_fast_plot_velocity",
      "reason": "Shape가 slice_of_life_accumulation, 정서 축적 우선" }
  ],
  "trait_conflicts_resolved": [
    { "conflict": ["trait_scene_negative_space","trait_high_exposition_density"],
      "resolution": "설정 공개 회차만 exposition 허용, 일반 장면은 여백 우선" }
  ]
}
```

**Selection Budget** — 좋은 특성을 많이 넣는다고 좋은 글이 아님. 작품별 trait 수·총 강도 제한:
```json
{
  "max_primary_traits": 3,
  "max_secondary_traits": 6,
  "total_strength_budget": 4.0,      // 선택 trait strength 합 상한
  "conflict_penalty": 0.5,           // 충돌 trait 동시 선택 시 예산 차감
  "overuse_decay": "강도 누적 시 한계효용 감소(과용 방지)"
}
```
- 예산 초과 시 낮은 우선순위 trait를 suppressed 처리(§3.4b.6 기록).

### 3.4b.5 Trait 적용 — 산출물별 반영

| 산출물 | trait 반영 |
|---|---|
| Authorial Intent Bible | 정서·여백·금지 클리셰와 정합성 확인 |
| Series Blueprint | 전체 아크에 trait 조합 반영 |
| Theme Ledger | trait가 주제 압력에 주는 영향 기록 |
| Character Contradiction Ledger | 인물 trait 반영 |
| Episode Card | 회차별 trait 목표·적용 강도 |
| Scene Board / E-konte | 장면별 trait 적용 지점 |
| Writer | **작가 이름 아님 — trait 지시만** |
| Creative Review Room | critic이 trait 적용 성공/과용/부족 평가 |
| Immersion Gates | trait 과용으로 몰입 깨지면 warn/reject |
| NMK / Event Ledger | trait가 사건·지식·감정 변화에 영향 시 cross-link |

### 3.4b.6 Craft Decision Log (회차별)

"왜 이런 글이 나왔는지" 추적용. 회차마다 남김:
```json
{
  "episode_id": "ep_001", "run_id": "run_001",
  "selected_traits": [
    { "trait_id": "trait_scene_negative_space", "strength": 0.7,
      "reason": "primary_goal=emotional_turn, 대사보다 침묵 적합" }
  ],
  "rejected_traits": [
    { "trait_id": "trait_fast_plot_velocity", "reason": "이번 회차 정서 축적 우선" }
  ],
  "suppressed_traits": [
    { "trait_id": "trait_high_exposition_density", "reason": "Selection Budget 초과로 보류" }
  ],
  "applied_locations": [
    { "target": "Scene Board", "scene_id": "ep_001_sc_03",
      "application": "closing_image·silence_action_gaze에 적용" },
    { "target": "Writer", "span_ref": "hash/snippet/id",
      "application": "설명 대신 행동으로 감정 전달" }
  ],
  "critic_feedback": [
    { "critic": "Scene Critic", "trait_id": "trait_scene_negative_space",
      "verdict": "pass", "note": "여백 유지·정보 전달 충분" }
  ],
  "gate_links": [
    { "gate_axis": "pacing", "trait_id": "trait_scene_negative_space",
      "verdict": "warn", "reason": "정서 장면 길어져 사건 밀도 저하" }
  ],
  "reader_probe_links": [],
  "cost_impact": { "extra_critic_calls": 1, "estimated_cost": 0.0, "latency_ms": 0 }
}
```
- 미구현 — 스키마는 §10.2에서 선고정.

## 3.5 Editorial Room / Masterpiece Preflight (회차 생성 전 전체 설계)

FlowScribe는 회차를 곧장 생성했습니다. 우리는 **다른 방향**으로 갑니다. 회차 본문을 찍기 전에 **작품 전체 설계도(Series Blueprint)** 를 먼저 만들고, 검수하고, **잠근(lock)** 뒤에야 회차를 생성합니다. 편집실에서 연재 전체 기획을 확정하고 들어가는 방식입니다.

> "명작을 보장한다"고 쓰지 않습니다. 보장은 불가능합니다. 대신 **명작 후보 자격(Masterpiece Candidate)** 을 게이트로 정의해, 그 자격을 못 갖춘 설계로는 집필에 들어가지 않게 합니다.

### 3.5.1 Series Blueprint — 전체 설계 산출물

Preflight에서 아래를 생성합니다(미구현, 포맷 PENDING):

| 산출물 | 내용 |
|---|---|
| **Theme Statement** | 작품이 말하려는 한 문장 주제 |
| **Theme Ledger** | 주제 전개 별도 원장(§3.5.10) |
| **Ending Hypothesis / Final Image** | 결말 가설과 마지막 장면 이미지 |
| **Central Promise** | 독자에게 거는 중심 약속(이 이야기가 줄 것) |
| **Full-Series Arc Map** | 전체 아크 구조(Narrative Shape Mode 반영) |
| **Episode Card 1..N** | 회차별 설계 카드(§3.5.2) |
| **Character Contradiction Ledger** | 인물 모순·욕망·가면 원장(§3.5.9, 구 Character Arc Ledger 확장) |
| **Character Bible** | 주요 인물 설정집(§3.6.1) |
| **Cast Registry** | 전 인물 등록부(§3.6.2) |
| **Relationship Map** | 관계도 + planned_turns(§3.6.3) |
| **Character Reveal Schedule** | 인물 공개 일정(§3.6.4) |
| **Character Creation / Cast Promotion policy summary** | 신규 인물·승격 정책 요약(§3.6.5·§3.6.7) |
| **Foreshadowing / Payoff Ledger** | 떡밥 심기와 회수 대응표 |
| **Mystery / Reveal Schedule** | 미스터리 공개 일정 |
| **Emotional Rhythm Map** | 회차별 감정 상승·휴식 리듬 |
| **World-rule Dependency Map** | 세계 규칙 간 의존·상호작용 지도 |

### 3.5.2 Episode Card 최소 필드

각 회차 카드는 **집필 전** 설계 시점에 확정합니다.

```json
{
  "episode_id": "PENDING",
  "episode_goal": "이 회차가 작품에서 하는 일",
  "reader_experience_goal": "tension | discovery | ...",
  "required_events": ["반드시 일어나야 할 사건"],
  "character_delta": "이 회차로 인물이 어떻게 바뀌나",
  "emotional_turn": "감정 전환점",
  "foreshadowing_plants": ["여기서 심는 떡밥 id"],
  "payoff_events": ["여기서 회수하는 떡밥 id"],
  "reveal_items": ["여기서 공개되는 미스터리"],
  "state_changes": ["Entity State 변경 예정"],
  "forbidden_moves": ["이 회차에서 하면 안 되는 전개"],
  "required_retrieval_events": ["집필 시 반드시 검색돼야 할 과거 evt"]
}
```

> Episode Card(설계 시점 계획) → 회차 생성 시 Episode Contract(§5.2, 런타임 조립)로 전개. `required_retrieval_events`는 Retrieval Canary(§10.1b)의 정답 라벨로도 쓰임.

### 3.5.3 Masterpiece Candidate Gates (설계도 검수, 회차 게이트와 별개)

Series Blueprint를 대상으로 도는 **설계 단계 게이트**입니다(회차 본문 검수인 Immersion Gates와 분리). 최소 14축(인물 설계 포함):

| 축 | pass 기준(요지) |
|---|---|
| 1. 강한 중심 질문/주제 | Theme/Central Promise가 한 문장으로 또렷한가 |
| 2. 결말-초반 연결성 | Ending Hypothesis가 초반 설정·약속과 이어지는가 |
| 3. 인물 욕망/상처/변화 선명도 | Character Contradiction Ledger(§3.5.9)·Character Bible(§3.6.1)에 욕망·상처·자기기만·변화가 명시됐는가 |
| 4. 떡밥-회수 추적 가능성 | 모든 plant가 대응 payoff를 갖는가(고아 떡밥 없음) |
| 5. 회차별 독자 보상 | 모든 Episode Card에 reader_experience_goal이 있는가 |
| 6. 반복/중복 전개 없음 | Episode 간 required_events 중복·정체 없는가 |
| 7. 감정 리듬 상승과 휴식 | Emotional Rhythm Map에 고조만/평탄만 구간이 없는가 |
| 8. 설정 오류 없음 | World-rule Dependency Map에 모순·충돌 없는가 |
| 9. 장면성/재미/긴장 유지 | 카드가 "사건 처리"가 아닌 "체험 목표"를 갖는가 |
| 10. 한국어 문체 자연성(계획 수준) | 톤·시점·언어 정책(§8)이 설계에 반영됐는가 |
| 11. **인물 설계 완비**(§3.6) | core/major 인물마다 Character Bible / core 관계마다 Relationship Map planned_turns / 핵심 비밀·과거마다 Reveal Schedule이 있는가 |
| 12. **초반 공개 절제** | 1화/초반에 과도한 인물 공개가 예정돼 있지 않은가 (Reveal Schedule 분산) |
| 13. **캐스트 규모 적정** | agent_preflight 인물이 너무 많지 않은가(cast_sprawl 예방) |
| 14. **종족 규칙 연결** | 비인간/이종족 인물의 species_rules가 World-rule Dependency Map과 연결됐는가 |

- 캐스케이드(결정론→저가→고가) 동일 적용. fatal 위반(예: 고아 떡밥, 설정 모순, 인물 Bible 누락) → 잠금 불가, 설계 수정.
- "후보 자격"일 뿐 — 통과해도 명작 보장 아님. 미달 설계로 집필 진입 차단이 목적.

### 3.5.4 Locked Series Blueprint + 지연 회차 생성

전체 본문을 처음에 다 생성하지 않습니다. **비용이 크고, 작은 수정도 전체 재생성을 부르기** 때문입니다.

```text
설계 검수(Candidate Gates) → 설계 잠금(Locked Blueprint + Episode Cards 승인)
   → 회차 본문은: (a) 버튼 클릭 시 생성  또는  (b) 사전 렌더 캐시로 준비
```

- **Locked Blueprint**: 승인된 설계도. 회차 생성은 이 잠긴 설계 안에서만.
- 회차 본문은 **지연 생성(lazy)** — 필요할 때 생성하거나 소수 회차만 미리 렌더해 캐시.
- 설계 수정이 필요하면 회차 본문이 아니라 **Blueprint 개정(§3.5.6 버튼)** 으로.
- **Micro-detail 허용 범위:** Locked Blueprint 안에서도 Writer는 설계도와 충돌하지 않는 한 미세 디테일(대사 표현, 감각 묘사, 장면 내 소품, 비핵심 행동)을 자유롭게 추가할 수 있다. 단 Episode Card의 required_events·state_changes·forbidden_moves 등 **핵심 설계는 변경 불가**.

#### Lock 3단계 — Hard / Soft / Fluid Zone

설계의 모든 요소가 같은 강도로 잠기지 않습니다. 3단계로 구분합니다.

| 존 | 의미 | 예 | 변경 방법 |
|---|---|---|---|
| **Hard Lock** | 절대 불가침 | Authorial Intent, Theme Statement, Ending Hypothesis, Central Promise, 세계 절대규칙, 주요 인물 정체 | 변경 불가. 바꾸려면 새 작품 수준 |
| **Soft Lock** | 승인 절차로만 변경 | Episode Card의 required_events·reveal 일정·아크 경계·캐릭터 변화 시점 | `Promote blueprint revision`(§3.5.7) 버튼 → 재검수·재잠금 |
| **Fluid Zone** | Writer 자유 발견 | 대사 표현, 감각 묘사, 장면 소품, 비핵심 행동, 장면 내 미세 연출 | 자유(micro-detail). 게이트만 통과하면 됨 |

- 게이트/비평실은 **Hard/Soft 침범**을 우선 fatal로 본다. Fluid Zone 변경은 게이트 통과면 허용.
- Episode Card 필드별로 어느 존인지 태깅(PENDING).

### 3.5.5 순서 강제

**Preflight 통과·잠금 전에는 Writer가 본문을 쓸 수 없다.** 고정 순서:

```text
설계 생성 → 설계 검수(Candidate Gates) → 설계 잠금 → (그 후에야) 회차 생성
```

Writer 호출은 Locked Blueprint 존재를 전제. 잠금 없으면 회차 생성 진입 자체를 막음.

### 3.5.6 NMK 연결 (설계 원장 ↔ Event Ledger cross-link)

설계 원장은 NMK와 **별도로** 관리하되 회차 생성 시 연결합니다.

- **Foreshadowing Ledger / Character Contradiction Ledger / Reveal Schedule / Theme Ledger** = 설계 차원 원장(Blueprint 소속). Event Ledger와 분리.
- 회차가 실제 생성되면, 그 회차에서 심은 떡밥·회수·공개를 **Event Ledger 사건과 cross-link**:
  - 예: Foreshadowing Ledger의 `fs_003`(떡밥) ↔ 회차 생성 시 만들어진 `evt_041`(실제 심긴 장면).
  - payoff 시점에 `fs_003`의 plant evt와 payoff evt를 연결 → 회수 추적·누락 감사 가능.
- 이로써 "설계상 떡밥"과 "실제 본문 사건"이 묶여, 떡밥 미회수·조기 공개를 탐지.

### 3.5.7 버튼 UX — "검증된 설계도에서 빠르게 회차 보기"

잠긴 설계도 위에서 회차를 빠르게 보는 조작:

| 버튼 | 동작 |
|---|---|
| **Generate next episode** | 다음 회차 1편 생성 |
| **Pre-render next 3 episodes** | 다음 3회차 사전 렌더(캐시) → 체감 속도↑ |
| **Regenerate this episode within locked blueprint** | 설계는 그대로 두고 이 회차만 재생성 |
| **Promote blueprint revision (major flaw only)** | 중대 결함 발견 시에만 설계도 개정으로 승격 |

> 마지막 버튼이 핵심 안전장치 — 사소한 불만으로 설계 전체를 흔들지 않음. 중대 결함일 때만 Blueprint 개정 절차(재검수·재잠금).

### 3.5.8 Scene Board / E-konte Layer (Episode Card ↔ Writer 사이)

일본 애니의 **에콘티(絵コンテ, 그림 콘티)** 처럼, Episode Card(회차 설계)와 Writer(집필) 사이에 **장면 단위 연출판**을 둡니다. Writer는 카드를 바로 산문화하지 않고, 먼저 장면을 콘티로 잡습니다 → 요약문화(§6.1 8번) 방지.

각 Scene(장면) 1칸:

```json
{
  "scene_id": "PENDING",
  "opening_image": "장면 첫 이미지",
  "emotional_temperature": "감정 온도(차가움~뜨거움)",
  "hidden_purpose": "장면의 숨은 목적(표면 사건 너머)",
  "dialogue_density": "대사 밀도(적음~많음)",
  "silence_action_gaze": "침묵 / 행동 / 시선의 배분",
  "sensory_anchor": ["소리","냄새","촉감","빛","거리감 등 몸으로 느끼게 하는 요소"],
  "negative_space": ["일부러 설명하지 않을 것","침묵으로 남길 것"],
  "closing_image": "끝 이미지",
  "transition_emotion": "다음 장면으로 넘기는 감정 연결",
  "scene_character_focus": ["이 장면의 초점 인물"],
  "relationship_beat": "이 장면에서 다룰 관계 변화(rel_id)",
  "reveal_intent": "이 장면 공개 의도(rev_id 또는 없음)",
  "exposition_limit": "설명 허용량(낮음/보통/높음)",
  "allowed_hint_level": "hint | partial | none"
}
```

- **Sensory Anchor**: 장면을 몸으로 느끼게 하는 감각(소리·냄새·촉감·빛·거리감). Writer가 추상 서술 대신 구체 감각으로 쓰게.
- **Negative Space**: 의도적으로 설명 않고 침묵으로 남길 것. **Authorial Intent Bible의 "말하지 않을 것/여백"(§3.3)** 과 직접 연결 → 일본 애니/문학식 여백·정서 잔향을 장면 규칙으로 구현.

- Scene Board는 Episode Card의 beats를 장면으로 분해한 **연출 계층**. Writer는 이 보드대로 집필.
- Scene Critic(§5.5)·Pacing Gate(§6.1 9번)·장면성 축(8번)이 Scene Board를 기준으로 검수.
- Fluid Zone(§3.5.4) — 보드 안 미세 연출은 Writer 자유. 미구현, 포맷 PENDING.

### 3.5.9 Character Contradiction Ledger (구 Character Arc Ledger 확장)

인물을 "욕망·상처·변화"만이 아니라 **모순**으로 깊게 적습니다. 입체적 인물의 핵심은 모순입니다.

| 필드 | 내용 |
|---|---|
| **겉으로 원하는 것** | 인물이 말하는 표면 목표 |
| **진짜 두려워하는 것** | 내면의 공포 |
| **자기 자신에게 하는 거짓말** | 스스로 믿는 자기기만 |
| **가면** | 남에게 보이는 위장 |
| **변하면 잃는 것** | 성장의 대가 |
| **변하지 않으면 잃는 것** | 정체의 대가 |

- Emotion Critic·Theme Critic이 인물 행동이 이 모순과 일관되는지 검수.
- 회차 생성 시 인물 변화는 Event Ledger와 cross-link(§3.5.6).

### 3.5.10 Theme Ledger (주제 별도 원장)

Theme Statement를 한 줄로 두지 않고, **주제가 작품 내내 어떻게 압력으로 작동하는지** 별도 원장으로 추적합니다.

| 필드 | 내용 |
|---|---|
| **중심 질문** | 작품이 던지는 핵심 질문 |
| **대립 가치** | 충돌하는 두 가치(예: 자유 vs 책임) |
| **회차별 주제 압력** | 각 회차가 주제를 어떻게 누르는가 |
| **결말에서 의미 도착** | 결말에서 의미가 어떻게 도달하는가 |

- Theme Critic(§5.5)·Masterpiece Candidate Gate(1·2축)이 이 원장 기준으로 검수.
- Authorial Intent Bible(§3.3)과 정합해야 함.

### 3.5.11 Blueprint Revision Impact Analysis (Soft Lock 변경 영향 분석)

Hard/Soft/Fluid Lock(§3.5.4)은 좋지만, **Soft Lock을 바꿀 때 영향 범위를 자동 계산**해야 합니다. 동적 수정은 영향 관리 없이는 오히려 장편을 흔듭니다(DOME이 딱딱한 outline 한계를 지적하면서도 동적 수정은 위험할 수 있음 — §14 참고 방향).

`Promote blueprint revision`(§3.5.7) 승인 **전에**, 바뀐 요소가 무엇에 영향을 주는지 목록화:

```json
{
  "changed_element": "ep_012.reveal_items += '진범 공개'",
  "impacted": {
    "episode_cards": ["ep_013","ep_020"],
    "foreshadowing_ledger": ["fs_004(조기 공개로 무효 위험)"],
    "reveal_schedule": ["rv_002 순서 재조정 필요"],
    "character_contradiction_ledger": ["charB(가면 붕괴 시점 이동)"],
    "theme_ledger": ["중심질문 압력 곡선 영향"],
    "event_ledger_crosslinks": ["evt_071 ↔ fs_004 재검토"]
  },
  "recheck_scope": ["ep_012~ep_020 재검수", "Masterpiece Candidate Gate 4축(떡밥-회수) 재실행"]
}
```

- 산출물: **"이 변경으로 다시 검수해야 할 범위(recheck_scope)"**. 승인자는 파급을 보고 결정.
- 영향받는 Episode Card·Foreshadowing/Reveal·Character Contradiction·Theme Ledger·Event Ledger cross-link를 전부 나열.
- 미구현 — 영향 그래프 산정 PENDING.

## 3.6 인물 & 캐스트 관리 (Character & Cast Management)

인물을 "본문에 등장한 이름"이 아니라 **설정집·관계도·공개 일정·승격 절차가 있는 장기 자산**으로 관리합니다. 핵심 원칙: **"AI/작가가 아는 설정"과 "독자가 지금 알아야 하는 공개 정보"를 분리** → 초반 설정 폭로·인물 난립을 구조적으로 차단.

### 3.6.1 Character Bible (인물 설정집)

Character Contradiction Ledger(§3.5.9)보다 넓은 인물 설정집. 주요 인물은 집필 전 구조화. 최소 필드(요약):

```json
{
  "character_id": "char_A", "name": "A",
  "species_or_type": "human | beastkin | dragonkin | humanoid | talking_animal | spirit | android | alien | other",
  "role_in_story": "protagonist | ... | minor",
  "importance_level": "core | major | supporting | minor | cameo",
  "introduced_by": "user_seed | agent_preflight | agent_runtime",
  "creation_phase": "seed | preflight | episode_runtime",
  "appearance": { "age_range":"", "visual_markers":[], "body_type_or_form":"", "voice_or_speech_style":"" },
  "personality": { "surface_traits":[], "core_values":[], "temperament":"", "social_mask":"" },
  "mindset": { "worldview":"", "beliefs":[], "biases":[], "decision_rule":"" },
  "backstory": { "summary_private":"작가/시스템만 아는 과거", "trauma_or_wound":"", "formative_events":[], "secrets":[] },
  "character_arc": { "starting_state":"", "desired_growth":"", "failure_mode":"", "end_state_hypothesis":"" },
  "future_story_function": { "planned_conflicts":[], "planned_reveals":[], "planned_relationship_changes":[] },
  "constraints": { "forbidden_uses":["초반 비밀 공개 금지","희화화 금지"], "must_not_know":[], "must_remain_consistent":[] }
}
```
- `backstory.summary_private`·`secrets`는 **작가/시스템만** 아는 정보 → 본문 즉시 공개 금지(§3.6.5 Reveal Schedule로만).

### 3.6.2 Cast Registry (등장인물 등록부) — 인물 난립 방지

모든 인물을 단일 등록부에서 관리. 출처별 우선권:
- **user_seed**: 사용자가 직접 정한 인물. 우선권 최고.
- **agent_preflight**: Preflight에서 설계상 필요해 승인된 인물.
- **agent_runtime**: 회차 중 즉석 등장. **기본값 minor/cameo.**
- runtime 인물은 특별 승인 없이 **핵심 갈등·주요 반전·장기 떡밥의 중심이 될 수 없음.**
- runtime → major↑ 승격은 **Cast Promotion Gate(§3.6.7)** 필요.
- 새 인물 생성 전 **기존 인물로 대체 가능한지 먼저 검사**(§3.6.6).

```json
{ "character_id": "char_vendor_01", "name": "노점상",
  "importance_level": "minor", "introduced_by": "agent_runtime", "episode_introduced": 3,
  "allowed_scope": "scene_local | episode_local | recurring | arc_major | core",
  "promotion_status": "not_allowed | proposed | approved | rejected",
  "reason_for_existence": "장면 기능: 정보 자연 전달",
  "can_affect_main_plot": false, "must_exit_by": "episode_end | arc_end | none" }
```

### 3.6.3 Relationship Map (관계도) — Preflight 필수 산출물

주요 인물 관계도는 Preflight에서 **반드시** 생성.
```json
{ "relationship_id":"rel_A_C", "from":"char_A", "to":"char_C",
  "relationship_type":"ally | rival | mentor | family | enemy | false_ally | traitor_pending | romantic_tension | master_servant | creator_created | species_conflict",
  "initial_state":"신뢰하나 가치관 다름", "hidden_truth":"C는 A의 과거를 앎",
  "power_balance":"A 전투 우위, C 정보 우위",
  "emotional_charge":"guilt | admiration | resentment | dependency | fear | loyalty",
  "planned_turns":[ {"episode_range":"early","change":"동맹"},
                    {"episode_range":"middle","change":"배신 의심"},
                    {"episode_range":"late","change":"진실 공개 후 재정의"} ],
  "forbidden_moves":["1화에서 hidden_truth 공개 금지"] }
```
- Character Bible·Theme Ledger·Episode Card·Scene Board·Event Ledger와 cross-link.
- Emotion/Continuity Critic이 관계 변화 급변 여부 검수.

### 3.6.4 Character Reveal Schedule (인물 공개 일정)

인물 설정을 한 번에 설명하지 않고 **언제 무엇을 공개할지** 관리.
```json
{ "character_id":"char_D",
  "reveal_items":[ {
    "reveal_id":"rev_D_backstory_01",
    "content_private":"D는 과거 왕국을 배신",
    "public_hint":"D가 왕실 문장에 불안",
    "reveal_timing":"middle", "allowed_episode_range":[18,25],
    "reveal_mode":"hint | partial | misdirection | full",
    "audience_knows_before_character":false,
    "linked_events":["evt_past_D_001"], "forbidden_before":18, "payoff_episode":23 } ] }
```
원칙:
- Character Bible의 모든 정보는 Writer에 전달돼도 **본문에 바로 공개하지 않음.**
- Writer는 해당 회차 Episode Contract에 포함된 **reveal_items만** 공개.
- schedule에 없는 과거사 설명·비밀 공개·관계 진실 폭로 → reject/warn.
- 힌트 / 부분 / 오해 / 완전 공개를 구분.

### 3.6.5 Character Creation Gate (신규 인물 검사)

Writer가 인물을 마음대로 늘리지 못하게. 새 인물 등장 전 검사:
1) 기존 인물로 대체 가능한가? 2) 꼭 새 인물이어야 하는가? 3) core/major 서사에 영향? 4) 장면 기능 vs 장기 서사 기능? 5) 장기 기능이면 Preflight/Promotion 승인받았나?

판정:
- 장면 기능만 → **minor/cameo 허용.**
- 장기 갈등·반전·관계 변화 영향 → **승인 없이는 reject.**
- 즉석 인물이 주요 사건을 해결 → **`deus_ex_new_character` reject.**

### 3.6.6 Agent-created Character Policy

- 기본 `importance_level` = minor/cameo.
- 이름·외형·말투는 허용, **장기 서사 중심 기능은 불허.**
- agent_runtime 인물은 Event Ledger에 기록하되 Cast Registry `allowed_scope=episode_local`.
- 반복 등장 → recurring 승격 필요. major/core → Cast Promotion Gate.
- **user_seed·Preflight 승인 인물이 항상 우선.**

### 3.6.7 Cast Promotion Gate (승격 절차)

즉석 인물을 더 중요하게 올릴 때. 필수 질문:
- 기존 주요 인물로 대체 불가한가? Theme Ledger/Central Promise에 기여? Relationship Map에 새 관계 가치? 기존 Episode Card/Reveal/Foreshadow를 얼마나 흔드나? 비용 대비 서사 가치?

통과 시: Character Bible 생성 → Relationship Map 갱신 → Reveal Schedule 생성 → **Blueprint Revision Impact Analysis(§3.5.11)** 수행 → Soft Lock 재검수 후 승인.
실패 시: minor/cameo 유지 또는 퇴장.

### 3.6.8 비인간/이종족/비표준 존재 (공식 지원)

`species_or_type`을 인간에 제한하지 않음: human / beastkin / dragonkin / elf·dwarf / spirit·ghost / talking_animal / monster_companion / android / humanoid / alien / clone / AI_entity / shapeshifter / other.

추가 필드:
```json
{ "species_rules": {
    "biological_traits":["수명","감각","약점"],
    "social_status":"차별/숭배/공존 여부",
    "communication_mode":"언어/정신감응/몸짓/기계신호",
    "ability_limits":["능력의 한계와 비용"],
    "world_rule_dependencies":["세계 규칙과 연결"] } }
```
- **World-rule Dependency Map과 연결.** 능력/종족 특성은 반드시 **비용·한계·사회적 결과**를 가짐.
- 비인간도 Character Contradiction Ledger·Relationship Map 대상.

### 3.6.9 Context Packager / Prompt Firewall (정보 누수 방지)

"AI/작가가 아는 설정"과 "Writer 프롬프트에 들어가도 되는 정보"를 **실제로 분리**합니다. Character Bible 전체를 Writer에 주면 초반 폭로가 일어납니다.

- Character Bible **전체를 Writer에 주지 않음.**
- Writer는 Episode Contract의 `allowed_character_reveals`·`active_relationship_beats`·`allowed_hint_level`만 받음.
- `backstory.summary_private`·`secrets`·`hidden_truth`·`forbidden_character_reveals`는 **기본적으로 Writer 본문 지시에서 제외/redacted.**
- Scene Board·Critic은 필요 시 **"비공개 판단용"으로만** 접근(`critic_only`) — 본문 생성 지시에는 미포함.
- **Prompt Firewall**: Writer 입력 직전, reveal_leak 가능 정보를 제거/마스킹.
- 로그: 어떤 필드가 redacted됐는지 **id 단위**로 기록(§9 누수 추적).

```text
Context Packager 흐름:
  NMK 전체(Bible/Reveal/Relationship) → [Prompt Firewall]
     → Writer payload = allowed_reveals + active_relationship_beats + hint_level만
     → 차단 필드(private/secret/forbidden)는 redacted, redaction id 로그
  Critic payload = 비공개 판단용 컨텍스트(critic_only) 별도, 본문 지시 아님
```

### 3.6.10 Character Bible 정보 등급 (공개 등급 + 프롬프트 접근)

각 인물 정보 항목에 등급을 붙여 공개·힌트·비공개를 엄격 구분:
```json
{
  "visibility": "public_to_reader | hinted_to_reader | private_to_system | known_to_character_only | false_belief",
  "prompt_access": "writer_allowed | critic_only | director_only | blocked",
  "reveal_id": "rev_D_backstory_01",
  "forbidden_before": 18
}
```
- `prompt_access=writer_allowed`만 Prompt Firewall 통과. `critic_only`/`director_only`/`blocked`은 Writer 본문 지시 제외.
- `visibility`로 독자 공개 상태 추적, `false_belief`는 인물이 잘못 믿는 정보(§5.1.2 지식 관계).

### 3.6.11 Lifecycle Status (인물·관계·공개·승격 상태)

장부가 많아져 현재 상태 추적 필수:
- `character.status`: proposed | active | dormant | retired | rejected
- `relationship.status`: planned | active | strained | broken | resolved
- `reveal.status`: planned | hinted | partially_revealed | revealed | delayed | cancelled
- `cast_promotion.status`: proposed | approved | rejected | superseded

### 3.6.12 ID & Cross-link 규칙 + Schema Canary

장부 연결 규칙 고정:
- **`character_id`**: Character Bible·Cast Registry·Relationship Map·Event Ledger·Scene Board 전부 동일.
- **`relationship_id`**: Relationship Map·Episode Card·Scene Board·Event Ledger.
- **`reveal_id`**: Character Reveal Schedule·Episode Contract·Scene Board·Event Ledger.
- **`species_rule_id`**: Character Bible.species_rules·World-rule Dependency Map·Immersion Gates(species_rule_violation).
- **Schema Canary**: 모든 cross-link에서 **missing target / duplicate id / orphan reveal / orphan relationship**을 검출(§10.1 캐너리).

## 4. ③~⑦ 에이전트 협업 흐름 (효율 중심)

원칙: **싼 것부터, LLM은 필요한 곳만.**

| 에이전트 | 입력 | 처리 | 출력 |
|---|---|---|---|
| **Director** | seed, state, 진행도 | 분량/Scale로 아크 분해, 회차 목표 배정, 실패 시 repair plan | 회차 지시 |
| **Planner** | 회차 지시, 직전 상태 | 상태추출(결정론) + 비트계획(저temp) + NMK 검색 | 회차 계획 |
| **Scene Board / E-konte** | 회차 계획, Episode Card | 비트를 장면 콘티로 분해(§3.5.8) | 장면 연출판 |
| **Writer** | Episode Contract + Scene Board | 본문 집필(고temp, 한국어 기본). 핵심 설정 창조 금지, 단 Locked Blueprint와 충돌하지 않는 micro-detail은 허용(§3.5.4) | 본문 |
| **Creative Review Room** | 본문, NMK, 설계 원장 | 비평가 캐스케이드 질적 비평(§5.5) | 수정 요구/통과 |
| **Immersion Gates** | 본문, NMK | 10축 캐스케이드 검증(§6) | PASS/반려+근거 |

효율 원칙: 결정론 우선 / 단일 패스 + 2회 룰 / temp 분리 / 메모리 검색으로 컨텍스트 비용 통제 / Blackboard 조율.

> **정합 주석:** 위 표는 **고수준 요약**이다. 세부 책임/승인/참조/보고 관계는 **§10.5.1 Agent Responsibility Matrix / RACI를 우선**한다(충돌 시 RACI 기준). 또한 **Chief Editor·Producer·Critic들은 별도 핵심 에이전트가 아니다** — Critic은 QA/Chief Editor 아래 judge role, Chief Editor는 QA 계열 최종 판단 role, Producer는 Director 아래 비용/속도 예산 role이다. 핵심 에이전트는 Director/Planner/Writer/QA 4개뿐.

## 5. ⑦ Narrative Memory Kernel (NMK) — 책임 분리 메모리 커널

요약 단일 의존은 사건을 누락시켜 반복·몰입붕괴를 부릅니다(§14 근거). 메모리를 **책임 분리된 7컴포넌트 커널**로 둡니다. (소지품 추적 제외)

| # | 컴포넌트 | 단일 책임 | 진실원? | 갱신 |
|---|---|---|---|---|
| ① | **Canonical Store** | 사용자 시드 불변 진실(인물 본질·세계규칙·시점·분량) | ✅ | 안 바뀜 |
| ② | **Entity State Store** | 엔티티 현재 상태(위치·생사·관계) "지금 어떤가" | ✅ | 매 회차 |
| ③ | **Event Ledger** | 사건 시간순 무손실 기록 "무슨 일이 있었나" | ✅ | append-only |
| ④ | **Rolling/Arc Summary** | 최근+아크 단위 보조 요약(빠른 흐름용) | ✗ 파생 | 매 회차/아크 |
| ⑤ | **Retrieval Index** | ②③④ 색인, top-k 검색(최신성·관련성·중요도) | ✗ 파생 | 기록 시 |
| ⑥ | **Episode Contract** | 회차 단일 조립 컨텍스트(Writer가 보는 것) | ✗ 파생·미저장 | 회차마다 |
| ⑦ | **Immersion Gates** | 본문을 NMK와 대조 — 10축 몰입 검증(§6) | 판정 | 회차마다 |

경계 원칙: 진실원은 ①②③뿐, ④⑤⑥은 파생. "지금 상태(②)"와 "일어난 사건(③)" 분리.

**인물 중심 저장소(§3.6 연계, NMK 7컴포넌트는 유지하며 명시):**

| 저장소 | 책임 | 진실원 |
|---|---|---|
| **Character Bible Store** | 인물 설정 원장(§3.6.1) | Preflight/승인 개정 |
| **Cast Registry** | 모든 등장인물 등록부(§3.6.2) | Preflight/승인 개정 |
| **Relationship Map Store** | 관계도 원장(§3.6.3) | Preflight/승인 개정 |
| **Character Reveal Schedule** | 공개 일정 원장(§3.6.4) | Preflight/승인 개정 |
| **Character Knowledge State** | 인물별 아는 정보 | §5.1.2 지식 관계와 연결 |
| **Character State Timeline** | 인물 상태 변화 시간축 | Entity State(②)·Event Ledger(③) 파생 |

진실원 구분: Character Bible/Cast Registry/Relationship Map/Reveal Schedule = **설계 진실원** / Entity State = 현재 상태 진실원 / Event Ledger = 실제 사건 진실원 / Character Knowledge State = §5.1.2 지식 관계.

### 5.1 Event Ledger 레코드 — 첫 설계부터 메타데이터 포함

```json
{
  "event_id": "PENDING",
  "episode": 0,
  "subject": "PENDING", "predicate": "PENDING", "object": "PENDING",
  "summary": "PENDING",
  "provenance": "writer | planner | director_override | user_seed",
  "source_text": "추출 원문 스팬",
  "schema_version": "0.1.0",
  "confidence": 0.0
}
```

| 필드 | 왜 처음부터 필요한가 |
|---|---|
| `provenance` | 사건 출처 추적 → 충돌 시 우선순위·신뢰 판단 |
| `source_text` | 원문 스팬 보관 → 검증·재현·오추출 디버깅(사후 복원 불가) |
| `schema_version` | 스키마 진화 대비 → 구버전 마이그레이션 |
| `confidence` | 추출 확신도 → 낮으면 보류, 충돌검사 가중치 |

### 5.1.1 Event Ledger 수정 규칙 — correction / supersession (지우지 않고 정정)

자동 추출은 틀릴 수 있으나, 원장을 삭제하면 추적성이 깨집니다. **append-only를 유지**하되 새 레코드로 정정합니다.

```json
{
  "event_id": "evt_002",
  "supersedes": "evt_001",
  "superseded_by": null,
  "status": "active",            // active | superseded | retracted
  "correction_reason": "오추출: 인물 A를 B로 잘못 식별"
}
```

- **삭제 금지.** `status`만 바꾸고 새 레코드의 `supersedes`가 과거를 가리킴. 예: `evt_002 supersedes evt_001` → evt_001.status=superseded.
- 검색/충돌검사는 `status=active`만. 폐기 사건은 감사·디버깅 시 추적 가능.
- `retracted`=대체 없는 철회 / `superseded`=더 정확한 사건으로 교체.

### 5.1.2 시간 관계 + 지식 관계 추적 보강

단순 "사건 목록"을 넘어, **사건 간 시간 순서**와 **누가 무엇을 아는가**를 추적합니다. 미스터리·반전·극적 아이러니의 토대.

(a) 시간 관계 — 사건 간 선후:
```json
{ "event_id": "evt_050",
  "temporal": { "before": ["evt_052"], "after": ["evt_041"],
                "story_time": "회상/현재/미래 표시" } }
```
- "A가 B보다 먼저 일어남"을 명시 → 회상·시간 도약·전후 모순 탐지(시간 일관성 축).

(b) 지식 관계 — 누가 무엇을 아는가:
```json
{ "knowledge_id": "kn_007",
  "fact_ref": "evt_050",
  "known_by_characters": ["A"],        // 인물 중 누가 아는가
  "unknown_to_characters": ["B"],      // 누가 모르는가
  "audience_knows": true,              // 독자만 아는가(극적 아이러니)
  "info_status": "true | false | misunderstood | corrected",
  "corrected_by": null                 // 정정 정보면 어떤 지식이 바로잡았나
}
```
- **독자만 아는 정보 vs 인물만 아는 정보** 구분 → 지식 누수(7축 knowledge_leak) 탐지: 인물이 `unknown_to_characters`인 정보를 사용하면 reject.
- **거짓 정보·오해·정정** 추적 → 인물이 믿는 `false`/`misunderstood` 정보와, 나중 `corrected` 정보를 구분. 반전·복선 회수에 활용.
- 설계 원장(Reveal Schedule)과 cross-link.
- 미구현 — 스키마 PENDING.

### 5.2 Episode Contract — "이번 회차의 독자 경험 목표" 포함

Writer가 사건만 처리하면 §6.1 8번 축(요약문)이 걸립니다. Episode Contract에 **이번 회차가 독자에게 줄 체험**을 명시해 장면 체험을 쓰게 합니다.

```json
{
  "episode": 0,
  "canonical_ref": ["..."],
  "retrieved_events": ["evt_..."],
  "entity_snapshot": { },
  "beats": ["..."],
  "reader_experience_goals": ["tension","discovery","emotional_turn",
    "conflict_escalation","payoff","twist","resonance"],
  "primary_goal": "tension",

  "allowed_character_reveals": ["rev_D_backstory_01"],
  "forbidden_character_reveals": ["rev_D_identity_final"],
  "active_relationship_beats": ["rel_A_C_turn_02"],
  "allowed_new_characters": { "max_count": 2, "allowed_importance": "minor", "requires_creation_gate": true }
}
```

- **인물 공개 제한:** Episode Contract엔 이번 회차에 **허용된 인물 정보만** 들어감. `forbidden_character_reveals`는 공개 금지(§3.6.4). `allowed_new_characters`로 신규 인물 수·등급 제한(§3.6.5).
- **Prompt Firewall(§3.6.9):** Writer payload는 이 Contract의 allowed 항목 + public_summary만. private_backstory·secrets·hidden_truth는 redacted — 본문 지시에 안 들어감.

- 목표 7종: 긴장·발견·감정전환·갈등고조·보상·반전·여운. Director가 아크 위치로 배정.
- `primary_goal` 1개 핵심, Writer는 그 체험이 **장면으로** 전달되게 집필. 8번 축이 달성 여부 검증.
- 미구현 — 목표 enum·배정 규칙 PENDING.

## 5.5 Creative Review Room (창작 비평실, Immersion Gates 앞)

일본 제작실의 **연출 회의**처럼, 기계적 게이트(§6) 앞에 **창작 비평실**을 둡니다. Immersion Gates가 "오류를 막는다"면, Creative Review Room은 "더 좋은 작품인가"를 본다 — 질적 비평.

### 5.5.1 비평가 역할

| 비평가 | 보는 것 |
|---|---|
| **Continuity Critic** | 설정·상태·시간·지식 연속성(NMK 대조) |
| **Emotion Critic** | 감정선·인물 모순(§3.5.9) 일관성, 정서 설득력 |
| **Scene Critic** | Scene Board(§3.5.8) 대비 장면성·연출, 요약문화 여부 |
| **Theme Critic** | Theme Ledger(§3.5.10)·Authorial Intent(§3.3) 충실도 |
| **Surprise Critic** | 반전·발견의 신선도, 예측가능성·클리셰 |
| **Language Critic** | 한국어 문체 자연성·언어 정책(§8) |
| **Producer** | 비용·속도·일정·독자 보상 균형 |
| **Chief Editor** | 비평 종합·최종 판단(수정 요구 vs 통과) |

인물 검수 연결(§3.6): **Continuity Critic** = Character Bible·Cast Registry·Relationship Map·Character Knowledge State 대조 / **Emotion Critic** = 인물 모순·관계 변화 자연스러움 / **Scene Critic** = 설정 설명이 장면으로 변환됐는지 / **Theme Critic** = 인물 아크가 주제 압력에 기여하는지.

### 5.5.2 비용 캐스케이드 — 항상 전원 호출 안 함

모든 회차에 8명 전원을 부르면 비쌉니다. **Scale Mode + 위험도**로 호출 범위를 캐스케이드:

```text
[1단] 위험 신호 산정(결정론): gate 사전체크·텔레메트리·Hard/Soft 침범 여부·Scale
[2단] 저위험 + 단편 → Chief Editor 1명만(또는 생략)
       중위험 → 관련 비평가 1~3명(예: 감정 회차→Emotion+Scene)
       고위험/장편 핵심 회차 → 전원 + Chief Editor 종합
[3단] Producer는 예산 초과·일정 위험 시에만 개입
```

- 단편: 대부분 생략~소수. 장편/시리즈 핵심·반전·아크 경계 회차: 전원.
- 비평실 결과는 Immersion Gates(§6) **앞** 단계 — 여기서 "수정 요구"면 Writer 재작업, 통과면 게이트로.
- 비평실 호출도 §9 텔레메트리·§7.2 예산에 계상.
- 미구현 — 위험도 산정·호출 규칙 PENDING.

## 5.6 Variant Drafting + Selection (고위험 회차 한정)

모든 회차가 아니라 **고위험 회차에만** Writer가 2~3개 초안을 만들고, Creative Review Room이 비교, Chief Editor가 하나를 고릅니다. (비용 때문에 제한)

- **고위험 회차 정의:** 반전, 결말, 인물 붕괴(가면 해제), 대형 떡밥 회수, 아크 경계.
- **선택 기준:** 설계 충실도 · 장면성 · 감정 설득력 · 신선도 · 페이싱.
- **Scale·위험도 제한:** 단편은 원칙 미사용. 중편=드물게 2안. 장편/시리즈 핵심 회차=2~3안. 예산(§7.2) 초과 시 안 수를 줄임.
- 선택 결과·탈락 사유는 Craft Decision Log(§3.4b.6)·텔레메트리(§9)에 기록.
- 근거(참고 방향, §14): Re3의 여러 continuation rerank·revision, CritiCS류 다중 비평자 반복 개선.
- 미구현 — 위험도 트리거·안 개수 규칙 PENDING.

## 6. ⑥ Immersion Gates — 10축 다중 게이트 + 캐스케이드

몰입을 깨는 요인은 최소 10가지입니다. 각 축은 독립 판정 → 어느 축이든 fatal이면 반려.

### 6.1 10개 검증 축 + 최소 pass/reject 기준

| 축 | 무엇을 지키나 | 최소 pass/reject 기준 |
|---|---|---|
| 1. **사실/세계 일관성** | 세계규칙·기정사실 위반 없음 | Canonical world_rules(절대금지) 또는 확정 사건과 모순 → **fatal reject**. 경미한 세부 불일치 → warn |
| 2. **엔티티 상태 일관성** | 죽음·위치·관계 모순 | 위치/부상/생사가 active Entity State와 충돌(예: dead 인물 행동, 부상 부위 사용) → **fatal reject** |
| 3. **전개/반복 가드** | 진전 없음·사건 재등장 | 이미 `active`로 기록된 사건(첫 만남·해결된 갈등 등)이 재발생 → **reject**. 진전 비트 0 → warn |
| 4. **감정 연속성** | 감정선 단절·급변 | 직전 회차 감정 상태와 bridge 없는 급반전 → **reject**. 약한 비약 → warn |
| 5. **작가 의도/시드 충실도** | 톤·시점·금지요소 | 시드 POV 위반(예: 1인칭 지정인데 전지적), 금지요소 등장 → **fatal reject**. 톤 이탈 → warn |
| 6. **장르/문체 적합** | 장르·분위기 일탈 | 장르/분위기와 명백히 충돌하는 문체·소재 → **reject**. 경미 → warn |
| 7. **언어 자연성/한국어 기본** | 외국어·한자 혼입(§8) | 서술문(대사·고유명사·표지판 외)에 까닭 없는 외국어/한자 → **reject**. 경계 → 캐스케이드 2단 |
| 8. **재미/장면성(요약문 방지)** | 장면 체험 vs 요약 | `primary_goal`을 장면(감각·대사·행동)으로 전달 못 하고 줄거리 요약투면 → **reject**. 부분 미흡 → warn |
| 9. **페이싱(Pacing)** | 밀도·리듬 붕괴 | §6.5의 6신호가 Episode Card·Scene Board 목표 대비 과밀/과소 → **reject/warn** (Narrative Shape Mode별 기준) |
| 10. **인물·노출 통제(Character & Exposition)** | 공개 타이밍·인물 난립·종족 규칙 | 세부 reject(§6.8): character_reveal_leak / cast_sprawl / unauthorized_major_character / relationship_jump / exposition_dump / species_rule_violation |

> severity: **fatal**(즉시 반려) / **major**(reject) / **minor**(warn, 통과 가능). 기준 임계치는 골든 픽스처(§10.1)로 보정, 초안값 PENDING.

### 6.2 캐스케이드 — 모든 축을 LLM judge로 돌리지 않는다

```text
축마다:
  [1단] Deterministic Guard (코드·규칙·상태조회, 비용 0)
        예: 죽음 키워드 vs Entity State, 외국어/한자 정규식, Event Ledger 중복조회
        → 명백 위반/정상 → 즉시 판정, 종료 / 애매 → 2단
  [2단] Cheap Model (소형 저가 모델 1차 선별)
        → 확신 → 종료 / 경계·고위험 → 3단
  [3단] Expensive Judge (대형 모델, 소수 케이스만)
```

원칙: 대부분 1단 종료 / 2·3단은 걸러진 소수만 / 결정론으로 잡을 건 LLM에 안 맡김.

### 6.3 게이트 텔레메트리 (§9 관측과 연계)

게이트 1건당 결과를 append 기록 — 축별 반려율·단계별 종료비율·재작업 횟수 집계 → 프롬프트/스키마/모델 라우팅 개선 근거. 상세 스키마는 §9·§10.2.

### 6.4 게이트 실패 정책 (반려 후 무엇을 하나)

```text
회차 N 반려 발생:
  1) reject된 본문은 절대 NMK에 commit하지 않는다 (Event Ledger/Entity State 오염 금지).
  2) Writer 재작업 — 게이트 근거를 피드백으로 재집필. 최대 2회.
  3) 2회 재시도도 실패 → Director가 'repair plan' 생성
       (예: 비트 재배치, primary_goal 완화, 충돌 사건 supersede 제안, 컨텍스트 보강)
       → repair plan으로 1회 추가 시도.
  4) 그래도 실패 → '부분 실패 보고서'로 해당 회차 정지(파이프라인 중단).
       보고서: 실패 축·근거·재시도 이력·repair plan·마지막 본문 스냅샷. 사람 확인 대기.
```

핵심: **실패를 삼키지 않는다.** 통과 못 한 본문은 기록에 절대 안 들어가고, 무한 루프 대신 보고 후 정지(헌법 NO ENDLESS LOOPS).

### 6.5 Pacing Gate (9번 축 상세) — 밀도·리듬 검수

페이싱은 단일 신호가 아니라 **6개 밀도/리듬 신호**의 균형입니다. Episode Card·Scene Board·Immersion Gates를 가로질러 연결됩니다.

| 페이싱 신호 | 무엇을 보나 | 연결 |
|---|---|---|
| **사건 밀도** | 회차당 사건 수가 과밀/과소인가 | Episode Card.required_events 수, Event Ledger |
| **감정 밀도** | 감정 자극이 몰리거나 비었나 | Scene Board.emotional_temperature, Emotional Rhythm Map |
| **정보 공개량** | 한 회차에 정보 폭탄/정보 가뭄 | Reveal Schedule, 지식관계(§5.1.2) |
| **장면 구체성** | 장면이 구체적인가(요약문화 연동) | Scene Board, 8번 축 |
| **독자 보상 간격** | 보상(reader_experience_goal)이 너무 뜸한가 | Episode Card.reader_experience_goal |
| **휴식 구간** | 고조만 있고 숨 돌릴 틈이 없나 | Emotional Rhythm Map |

판정:
- **Narrative Shape Mode(§3.4)별 기준 적용.** slice_of_life_accumulation은 사건 밀도 낮아도 정상, conflict_arc는 고조 구간 정체 시 reject.
- 캐스케이드: 1단(결정론) — Card/Board 수치 대비 과밀·과소 산정 → 경계는 2단 모델 판정.
- Scene Critic(§5.5)·8번 축(장면성)과 상호 보강. 미구현, 임계치 PENDING.

### 6.7 Reader Transportation Probe (독자 몰입 사후 평가)

Immersion Gates가 **내부 오류를 막는** 장치라면, Reader Transportation Probe는 **독자가 실제로 이야기 안으로 들어갔는가**를 보는 사후 평가입니다. 게이트 통과(오류 없음) ≠ 몰입 성공.

| 평가 항목 | 질문 |
|---|---|
| **심상 형성** | 장면이 독자 머릿속에 그려지는가 |
| **정서 관여** | 인물 감정에 붙을 수 있는가 |
| **현실감/개연성** | 현실감·개연성을 느끼는가 |
| **다음 회차 견인** | 다음 회차를 보고 싶은가 |
| **의도·정서 잔향** | 작가 의도(§3.3)와 정서가 남는가 |

- **회차별 자동 점검** + **아크 경계/최종화에서 강화 점검**.
- 게이트 뒤·커밋 전 단계(⑦b). 점수 낮으면 경고·재검토 신호(반드시 reject는 아님 — 질적 신호).
- 근거(검증된 이론, §14): **Narrative Transportation 이론** — 몰입을 주의 집중·정서 관여·심상 형성으로 설명.
- 점수는 텔레메트리(§9)·Craft Decision Log(reader_probe_links)에 기록. 미구현 — 척도 PENDING.

**Craft Trait ↔ Reader Probe 집계** — trait별 독자 몰입 영향 추적:
```json
{ "trait_id": "trait_scene_negative_space",
  "transportation_score_delta": 0.0,
  "imagery_score": 0.0,
  "emotional_engagement_score": 0.0,
  "attention_or_continuation_score": 0.0,
  "overuse_warning": false }
```
- 어떤 trait가 실제 몰입을 올렸는지/과용으로 떨어뜨렸는지 누적 → §9 trait 지표·trait 강도 보정에 환류.

### 6.8 Exposition Control Gate + 인물 reject 상세 (10번 축)

"1화에서 A~D 설정을 전부 설명"하는 문제를 막습니다.

검사 항목: 회차당 공개된 인물 과거 정보량 / 대화·행동 없이 설명문으로 직접 공개된 설정량 / Reveal Schedule에 없는 공개 여부 / 주요 인물 여러 명의 비밀이 한 회차에 몰렸는지 / Scene Board `hidden_purpose`와 무관한 설명인지.

세부 판정:

| reject 코드 | 조건 |
|---|---|
| **character_reveal_leak** | Reveal Schedule에 없는 과거/비밀 공개, `forbidden_before` 위반 → reject |
| **exposition_dump** | 설정집을 본문에 한꺼번에 설명(대화·장면 없이) → scene_quality reject |
| **(과거사 과밀)** | 한 회차 과거사 과밀 → pacing(9번) warn/reject |
| **reveal_leak(완전공개)** | 힌트로 둬야 할 정보를 완전 공개 → reject |
| **cast_sprawl** | 불필요한 신규 인물 난립(기존 인물로 충분) → warn/reject |
| **unauthorized_major_character** | 승인 없는 인물이 주요 서사 기능 수행 → reject |
| **deus_ex_new_character** | 즉석 인물이 주요 사건 해결(§3.6.5) → reject |
| **relationship_jump** | 관계 변화가 Relationship Map 계획 없이 급변 → reject |
| **species_rule_violation** | 이종족/비인간이 규칙·능력 한계 위반(§3.6.8) → reject |

- 캐스케이드: 1단(결정론) — Reveal Schedule·Cast Registry·Relationship Map 대조로 다수 자동 탐지. 경계는 2단 모델.

## 7. Scale Mode — 길이별 같은 아키텍처, 다른 강도

단편·중편·장편·시리즈는 **동일 파이프라인·동일 NMK**. 다른 건 **메모리 깊이**와 **게이트 강도**뿐.

| Scale | 대략 분량 | Memory depth | Gate strength |
|---|---|---|---|
| **단편** | ~1–5화 | Rolling Summary 위주, Event Ledger 경량, 검색 얕음 | 핵심 축(1·2·3·7·8), 대부분 1단 결정론 |
| **중편** | ~5–20화 | Event Ledger 본격, 아크 요약 1개 | 10축 모두, 2단 모델 선별 |
| **장편** | ~20–100화 | NMK 풀가동, 다중 아크 요약, 검색 깊음 | 10축 + 3단 judge(경계 케이스) |
| **시리즈** | 다권 | + 권 간 Canonical·아크 메모리 누적 | 최강 — 권 경계 충돌·장기 복선 |

원칙: 아키텍처 분기 금지(파라미터일 뿐) / 단편에 무거운 judge 강제 안 함 / 시리즈에 얕은 메모리 금지.

### 7.1 승격 경로 (Promotion Path) — 단편 → 중편 → 장편

| 승격 항목 | 단편 상태 | 승격 동작 |
|---|---|---|
| Memory depth | Event Ledger 경량 | 과거 회차 본문 **소급 추출**로 원장 backfill(무손실이면 그대로 활용) |
| Arc Summary | 없음 | 기존 회차 묶어 **아크 요약 생성**(첫 아크 경계 지정) |
| Retrieval Index | 얕음/미사용 | 누적 원장·상태 **재색인**, 검색 깊이 상향 |
| Gate strength | 핵심 축+1단 | 10축 전체 + 2·3단 캐스케이드 활성 |

- **무손실이라 승격 안전** — 처음부터 append-only라 소급 재구성 가능. Director가 "분량 상향" 시 1회 트리거. 시점·시드는 불변.

### 7.2 비용/속도 예산 (초안)

Scale별 회차당 비용 상한 가이드(초안 — Phase 4 실측 후 확정 PENDING). 목적: expensive judge 남용 방지.

| Scale | 1단 결정론 | 2단 cheap model | 3단 expensive judge | 회차당 비싼 judge 호출 상한(초안) |
|---|---|---|---|---|
| **단편** | 대부분 | 소수 | **원칙적 비허용** | ~0 |
| **중편** | 다수 | 일반 | 예외적 | 회차당 ≤1 |
| **장편** | 다수 | 일반 | 경계 케이스 | 회차당 ≤2 |
| **시리즈** | 다수 | 일반 | 허용(권 경계·복선) | 회차당 ≤3, 권 경계 검수 시 추가 |

- 비싼 judge 호출이 상한 초과 시: 텔레메트리 경고 + 캐스케이드 임계치 재조정 검토.
- 속도 예산도 동일 틀로 회차당 목표 wall-clock 상한을 둠(값 PENDING, §9 계측으로 측정).

## 8. 언어 정책 — 한국어 기본 + Language Naturalness Gate

**기본 서술 언어는 한국어.** 외국어/한자/영어는 작품 내 이유가 있을 때만 허용, 그 외 설명문 혼입은 오류.

### 8.1 허용 (작품 내 이유 있음)
인물 대사(외국인 발화) / 표지판·문서 묘사 / 고유명사·지명·인명 / 세계관 장치(주문·고대문자). 단 **서술 본문은 한국어**, 외국어는 따옴표·표기 안에서.

### 8.2 오류 (이유 없는 혼입)
서술문에 영어 흘림("그는 suddenly 돌아섰다") / 맥락 없는 한자 남발 / 톤 깨는 외국어 / 번역체("~되어졌다").

### 8.3 판정 흐름 (캐스케이드)
```text
1단: 정규식/사전으로 외국어·한자 스팬 검출
   → 대사/따옴표/고유명사 화이트리스트 안 → 허용, 종료
   → 서술문 한복판 → 오류 후보 → 2단
2단: 저가 모델 "작품 장치로 자연스러운가" 판정 → 허용/반려
```
헌법 §2 정합: 본문=한국어 기본 / 개발자 보고=한국어 / 에이전트 내부 지침=영어 허용.

## 9. Agent Observability / Profiling (관측·프로파일링)

운영 중 **무엇이 느리고 어디서 실패하는지**를 측정합니다. 계측은 플래그로 on/off.

### 9.1 측정 대상 + Span 필드

단계별 wall-clock + 에이전트 내부 sub-step span 기록:
- 측정 단계: Director / Planner / Writer / Immersion Gates / NMK commit / Retrieval / Summary 갱신.
- 각 에이전트 내부 sub-step도 span으로(예: Planner의 상태추출 vs 비트계획 vs 검색).

기본 span 필드:
```text
trace_id, span_id, parent_span_id,           # 부모/자식 추적
episode_id, run_id, agent, step,
start_time, end_time, duration_ms,
retry_index, gate_axis, verdict
```
- **`trace_id` / `span_id` / `parent_span_id`** — 한 회차 처리를 하나의 trace로 묶고, 단계 간 부모/자식 관계를 추적: `Director → Planner → Retrieval → Writer → Gate → NMK commit`. 어느 자식이 부모 시간을 잡아먹는지 분해 가능.
- (게이트 외 단계는 gate_axis/verdict 비어 있을 수 있음.)

**LLM 호출 span은 `token_usage` 하나로 뭉치지 않고 분리**(비용·캐시·지연·오류 분석 위해):
```text
input_tokens, output_tokens,
cached_tokens (또는 cache_hit: bool),
estimated_cost,
model_provider, model_name,
latency_ms, error_type
```
- LLM 호출 span은 위 필드를 가지며 기본 span 필드(trace_id 등)를 상속.
- `estimated_cost`는 provider·model 단가표 기반 계산(§7.2 예산 대비 집계).
- `error_type`은 정상 시 null(예: rate_limit / timeout / refusal / schema_invalid 등).

### 9.2 로그 레벨 (4단계, 플래그)

| 레벨 | 용도 | 기록 내용 |
|---|---|---|
| **off** | 운영 기본값 | 치명 오류만 |
| **summary** | 운영 관찰 | 회차별 agent duration·token·gate 결과 요약 |
| **trace** | 분석 | + 에이전트 sub-step span, retrieval query, gate cascade tier, retry 이유 |
| **debug** | 개발 전용 | + 프롬프트/모델 응답 일부. **개인정보·과도한 원문 저장 위험 명시**, 개발 플래그 켜진 경우만 |

### 9.3 병목 분석 리포트 (Phase별 산출물)

각 Phase 산출물에 포함:
- episode별 총 소요 시간
- agent별 평균/최대 duration
- gate별 reject 빈도 + 재시도 비용
- expensive judge 호출 비율(§7.2 상한 대비)
- retrieval / summary / NMK commit 비용
- **"느린 agent top N" 자동 요약**

#### SRE 4대 신호(Four Golden Signals) → AgentScribe 매핑

| 신호 | AgentScribe 지표 |
|---|---|
| **Latency** | agent/span duration(p50·p95·max), trace 총 소요, 단계별 분해 |
| **Traffic** | episode/run 수, 모델 호출 수, input·output·cached 토큰 수 |
| **Errors** | gate reject, retry 횟수, Director repair plan 발동, partial failure 정지, `error_type`별 LLM 오류 |
| **Saturation** | expensive judge 상한(§7.2) 초과율, 큐/백로그 적체, 예산(비용·속도) 사용률 |

#### Craft Trait 지표 (§3.4b 연계)

- trait별 선택 빈도 / reject·warn 빈도 / 비용 증가량 / Reader Probe 점수 변화
- trait 충돌 빈도 / 특정 trait 조합이 실패를 유발하는 패턴
- Scale Mode별 자주 쓰이는 trait / 장르별 trait 성과

병목 리포트 추가 항목:
- **문제 많은 trait top N** / **성과 좋은 trait 조합 top N**
- **비용 대비 효과 낮은 trait top N** / **게이트 반려를 자주 유발하는 trait top N**

#### Character / Cast 지표 (§3.6 연계)

- 회차별 새 인물 수 / agent_runtime 인물 수 / minor·cameo·major·core 비율
- Cast Promotion 제안·승인·거절 수 / reveal schedule 위반 수 / 회차당 인물 과거 공개량
- 관계 변화 beat 성공·실패 / 인물별 등장 빈도 / 인물별 reader_probe 점수 영향
- cast_sprawl 경고 / exposition_dump 경고 / species_rule_violation 횟수

#### 정보 누수 추적 지표 (§3.6.9 Prompt Firewall 연계)

- `prompt_firewall_redaction_count` / `blocked_private_fields_count` / `reveal_leak_prevented_count`
- `writer_prompt_character_payload_size` / `critic_only_context_size`
- `orphan_reveal_count` / `orphan_relationship_count` / `character_schema_canary_failures`

#### UX 지연 지표 (§10.5.8 Long Generation UX 연계)

- `time_to_first_status` / `time_to_first_artifact` / `time_to_first_token` / `total_generation_time`
- `phase_duration_p50` / `phase_duration_p95`
- `user_cancel_rate` / `user_pause_rate` / `user_resume_rate`
- `pre_render_hit_rate` / `cache_hit_rate` / `background_job_failure_rate`

#### 주관 평가 지표 (§10.5.4 Calibration 연계)

- judge_agreement_rate / human_judge_disagreement / false_positive_rate / false_negative_rate
- borderline_rate / retry_success_rate / judge_cost_per_episode / judge_latency_p95
- judge_position_bias_check / verbosity_bias_warning_count

리포트는 `docs/test_reports/`(헌법 라우팅)에 누적.

### 9.4 계측 원칙

- 계측은 기능 로직을 오염시키지 않도록 **공통 timing wrapper / span API**로 처리(로직 코드에 측정 코드 산재 금지).
- 기본 로그는 **원문 본문 전체를 저장하지 않음** — id/hash/snippet 중심.
- trace/debug 로그는 **개발 플래그가 켜진 경우에만** 저장.
- 로그 스키마는 §10.2에서 Phase 1 전 선고정.

### 9.5 보존 / 샘플링 정책

로그 무한 누적·프라이버시 위험을 막기 위한 보존·샘플링(초안값 PENDING, 운영 시 확정):

| 항목 | 정책(초안) |
|---|---|
| **summary 로그 보존** | 중기 보존(예: 90일). 집계·추세 분석용 |
| **trace/debug 로그 보존** | 단기 보존(예: 7~14일). 용량·민감도 커서 짧게 |
| **실패 run 장기 보존** | reject/partial failure run은 **별도 장기 보존**(회귀·원인분석용), 본문은 hash/snippet으로 |
| **샘플링** | 정상 trace는 일부만 샘플링 저장 가능, **실패 trace는 100% 보존** |
| **debug 원문/프롬프트** | **마스킹**(개인정보·민감 표현) + **샘플링** + **개발 플래그 제한**. 원문 전체 무제한 저장 금지 |

- 기본 원칙(§9.4) 재확인: 평시 로그는 id/hash/snippet 중심, 원문 전체 미저장.
- 보존 기간·샘플링율·마스킹 규칙은 Observability/Telemetry Schema(§10.2)와 함께 고정.

## 10. 아키텍처 골격 (단계적 구현 로드맵)

```text
Phase 0 (이 제안서)  몰입 보존형 파이프라인 전체 설계 = 문서
Phase 1 (MVP)        목표 제한 = "Seed + Intent + Shape + 최소 Blueprint 저장"
                     - Seed 입력 UI(+Scale) + Authorial Intent Bible + Narrative Shape
                       Mode + Canonical Store/seed_settings + basic Blueprint/Episode Card
                     - MVP 필수 스키마만 고정(§10.2): seed_settings·canonical_store
                       ·authorial_intent_bible·narrative_shape_mode·basic_series_blueprint
                       ·basic_episode_card·fixture_schema·observability_telemetry_schema
                     - Craft Trait·Character Firewall·Creative Review·Reader Probe는
                       **문서상 방향만 유지, 실제 구현은 Phase 2+로 미룸**
                       (단 "Writer에 private/secret 미전달" 원칙은 Phase 1부터 고정)
Phase 2              Editorial Room/Preflight: Theme Ledger + Series Blueprint
                     + Character Bible/Cast Registry/Relationship Map/Reveal Schedule
                       (생성 시 visibility·prompt_access 등급 부여 §3.6.10)
                     + Episode Card + Scene Board + Masterpiece Candidate Gates(14축)
                     + Locked(Hard/Soft/Fluid) + 버튼 UX
                     + Craft Trait Selection을 Preflight 산출물에 연결
Phase 2'             운영: Preflight Room + initial dashboard 데이터 연결(§10.5.7)
Phase 3              Director(잠긴 설계 기반) + 회차 루프 골격(+실패 정책 §6.4)
                     + Character Creation Gate / Cast Promotion Gate
                     + Episode Contract 조립 시 allowed_character_reveals만 포함
                     + model_router + Prompt Firewall + Episode Contract routing(§10.5.5)
Phase 4              Planner/Writer + Scene Board 집필(LLM, temp 분리, 한국어 기본)
                     + Writer는 작가명 아닌 trait id·설명·강도·금지조건만 수신
                     + Writer 호출 직전 Prompt Firewall 적용(private/secret/forbidden redaction)
                     + Writer/Planner/Judge 모델 라우팅 적용(§10.5.5)
Phase 5              Creative Review Room(비평가 캐스케이드) → Immersion Gates 10축
                     (1단 결정론 → 2·3단) + Pacing + Exposition Control + Reader Probe
                     + Exposition Control Gate가 firewall 누락·reveal leak 검수
                     + Review/Gates가 trait 적용 성공·과용·부족 평가
                     + Subjective Evaluation + Calibration + Latency UX 측정(§10.5.3·4·8)
Phase 6              NMK 풀(시간·지식 관계 §5.1.2, 인물 저장소, 설계↔Event cross-link)
                     + 관측/병목(§9): Craft Decision Log·trait·인물·redaction log·누수 지표 포함
                     + DB 저장소(PostgreSQL/JSONB/pgvector §10.5.6) + observability report 고도화
Phase 7              Scale Mode 파라미터화 + 승격 경로 + 사전렌더 캐시 + 저수준 계약/스키마
```

> 각 Phase 착수 전 §10.1 골든 픽스처/캐너리를 먼저 만든다. 테스트 없이 게이트 구현 금지.

### 10.1 구현 전 필수 — Golden Fixtures / Canary (+ Retrieval Canary)

**어떤 게이트도 테스트 케이스 없이 구현하지 않는다.**

(a) 최종 본문 검사용 픽스처 — 양성(잡아야 함)+음성(막으면 안 됨) 둘 다:

| 유형 | 픽스처 예 | 기대 |
|---|---|---|
| 부상 인물 행동 | 팔 잘린 A가 두 손으로 칼 | 2번 축 fatal reject |
| 아이템 이동 | (미추적) | pass(음성 캐너리, 반려 안 나야 정상) |
| 위치 이동 | 설명 없이 다른 도시 | 2번 축 reject |
| 감정선 변화 | 분노→근거 없는 호의 | 4번 축 warn/reject |
| 언어 혼입 | 서술문에 "suddenly" | 7번 축 reject |
| 반복 사건 | 해결된 첫 만남 재발생 | 3번 축 reject |
| 작가 의도 이탈 | 1인칭 지정인데 전지적 | 5번 축 reject |
| 요약문화 | 장면 없는 줄거리 요약 | 8번 축 reject |

(b) **Retrieval Canary — "검색된 기억이 맞았는가"**:
- RAG/메모리는 저장보다 **'적절한 기억을 꺼냈는가'가 더 자주 실패**합니다. 최종 본문만 보면 이 실패가 가려집니다.
- 그래서 **검색 단계 자체**를 검증: "회차 N에서 인물 X 등장 시, 과거 관련 사건 evt_a·evt_b가 top-k에 포함되는가"를 정답 라벨로 고정.
- 지표: 검색 재현율(필요한 과거 사건을 끌어왔는가)·정밀도(엉뚱한 사건 끌어옴)·`status=superseded` 사건 제외 여부.
- 음성 캐너리: 무관한 사건이 top-k 상위에 올라오면 실패로 본다.

(c) **Positive Golden Fixtures — "통과해야 하는 좋은 장면"**:
- 현재 픽스처는 "잡아야 할 오류" 중심. 게이트가 너무 방어적으로 변해 **좋은 장면까지 반려**하는 문제를 막기 위해 양성 샘플을 둠.
- 예: 사건은 적지만 정서 축적이 훌륭한 slice_of_life 장면 / 대사 없이 감정 전환이 전달되는 장면 / 기승전결 '전'이 갈등 아닌 관점 전환으로 작동하는 장면.
- 기대: 전부 **pass**(특히 Pacing·장면성·Surprise 축이 오탐하지 않아야).

(d) **Craft Trait 픽스처**:
- trait 과용으로 글이 망가지는 **음성 픽스처**(예: negative_space 과용→혼란) → 해당 축 reject/warn.
- trait가 적절히 쓰여 좋은 장면이 되는 **양성 픽스처** → pass.
- 서로 충돌하는 trait 조합 테스트(예: negative_space vs high_exposition).
- **안전성 테스트:** 작가명/작품명 없이 **추상 trait만 Writer에 전달**되는지 확인(§3.4b.1 모방 금지).

(e) **Character / Cast 픽스처**:

| 픽스처 | 기대 |
|---|---|
| 1화에서 A~D 과거사를 전부 설명 | exposition_dump reject |
| 중반 공개 예정 D 과거를 2화에 공개 | character_reveal_leak reject |
| 즉석 행인이 최종 갈등 해결 | unauthorized_major_character(deus_ex) reject |
| 기존 조력자로 충분한데 새 인물 생성 | cast_sprawl warn/reject |
| 관계도상 적대인데 근거 없이 절친처럼 | relationship_jump reject |
| 드래곤족이 설정상 불가능 능력 사용 | species_rule_violation reject |
| 말하는 동물 동료가 세계 규칙 안에서 자연스럽게 | **positive pass** |
| 비인간 인물의 사회적 위치가 장면·관계에 반영 | **positive pass** |

(f) **Prompt Firewall / Schema Canary 픽스처**:

| 픽스처 | 기대 |
|---|---|
| Bible에 D 과거 있으나 Episode Contract 미허용 | Writer prompt에 그 과거 **없어야 pass** |
| Critic은 private_backstory 접근 가능, Writer는 불가 | access separation **pass** |
| forbidden_character_reveals가 Writer 입력에 포함 | **prompt_firewall reject** |
| Reveal Schedule에 없는 reveal_id가 Scene Board 등장 | **schema canary reject** (orphan reveal) |
| Relationship Map에 없는 relationship_beat가 Scene Board 등장 | **schema canary reject** (orphan relationship) |

운영: 픽스처/캐너리는 버전 관리, 게이트·프롬프트·모델 라우팅 변경 시 회귀 실행, 텔레메트리(§6.3·§9)와 연계. 포맷은 §10.2 선고정.

### 10.2 스키마 선고정 — Phase 1 전 필수

**전체 스키마 후보는 아래와 같되, Phase 1에서는 아래 "MVP 필수"만 실제 고정**합니다(후속 stub은 방향만). 나중에 테스트 포맷이 흔들리면 게이트 품질 비교가 불가능해지므로, MVP 필수는 Phase 1 착수 전 고정합니다.

- **Fixture Schema** — 골든 픽스처/캐너리의 입력·기대판정·라벨 포맷. 포함 범위: 본문·검색(Retrieval)·positive·trait·**Character/Cast·Prompt Firewall·Schema Canary·access separation·orphan reveal/relationship**.
- **Observability/Telemetry Schema** — §9.1 span 필드 포함:
  - 추적: `trace_id`·`span_id`·`parent_span_id`
  - 기본: episode_id·run_id·agent·step·duration_ms·retry_index·gate_axis·verdict
  - LLM 호출: input_tokens·output_tokens·cached_tokens(또는 cache_hit)·estimated_cost·model_provider·model_name·latency_ms·error_type
  - 게이트 결과: 축·cascade tier·verdict·severity·retry
  - 보존/샘플링/마스킹 규칙(§9.5), `schema_version` 포함.
- **Craft Trait Schema** — §3.4b.2 trait 레코드 포맷(provenance/evidence/safety 포함).
- **Craft Selection Schema** — §3.4b.4 selected/rejected/conflicts + Selection Budget.
- **Craft Decision Log Schema** — §3.4b.6 selected/rejected/suppressed 회차 로그.
- **Reader Probe Schema** — §6.7 평가 항목·점수 + trait 영향 집계.
- **Character Bible Schema** — §3.6.1.
- **Cast Registry Schema** — §3.6.2.
- **Relationship Map Schema** — §3.6.3.
- **Character Reveal Schedule Schema** — §3.6.4.
- **Character Creation Gate Schema** — §3.6.5.
- **Cast Promotion Gate Schema** — §3.6.7.
- **Character/Cast Observability Schema** — §9.3 인물 지표.
- **Context Packager / Prompt Firewall Schema** — §3.6.9 Writer payload·redaction 로그(어떤 필드가 redacted됐는지 id).
- **Character Info Grade / Lifecycle Schema** — §3.6.10·§3.6.11 visibility·prompt_access·status.
- **Cross-link / Schema Canary 규칙** — §3.6.12 id 일치·orphan 검출.
- **Agent Responsibility Matrix Schema** — §10.5.1 RACI.
- **Subjective Evaluation Rubric Schema** — §10.5.3 축·점수·근거·trace_id.
- **Judge Calibration Schema** — §10.5.4 expected verdict·FP/FN·지표.
- **Model Routing Schema / LLM Call Policy Schema** — §10.5.5 llm_route·로그(키 미기록).
- **Database Storage Schema** — §10.5.6 테이블·JSONB·append-only·snapshot.
- **UI/UX Screen Skeleton Schema** — §10.5.7 화면.
- **Latency UX Metrics Schema** — §10.5.8 time_to_first_* 등.

스키마는 `docs/schemas.md`에 기록하고 버전 관리. 변경 시 마이그레이션 규칙 동반.

#### Phase 1 스키마 분리 — MVP 필수 vs 후속 stub

위 전체 목록을 Phase 1에 다 고정하지 않는다. **과도한 1차 구현 방지.**

**MVP 필수(Phase 1에서 실제 고정·사용):**
- `seed_settings` / `canonical_store` / `authorial_intent_bible` / `narrative_shape_mode`
- `basic_series_blueprint` / `basic_episode_card`
- `fixture_schema` / `observability_telemetry_schema`

**후속 stub(문서상 방향만, Phase 2+ 구현):**
- `craft_trait_schema` / `character_bible_schema` / `cast_registry_schema` / `prompt_firewall_schema`
- `reader_probe_schema` / `subjective_evaluation_schema` / `model_routing_schema`
- `database_storage_schema` / `ui_latency_schema`

세부 한정:
- **Craft Trait Library(§3.4b):** 작가 모방 금지 원칙은 유지. Phase 1에서는 **`trait_id`·`trait_name`·`category`·`source_type`·`evidence_level`·`style_safety_level` 정도의 stub만**. Selection·Decision Log·적용은 Phase 2+.
- **Character/Cast/Prompt Firewall(§3.6):** Phase 1에서는 **"Writer에 private/secret을 넘기지 않는다"는 원칙만 고정**(public_summary만 전달). 세부 Character Bible·Reveal Schedule·Creation/Promotion Gate는 후속 Phase.

### 10.3 UI/UX 범위 (이번 제안서: 구현 안 함)

이번 제안서는 UI/UX를 구현하지 않습니다. 다만 **후속 대시보드를 위해 필요한 데이터가 남도록 로그·스키마만 설계**합니다. 후속 UI에서 볼 수 있어야 할 항목(참고):
- 회차별 적용 trait / trait 선택 이유 / 제외 이유
- trait별 critic·gate 결과 / trait별 비용·속도 영향
- 이 회차가 어떤 기준으로 생성됐는지(Craft Decision Log 기반)
- 회차별 redacted field 수 / Writer에게 전달된 인물 정보 vs 차단된 인물 정보
- reveal leak prevented 로그
- Character/Cast 지표 / orphan reveal·orphan relationship 경고
- 인물별 공개 진행 상태(Reveal Schedule status) / Relationship Map 변화 이력

### 10.4 Implementation MVP Cut (Phase별 최소 구현)

설계가 강력하나 한 번에 구현하기엔 큽니다. **MVP는 최소 필드만**, 나머지는 후순위.

**MVP Character Set (먼저 구현):**
- Character Bible 최소: `character_id`·`name`·`role_in_story`·`importance_level`·`introduced_by`·`public_summary`·`private_backstory`·`constraints`
- Cast Registry 최소: `character_id`·`importance_level`·`allowed_scope`·`can_affect_main_plot`
- Reveal Schedule 최소: `reveal_id`·`character_id`·`allowed_episode_range`·`reveal_mode`·`forbidden_before`
- Relationship Map 최소: `relationship_id`·`from`·`to`·`relationship_type`·`initial_state`·`planned_turns`
- Prompt Firewall: 위 최소 필드로 redaction만 동작(public_summary는 Writer 허용 / private_backstory·secrets 차단)

**Advanced Later (후순위):**
- species_rules 상세 / Character Knowledge State 고도화 / Cast Promotion 자동 영향 분석
- trait별 reader_probe score 보정 / 세부 대시보드 UI

> MVP에서도 **"private_backstory는 Writer에 안 들어간다"** 는 firewall 원칙은 1순위로 지킴(누수 방지).

## 10.5 운영 아키텍처 (Operational Architecture)

창작 파이프라인 외에 **"누가 무엇을 맡고, 주관 품질을 어떻게 재고, 모델/키를 어디서 라우팅하고, DB에 무엇을 저장하고, 초기 화면은 무엇이며, 긴 생성 동안 사용자를 어떻게 안 지치게 하는가"** 를 설계합니다. (전부 설계·PENDING, 코드 0)

### 10.5.1 Agent Responsibility Matrix / RACI

**Director / Planner / Writer / QA 4핵심 에이전트 유지.** 이들이 "책임자". 나머지(Context Packager·Prompt Firewall·Scene Board Builder·Retrieval·Schema Canary·Reader Probe·Memory Committer·Observability Reporter)는 **처음엔 서브모듈/도구**, 호출량·복잡도 커질 때만 후속 Phase에서 독립 에이전트로 승격. Critic들은 **QA/Chief Editor 아래 judge role**, Producer는 비용/속도 예산 role(별도 핵심 에이전트 아님).

| Process | Responsible | Accountable | Consulted | Informed | Output |
|---|---|---|---|---|---|
| World Seed validation | Planner | Director | QA | Observability | validated seed |
| Authorial Intent Bible 생성/검수 | Director+Planner | Director | Theme Critic | QA | intent bible |
| Narrative Shape Mode 선택 | Director | Director | Planner | QA | shape mode |
| Craft Trait Selection | Planner | Director | Theme/Scene Critics | Observability | selected/rejected/suppressed traits |
| Series Blueprint 생성 | Director+Planner | Director | Creative Review Room | QA | blueprint candidate |
| Masterpiece Candidate Gates | QA/Gate Runner | Chief Editor | Director | Producer | pass/reject+reasons |
| Character Bible 생성 | Planner | Director | Emotion/Theme Critics | QA | Character Bible Store |
| Cast Registry 관리 | Planner | Director | Continuity Critic | QA | Cast Registry |
| Relationship Map 생성 | Planner | Director | Emotion Critic | QA | Relationship Map |
| Character Reveal Schedule 생성 | Planner | Director | Surprise/Continuity Critics | QA | Reveal Schedule |
| Episode Card 생성 | Director+Planner | Director | QA | Writer | Episode Card |
| Episode Contract 조립 | Planner+Context Packager | Director | QA | Writer | writer-safe Episode Contract |
| Context Packager / Prompt Firewall | Context Packager module | Director | Continuity Critic | Observability | redacted writer payload |
| Retrieval | Retrieval module | Planner | QA | Observability | retrieved events |
| Retrieval Canary | QA | Chief Editor | Planner | Observability | retrieval pass/fail |
| Scene Board / E-konte 생성 | Planner or Scene Board module | Director | Scene Critic | Writer | Scene Board |
| Writer 본문 생성 | Writer | Director | Scene Board/Prompt Firewall | QA | draft episode |
| Variant Drafting + Selection | Writer+Creative Review Room | Chief Editor | Producer | Director | selected draft+rejected reasons |
| Creative Review Room | Critics | Chief Editor | Producer | Director | revision request/pass |
| Immersion Gates | QA/Gate Runner | Chief Editor | Continuity/Language/Scene Critics | Director | PASS/reject |
| Reader Transportation Probe | QA/Reader Probe module | Chief Editor | Theme/Emotion Critics | Observability | immersion score |
| Event Ledger 추출 | QA or Memory module | Director | Writer | Observability | extracted events |
| Entity State 갱신 | Memory module | Director | QA | Observability | updated entity state |
| NMK commit | Memory Committer module | Director | QA/Gates | Observability | committed state+ledger |
| Schema Canary | QA | Chief Editor | Planner | Observability | schema pass/fail |
| Observability report | Observability module | Producer | Director | Developer | cost/latency/failure report |
| Director repair plan | Director | Director | Planner/QA | Writer | repair plan |
| Partial failure report | QA+Director | Director | Producer | Developer | failure report |

### 10.5.2 4핵심 에이전트 적정성

현재 4핵심 구조가 적절:
- **Director**: 최종 책임·라우팅·회차 목표·Scale 조절·repair plan·부분 실패 결정.
- **Planner**: 설계·검색·상태 조립·Character Bible/Cast Registry/Relationship Map/Reveal Schedule·Episode Contract 재료 준비.
- **Writer**: 본문 생성 전담. 설계 변경 금지. **Prompt Firewall 통과 정보만** 사용.
- **QA**: Gates·Canary·Reader Probe·Schema 검수·subjective judge orchestration·NMK commit 승인.

원칙: Critic = QA/Chief Editor 아래 role / Producer = 예산 관찰 role / Context Packager·Prompt Firewall·Retrieval·Memory Committer·Observability = 우선 deterministic/tool module. **호출량·복잡도·장애 격리 필요 시에만** 독립 에이전트 승격.

### 10.5.3 Subjective Evaluation Protocol (주관 품질 = rubric)

감으로 평가하지 않고 **1~5점 rubric**. 점수만 저장 안 하고 **근거 문장·실패 축·trace_id** 동반. 단일 judge를 진실로 안 봄.

- 고위험 회차 = **2개+ judge 또는 pairwise**. Writer와 같은 모델 계열 judge 회피.
- A/B 초안은 **순서 셔플**(position bias↓). **장황함 감점**(verbosity bias↓).
- threshold는 절대값 신뢰 금지 → Golden Fixtures·human spot-check로 보정(§10.5.4).

점수 기준: 5 우수(수정 불필요) / 4 통과(소개선) / 3 경계(warn·고위험 추가 judge) / 2 major(재작업) / 1 fatal(reject).
threshold: 평균 ≥4.0 pass / 3.0~4.0 warn(고위험 추가 judge) / <3.0 reject / **fatal 항목은 평균 무관 reject** / Reader Probe는 낮아도 자동 reject 아님(<3.0 → revision recommendation 또는 Chief Editor review).

평가 축: Scene Quality / Emotional Coherence / Theme Fidelity / Surprise·Freshness / Pacing / Reader Transportation.

근거(§14): G-Eval(rubric 기반 정렬), MT-Bench·Chatbot Arena(LLM-judge가 선호 근사하나 position·verbosity bias), Prometheus(custom rubric fine-grained), LLM-judge bias 연구(rubric·pairwise·셔플·judge 분리·human calibration).

### 10.5.4 Evaluation Calibration Plan

threshold는 구현 후 보정:
- Golden Fixtures 30~50개(좋은/나쁜/경계 장면) + 각 rubric expected verdict 사람 라벨링.
- LLM judge vs expected 차이 기록, 축별 FP/FN 측정, **2주기+ 조정 후 기본값 고정**. 모델/prompt/schema 변경 시 회귀 평가.

추적: judge_agreement_rate·human_judge_disagreement·false_positive_rate·false_negative_rate·borderline_rate·retry_success_rate·judge_cost_per_episode·judge_latency_p95·judge_position_bias_check·verbosity_bias_warning_count.

### 10.5.5 Model / LLM Key Routing

**LLM key는 절대 프론트엔드 노출 금지.** 서버 env/secret store에서만. Vite 클라이언트에 key 미전달. 서버 전용 `model_router.ts`. 요청마다 purpose·risk_level·budget_class·privacy_class 태깅. 호출 로그엔 provider/model/cost/latency/error_type만, **key는 절대 미기록**. Writer payload는 **Prompt Firewall 통과 후에만** 라우터로.

라우팅: deterministic guard(LLM 미사용) / embedding·retrieval(embedding key) / cheap classification(저가) / Planner(중간) / Writer(창의 고) / Review·Judge(Writer와 다른 모델 우선) / expensive judge(고위험·경계만) / Reader Probe(저가, 아크·최종화는 강화) / fallback(timeout·rate_limit 시 provider fallback 또는 partial failure).

```json
{ "llm_route": {
  "purpose": "writer | planner | judge | embedding | firewall | reader_probe",
  "risk_level": "low | medium | high",
  "budget_class": "cheap | standard | expensive",
  "privacy_class": "public | internal | private_redacted",
  "preferred_provider": "PENDING", "preferred_model": "PENDING",
  "fallback_model": "PENDING", "max_cost": 0.0, "timeout_ms": 0 } }
```

### 10.5.6 Database Storage Plan

헌법 Blackboard 문서 원칙 유지하되 저장 계층 분리:
- **MVP**: `.md`/`.json` = 사람이 읽는 승인/상태/설계 문서. SQLite 또는 local JSON = 단일 사용자 개발 런타임 저장소. 모든 스키마는 `docs/schemas.md`에서 먼저 고정.
- **Production 권장**: PostgreSQL 주 DB / **JSONB**(Character Bible·Episode Card·Reveal Schedule 등 유연 구조) + **GIN index** / **pgvector**(Retrieval Index·semantic search) / Event Ledger = **append-only table** / Entity State = current snapshot table(변경 근거는 Event Ledger 연결) / Observability span = 별도 trace/span table / **Draft 원문은 기본 미저장 — hash/snippet/object storage ref만**.

예시 테이블: works·seed_settings·authorial_intent·craft_traits·craft_decisions·series_blueprints·episode_cards·scene_boards·character_bibles·cast_registry·relationship_maps·reveal_schedules·events·entity_states·knowledge_states·retrieval_embeddings·gate_results·reader_probe_results·traces·spans·llm_calls·prompt_firewall_redactions.

근거(§14): PostgreSQL JSONB+GIN(구조+유연 검색), pgvector(벡터 유사검색), SQLite WAL(로컬 MVP, 백업·동시성 정책 명확화 필요).

### 10.5.7 Initial UI/UX Plan (구현 안 함, 화면 설계만)

- **New Work Wizard**: World Seed → Authorial Intent → Narrative Shape → Scale Mode.
- **Preflight Room**: Blueprint 생성 진행 / Character Bible·Relationship Map·Reveal Schedule 미리보기 / Candidate Gates 결과.
- **Episode Workspace**: 현재 Episode Card / Scene Board / Writer draft / Gate 결과 / Reader Probe 결과.
- **Cast & Reveal Dashboard**: 인물 목록 / 관계도 / 공개 일정 / 공개·힌트·비공개 상태.
- **Trace & Cost Dashboard**: agent별 시간 / LLM 비용 / redaction count / gate reject 원인.
- **Failure Report View**: 실패 축 / 재시도 이력 / repair plan / 사람 확인 버튼.

### 10.5.8 Long Generation UX / Latency Plan

생성이 오래 걸리므로 **멈춘 화면 금지.**
- 1초 내 클릭 반응/작업 시작 / 3초 내 현재 단계 / 10초 내 첫 유의미 산출물 또는 진행 로그.
- 기법: 단계 progress timeline(Seed→Intent→Trait→Blueprint→Character Bible→Relationship Map→Gates→Ready) / **artifact-first rendering**(완료 조각부터) / streaming **상태 문구만**(raw prompt 아님) / pre-render next 1~3화 / background queue(다른 탭 탐색 가능) / 시작 전 예상 비용·시간 / cancel·pause·resume / partial failure는 빈 화면 대신 실패 내용 표시 / progressive disclosure(초보 요약·고급 trace) / 완료 알림 / cached previews / suspense-free(어떤 단계·어떤 산출물인지 표시).

근거(§14): Nielsen HCI 응답시간(0.1/1/10초 경계), TTFT·Time-To-First-Useful-Artifact 체감 중요, streaming·skeleton·progressive disclosure·background job·pre-render.

> §9 관측에 UX 지연 지표 추가: time_to_first_status·time_to_first_artifact·time_to_first_token·total_generation_time·phase_duration_p50/p95·user_cancel/pause/resume_rate·pre_render_hit_rate·cache_hit_rate·background_job_failure_rate.

### 10.5.9 CLAUDE.md 정합성 검토 (이 제안서 범위 밖, 별도 승인)

**CLAUDE.md는 immutable router** — 세부 운영 규칙을 길게 넣지 않는다(헌법 §1·§5). 위 운영 설계는 **세부 규칙이 아니라 라우팅으로** 다룬다.

- **결정 기준:** 한 주제가 (a) 한두 단락이면 **기존 routed doc에 흡수**(CLAUDE.md 변경 없음). (b) 독립 문서가 필요할 만큼 커지면 **새 문서 생성 + CLAUDE.md §5에 경로만 1줄 추가.**
- 권장 매핑:
  - RACI/책임 → `docs/agent_interaction_protocol.md`(흡수, CLAUDE.md 변경 없음)
  - 평가/rubric/calibration → 신규 `docs/evaluation.md`(분량 큼 → 신규 + 라우팅)
  - Model/Key Routing → 신규 `docs/model_routing.md`(보안 민감 → 신규 + 라우팅)
  - DB Storage → `docs/architecture.md` 흡수, 커지면 신규 `docs/storage.md`
  - UI/UX·Latency → `docs/architecture.md` 흡수, 커지면 신규 `docs/ui_ux.md`
  - Observability/Latency 지표 → `docs/runbook.md`·`docs/testing.md` 흡수
- **이번 제안서에서는 CLAUDE.md를 수정하지 않는다.** 신규 routed doc이 실제로 필요해지는 구현 Phase에서, **CLAUDE.md §5에 경로 1줄 추가**를 별도 제안·승인으로 처리(헌법 §3).

## 11. 예상 부작용

- 큰 그림·다축 게이트·관측까지 설계라 당장 동작물 없음(전부 설계). 대신 구현·운영 흔들림 감소.
- 게이트 10축 + 캐스케이드 + 관측으로 설계 복잡도↑. 단 비용은 예산·캐스케이드로 통제.
- 캐스케이드 임계치·비용/속도 예산·게이트 기준은 측정 전 PENDING → Phase 4 실측 필요.
- 관측 로그는 잘못 켜면 비용·저장·프라이버시 위험 → 기본 off + id/hash/snippet + 개발 플래그 제한으로 완화.
- 한국어 기본 강제 → 의도된 외국어 장치 과탐지 위험 → 캐스케이드 2단으로 완화.
- 소지품 미추적 계승 → 소지품 모순은 못 잡음(의도).
- 이번에도 **코드 0줄.** 빌드/동작 영향 없음.

## 12. 대안

- **대안 A: "일관성 보존"만 유지** — 감정·톤·언어·장면성 붕괴 놓침. 범위 좁음.
- **대안 B: 모든 게이트 항상 LLM judge** — 정확하나 비용 폭증, 장편/시리즈 비현실.
- **대안 C: 몰입 보존 + 10축 + 캐스케이드 + 예산 + 관측 (추천)** — 다축 차단, 비용 통제, 운영 가시성 확보. 문서만이라 위험 낮음.

메모리 방식: 요약만(기각·반복) / 전체 본문(기각·비용) / **NMK 무손실+검색+게이트(채택)**.

## 13. 쉬운 비유

장편 웹소설 출판사입니다.

1. **시드 입력** = 작가 기획서 한 장(+규모 선택). 도장 찍으면 못 바꾸는 설정집 1페이지.
2. **Director** = 편집장. 규모에 맞춰 일정 짜고 매 화 목표 줌. 작가가 두 번 고쳐도 안 되면 **수습안(repair plan)** 을 직접 냄. 그래도 안 되면 "이 회차 막혔습니다" 보고서 내고 멈춤.
3. **Planner→Writer** = 콘티(싸게) → 작가(창의). 작가는 사건 장부를 들춰 씀.
4. **Episode Contract** = 작가에게 주는 "발췌본 + 이번 화 목표 메모"(예: 이번 화는 긴장). 사건 나열 말고 장면을 쓰게.
5. **NMK** = 자료실: 절대 설정집 / 인물 현황판 / **사건 장부(빠짐없이, 틀리면 지우지 말고 정정)** / 빠른 요약 / 색인 / 발췌본.
6. **Craft Trait Library** = 작가를 베끼지 않고 "여백·복선 회수·대사 절제" 같은 **창작 장점만 추상으로** 골라 쓰는 양념 선반. 많이 넣는다고 좋은 게 아니라 예산 안에서.
7. **Variant Drafting** = 반전·결말 같은 **중요한 회차에서만** 작가가 2~3개 초안을 쓰고 편집장이 고름.
8. **인물 관리** = 인물은 "본문에 나온 이름"이 아니라 **장기 자산**:
   - **Character Bible**(설정집: 성격·과거·비밀·종족) / **Cast Registry**(전 인물 등록부, 즉석 인물은 기본 단역) / **Relationship Map**(관계도) / **Character Reveal Schedule**(언제 무엇을 공개할지 일정).
   - **Character Creation Gate** = 작가가 인물을 함부로 못 늘리게(기존 인물로 되면 거절). **Cast Promotion Gate** = 단역을 주연으로 올릴 때만 거치는 승인.
   - 핵심: **AI/작가가 아는 설정 ≠ 독자가 지금 알아야 할 것.** 1화에 다 설명하면 반려.
   - **Prompt Firewall** = 작가에게 설정집 전체를 주지 않고, 이번 화에서 공개해도 되는 쪽지만 건네는 비서. 비밀 서류는 편집장과 검수팀만 본다.
9. **Immersion Gates** = 교정팀 10명(설정·죽은 사람·재탕·감정·작가의도·장르·외국어·밋밋한 요약문·**페이싱**·**인물 공개/난립**). 자동검사기→신입→베테랑 순.
10. **Reader Transportation Probe** = "독자가 진짜 이야기에 빨려 들어갔나"를 회차마다 점검(특히 아크 끝·최종화).
11. **계측·대시보드** = 사무실 스톱워치 + 기록. 누가 느린지·어떤 trait/인물이 자주 문제인지 적되, 평소엔 꺼두고 원고 전문은 안 베끼고 요지·번호만.
12. **운영 살림** = 누가 무엇을 맡는지 업무 분장표(RACI, 4핵심 = Director·Planner·Writer·QA). 품질은 감이 아니라 **채점표(1~5점, 근거 적기)**. 작가와 **다른 채점관**을 쓰고 순서를 섞어 편애를 줄임. **금고 열쇠(LLM key)는 사무실 서버에만**, 손님 화면엔 안 줌. 자료는 파일+DB에 나눠 보관(원고 전문은 안 쌓음).
13. **기다림 설계** = 오래 걸려도 빈 화면 금지. **다 끝나기 전에 완성된 조각부터 보여줌**(인물 설정집·관계도 먼저), "지금 무슨 단계인지" 표시, 다음 화 미리 준비, 취소·일시정지 가능.
14. **완결** = 목표 화수 도달. 단편→장편 길어지면 **승격**(기록은 안 버림).

핵심 정신: **"설계부터 잠그고(편집실), 장면으로 쓰고, 몰입 깨는 10가지를 값싼 검사부터. 인물은 설정집·관계도·공개 일정·승격 절차가 있는 장기 자산으로 관리하고, AI가 아는 설정과 독자가 지금 알 설정을 분리해 초반 폭로·인물 난립을 막는다. 사건은 요약 말고 장부에(정정만). 한국어 기본·외국어는 필요할 때만. 통과 못 한 글은 기록에 안 넣음. 만들기 전 테스트부터."**

## 14. 참고 문헌 — 검증된 주장 vs 참고 방향

### 14.1 검증된 주장 (출처에서 직접 확인)
- **Generative Agents** (Park et al. 2023, arXiv:2304.03442): 사건을 메모리 스트림에 저장, **검색 점수=최신성×관련성×중요도**, reflection으로 상위 요약. — https://arxiv.org/abs/2304.03442

### 14.2 참고 방향 (개념·설계 방향만, 수치 단언 안 함)
- **DOME** (Wang et al. 2024, arXiv:2412.13575): **동적 계층 아웃라인 + 시간 지식그래프(TKG) 메모리 + 충돌 감소 방향**까지 참고(추상 페이지에서 확인 가능한 범위). 충돌률·노드 수·API 호출 같은 **정량 수치는 PDF 표/섹션 재확인 전까지 단언하지 않음.** — https://arxiv.org/abs/2412.13575
- **MemGPT** (arXiv:2310.08560): 메인/외부 계층 메모리·페이징 발상 → NMK 계층 분리 참고. — https://arxiv.org/abs/2310.08560
- **Re3** (Yang et al. 2022, arXiv:2210.06774): 계획+현재 story state 반복 주입 + continuation rerank·revision → **Variant Drafting+Selection(§5.6)·Episode Contract 상태 주입** 근거. — https://arxiv.org/abs/2210.06774
- **DOC** (Yang et al. 2023, arXiv:2212.10077): 상세 아웃라인 → 전개/반복 가드 참고. — https://arxiv.org/abs/2212.10077
- **CritiCS** (Collective Critics for Creative Story Generation, arXiv:2410.02428): 다중 비평자 + 리더 반복 개선 → **Creative Review Room(§5.5)·Variant Selection** 근거. — https://arxiv.org/abs/2410.02428
- **CONCOCT** (arXiv:2311.04459): 장편 아웃라인에서 **페이싱·구체성 조절**이 중요 → **Pacing Gate(§6.5)·Scene Board** 근거. — https://arxiv.org/abs/2311.04459
- **W3C Trace Context / OpenTelemetry**: `trace_id`·`span_id`·parent/linked span 개념 → 관측·대시보드 추적 모델(§9.1)의 엔지니어링 참고. — W3C Trace Context: https://www.w3.org/TR/trace-context/ , OpenTelemetry Trace API: https://opentelemetry.io/docs/specs/otel/trace/api/

운영 아키텍처(§10.5) 근거:
- **G-Eval** (Liu et al. 2023, arXiv:2303.16634): coherence·consistency·fluency·relevance rubric 기반 LLM 평가의 human alignment → **Subjective Evaluation Protocol(§10.5.3)** 근거. — https://arxiv.org/abs/2303.16634
- **MT-Bench / Chatbot Arena** (Zheng et al. 2023, arXiv:2306.05685): LLM-as-a-judge가 human preference 근사, 단 position·verbosity·self-preference bias → judge 분리·셔플·감점 근거. — https://arxiv.org/abs/2306.05685
- **Prometheus** (Kim et al. 2023, arXiv:2310.08491): custom rubric 기반 fine-grained evaluator → rubric 설계 참고. — https://arxiv.org/abs/2310.08491
- **PostgreSQL JSONB / GIN index**: 유연 JSON 구조 + key/value 검색 → §10.5.6. — https://www.postgresql.org/docs/current/datatype-json.html
- **pgvector**: PostgreSQL 내 vector similarity search → Retrieval Index. — https://github.com/pgvector/pgvector
- **SQLite WAL**: 로컬 MVP 저장소(백업·동시성 정책 명확화 필요). — https://www.sqlite.org/wal.html
- **Nielsen response-time thresholds** (0.1s/1s/10s HCI 경계): 장시간 생성 UX(§10.5.8) 기준. — https://www.nngroup.com/articles/response-times-3-important-limits/
- **Narrative Transportation** (Green & Brock 2000, *J. Personality and Social Psychology* 79(5):701–721): 몰입을 **주의 집중·정서 관여·심상 형성**으로 설명 → **Reader Transportation Probe(§6.7)** 근거. (심리학 이론, arXiv 아님)
- **Lost in Stories** (arXiv:2603.05890): 일관성 버그 유형화 → 게이트 축 설계 참고. — https://arxiv.org/abs/2603.05890
- **A Survey on LLMs for Story Generation** (EMNLP 2025 Findings) — https://aclanthology.org/2025.findings-emnlp.750.pdf
- Awesome-Story-Generation — https://github.com/yingpengma/Awesome-Story-Generation

> 캐스케이드(결정론→저가→고가)·관측/프로파일링은 일반 엔지니어링 패턴으로 특정 논문 수치 근거 없음. Craft Trait Library는 특정 작가 모방이 아니라 작품론·서사이론에서 추상화한 참고 방향이며, 작가명은 생성 지시에 들어가지 않음(§3.4b.1). 정량 임계치는 구현 후 실측.

## 15. 승인 체크리스트

승인은 두 묶음으로 나눕니다. **Foundation Approval**은 이번 승인으로 확정·구현 진입하는 핵심 구조이고, **Deferred Architecture**는 방향만 승인하고 구현은 후속 제안서에서 세부 승인합니다.

### 15.1 Foundation Approval (이번 승인으로 확정 — Phase 1 MVP)

- [ ] 문서 전체를 한국어 UTF-8(BOM 없음)로 유지한다.
- [ ] 프레임을 몰입 보존형 자동 장편 생성 파이프라인으로 확정한다.
- [ ] **Phase 1 범위 제한** = Seed + Authorial Intent + Narrative Shape + 최소 Blueprint/Episode Card 저장(§10 로드맵).
- [ ] **MVP 필수 스키마만 Phase 1 고정**(§10.2): seed_settings·canonical_store·authorial_intent_bible·narrative_shape_mode·basic_series_blueprint·basic_episode_card·fixture_schema·observability_telemetry_schema.
- [ ] **Authorial Intent Bible**(남길 감각·왜·정서·클리셰·마지막 이미지·여백)을 Seed 이후·Blueprint 이전에 둔다.
- [ ] **Narrative Shape Mode**(conflict_arc/kishotenketsu/mystery_reveal/journey_return/slice_of_life_accumulation)와 Blueprint·Episode Card 영향을 명세한다.
- [ ] **Editorial Room/Preflight 골격**: Series Blueprint·Episode Card·Masterpiece Candidate Gates(14축, 인물 설계 포함)·Locked(Hard/Soft/Fluid)·버튼 UX·지연 회차 생성·순서 강제(설계→검수→잠금→회차).
- [ ] **NMK 7컴포넌트**를 책임 분리 유지하고, Event Ledger에 `provenance`·`source_text`·`schema_version`·`confidence` + correction/supersession + 시간·지식 관계(§5.1.2)를 둔다.
- [ ] **Immersion Gates 10축**(8 + Pacing 9번 + 인물·노출 10번) 골격과 **게이트 실패 정책**(reject 본문 commit 금지 → 2회 재시도 → repair plan → 부분 실패 정지)을 명시한다.
- [ ] **"Writer에 private/secret 미전달" firewall 원칙**을 Phase 1부터 고정(public_summary만 전달).
- [ ] **관측 기본**: span(`trace_id`/`span_id`/`parent_span_id`)·LLM 호출 분리·로그 4단계·보존/샘플링·SRE 4신호·Golden Fixtures + Retrieval Canary.
- [ ] **"명작 보장"이 아니라 Masterpiece Candidate(후보 자격)** 로 정의한다.
- [ ] **CLAUDE.md 미수정**(§10.5.9). 신규 routed doc 필요 시 구현 Phase에서 §5에 경로 1줄만 별도 승인.
- [ ] 승인된 이 제안서를 날짜별 아카이브에 보관한다.

### 15.2 Deferred Architecture (방향 승인, 구현은 후속 제안서에서 세부 승인)

- [ ] **Craft Trait Library / Authorial Virtue Matrix**: 작가 모방 금지 원칙 유지. **Phase 1은 stub만**(trait_id·name·category·source_type·evidence_level·style_safety_level). Selection(+Budget)·산출물 적용·Decision Log(selected/rejected/suppressed)·trait↔Reader Probe 집계는 Phase 2+.
- [ ] **Character/Cast/Prompt Firewall 세부**: Character Bible·Cast Registry·Relationship Map·Reveal Schedule·Creation/Promotion Gate·Agent-created Policy·정보등급(visibility/prompt_access)·lifecycle·Cross-link/Schema Canary·비인간 species_rules — 후속 Phase.
- [ ] **Creative Review Room**(Critic 8역 + Chief Editor/Producer, Scale·위험도 캐스케이드) — 후속.
- [ ] **Reader Transportation Probe**(심상·정서·현실감·견인·잔향, 아크/최종화 강화) — 후속.
- [ ] **Variant Drafting + Selection**(고위험 회차 한정) — 후속.
- [ ] **Blueprint Revision Impact Analysis**(Soft Lock 변경 영향·recheck_scope) — 후속.
- [ ] **Scene Board / E-konte**(Sensory Anchor·Negative Space·인물 필드) — 후속.
- [ ] **Theme Ledger·Character Contradiction Ledger** 상세 — 후속.
- [ ] **운영 아키텍처(§10.5)**: RACI / Subjective Evaluation Protocol(rubric 1~5·judge 분리·셔플·verbosity 감점) / Calibration / Model·Key Routing(키 프론트 미노출) / DB Storage(PostgreSQL JSONB·pgvector·append-only) / Initial UI/UX 6화면 / Long Generation UX·Latency — 후속.
- [ ] **Exposition Control Gate(10번 축)** 세부 reject(character_reveal_leak·cast_sprawl·unauthorized_major_character·relationship_jump·exposition_dump·species_rule_violation) — 후속.
- [ ] 관측 확장(Craft Trait·인물·정보누수·UX 지연·주관평가 지표), 픽스처 확장(Positive·Craft Trait·인물·Firewall/Canary), 후속 stub 스키마 9종 — 후속.
- [ ] 참고문헌 정확 서지(Re3·CritiCS 2410.02428·CONCOCT 2311.04459·DOME·Green&Brock 2000·G-Eval·MT-Bench/Arena·Prometheus·PostgreSQL JSONB·pgvector·SQLite WAL·Nielsen·W3C Trace Context/OpenTelemetry) 유지.
- [ ] DOME 정량 수치는 참고 방향으로 낮춤(검증된 주장은 출처 확인분만).

### 15.3 1차 시작 가능 기준 (Definition of Ready)

아래가 모두 충족되면 Phase 1 구현을 시작할 수 있습니다.

- [ ] 문서 전체 한국어 UTF-8(BOM 없음) 정상.
- [ ] **MVP 필수 스키마 목록 확정**(§10.2: seed_settings·canonical_store·authorial_intent_bible·narrative_shape_mode·basic_series_blueprint·basic_episode_card·fixture_schema·observability_telemetry_schema).
- [ ] **Phase 1 범위가 Seed/Intent/Shape/Basic Blueprint 저장으로 제한**됨을 합의.
- [ ] **후속 stub은 구현하지 않음**(Craft Trait·Character Firewall 세부·Creative Review·Reader Probe·운영 아키텍처는 방향만).
- [ ] 단, **"Writer에 private/secret 미전달" firewall 원칙은 Phase 1부터 적용**.
- [ ] 승인(`APPROVE: proceed`) 후 이 제안서를 날짜별 아카이브에 보관.

## 16. 승인 요청

보고서를 확인한 뒤 승인하려면 아래 문구로 답변해 주세요.

`APPROVE: proceed`

수정 요청은 `REVISE: <무엇>`, 거절은 `REJECT: <이유>`.
