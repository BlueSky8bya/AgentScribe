<!-- [PROPOSAL: docs/proposals/archive/2026-06-08/proposal_pipeline_foundation_v001.md] Pipeline Foundation v001 (approved) -->
# ADR: Immersion-Preserving Pipeline + Foundation MVP Cut

- 날짜: 2026-06-08 / 상태: Accepted

## Context

장편 자동 생성에서 사실 일관성만으로는 몰입이 유지되지 않음(감정 단절·반복·요약문화·언어 혼입·초반 설정 폭로·인물 난립). 설계 범위가 매우 커서 1차 구현 과부하 위험.

## Decision

1. **몰입 보존 프레임** + Preflight(설계 잠금 후 회차 생성) + NMK(무손실 Event Ledger + 검색) + Immersion Gates 10축 캐스케이드를 표준 아키텍처로 채택.
2. **Foundation MVP Cut**: Phase 1은 Seed/Intent/Shape/Basic Blueprint 저장 + MVP 스키마 8종만. 풍부한 설계(Craft Trait·인물 관리·Review·Probe·운영)는 방향 확정·후속 Phase 구현.
3. **정보 누수 차단**: Prompt Firewall("Writer에 private/secret 미전달")은 Phase 1부터 하드 규칙.
4. **CLAUDE.md는 router 유지** — 세부는 routed docs로, 신규 문서 필요 시 §5 경로만 추가.

## Consequences

- 초기 구현 부담↓, 방향 흔들림↓. 단 후속 Phase 다수 필요(단계별 승인).
- 소지품(인벤토리) 추적은 계속 제외(과거 과복잡 교훈).
- 정량 임계치·예산·게이트 기준은 구현 후 실측·보정.
