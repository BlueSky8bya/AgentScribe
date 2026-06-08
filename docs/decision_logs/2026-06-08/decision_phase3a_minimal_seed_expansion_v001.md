<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_phase3a_minimal_seed_expansion_v001.md] Phase 3A (approved + implemented) -->
# Decision Log: Phase 3A — Minimal Seed + Auto-Expansion

- 날짜: 2026-06-08 / 상태: APPROVED + IMPLEMENTED
- 제안서: `docs/proposals/archive/2026-06-08/proposal_phase3a_minimal_seed_expansion_v001.md`

## 구현 결정

- 최소 시드만 입력(제목/장르/분위기/배경/인물[이름·역할·성별·간단성격]/세계규칙/길이). 나머지는 자동 초안.
- **3A는 LLM 없음** — `DeterministicExpander`(규칙/아키타입). 진짜 LLM은 3B(서버+model_router, key 서버보관)로 분리.
- 작품 길이 = 단편/중편/장편/시리즈 버튼. 내부 ScaleCheck(declared vs effective_scale, consistency, override_reason)로 자동 맞춤 — 내부 필드명 화면 미노출. Blueprint/Gates/Expander는 effective_scale 기준.
- Scale 기본값 = AgentScribe 초기 운영값(문학 기준 아님), 회차×글자, 1화 5000자, 조정 가능.
- Mixed-initiative: 생성물은 제안(provenance agent_preflight), 사용자 수락/삭제(ExpandReview). Canonical은 에이전트 미수정(firewall).
- WorkRecord 0.2.0 -> 0.3.0(world_rules·scale_check·gender·personality_brief) + chained migrate.
- CLAUDE.md section 2에 비전문가 오너용 제안서 규칙 추가(영어).

## 검증

- `npm test` 28/28, `npm run build`, `npm run lint`(eslint + doc-lang) 통과.
- 수동 UI smoke: 개발자 단계(브라우저). 흐름 Wizard -> ExpandReview -> Preflight Room. 로직은 테스트로 검증.

## 후속

Phase 3B = LLM expander + 서버 model_router(별도 제안). Phase 4 = Writer 회차 생성.
