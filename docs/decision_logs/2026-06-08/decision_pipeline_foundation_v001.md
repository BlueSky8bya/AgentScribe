<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# Decision Log: Pipeline Foundation v001

- 날짜: 2026-06-08
- 상태: APPROVED (`APPROVE: proceed`)
- 제안서: `docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md`

## 결정 요지

몰입 보존형 자동 장편 생성 파이프라인 전체 설계를 **문서로 확정**(구현 아님). 다수 REVISE를 거쳐 다음을 확정:

- 프레임: 일관성 보존 → **몰입 보존**.
- Editorial Room/Preflight(설계 먼저 잠그고 회차 생성), Locked Blueprint(Hard/Soft/Fluid).
- NMK 7컴포넌트(Event Ledger 무손실 + 검색 + 충돌검사), 시간·지식 관계.
- Immersion Gates 10축 + 캐스케이드 + 실패 정책(commit 금지→2회→repair plan→부분 실패 정지).
- Craft Trait Library(작가 모방 금지, 추상 특성), Character/Cast/Prompt Firewall(private 미전달), Creative Review Room, Reader Probe, Variant Drafting.
- 운영 아키텍처: RACI(4핵심), Subjective Evaluation(rubric), Model/Key Routing(키 프론트 미노출), DB(PostgreSQL/JSONB/pgvector), UI/UX·Latency.

## 핵심 결정: Foundation MVP Cut

- **Phase 1 범위 = Seed + Intent + Shape + 최소 Blueprint 저장.** MVP 필수 스키마 8종만 고정.
- 나머지(Craft Trait·인물 관리·Review·Probe·운영)는 **방향만, 후속 Phase 별도 제안.**
- 단 **"Writer에 private/secret 미전달" firewall 원칙은 Phase 1부터.**

## 출처 처리

- DOME 정량 수치 → 참고 방향으로 강등. 검증된 주장은 출처 확인분만.
- 서지: Re3·CritiCS(2410.02428)·CONCOCT(2311.04459)·G-Eval(2303.16634)·MT-Bench/Arena(2306.05685)·Prometheus(2310.08491)·Green&Brock 2000·PostgreSQL JSONB·pgvector·SQLite WAL·Nielsen·W3C Trace Context/OpenTelemetry. CritiCS/CONCOCT ID는 사용자 제공분, 구현 시 재확인 권장.

## CLAUDE.md

이번 변경에서 **CLAUDE.md 미수정**(헌법=router). 신규 routed doc 필요 시 구현 Phase에서 §5에 경로 1줄만 별도 승인.

## 반영 문서

architecture.md / agents.md / schemas.md / testing.md / agent_interaction_protocol.md / state.md / backlog.md 갱신(stub → 승인 설계, 추적 주석 부착).

## 후속

Phase 1 구현 = 별도 제안서(DOC BEFORE CODE).
