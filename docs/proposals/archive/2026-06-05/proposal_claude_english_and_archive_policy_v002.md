# 제안서: `CLAUDE.md` 영어화 및 변경 이력 보관 시스템 도입

## 1. 도입 목적

현재 루트 경로에 `CLAUDE.md`가 이미 존재합니다. 내용은 프로젝트 철학과 우로보로스 프로토콜을 잘 담고 있지만, 전체가 한국어로 작성되어 있어 코딩 에이전트가 매번 읽기에는 토큰 효율이 낮습니다.

이번 변경의 목적은 `CLAUDE.md`를 **코딩 에이전트가 반복해서 읽는 최상위 헌법**에 맞게 영어 중심으로 정리하고, 중요한 규칙을 문서의 앞부분과 마지막 부분에 집중 배치하는 것입니다.

동시에 개발자가 읽는 문서와 에이전트가 읽는 문서의 언어 원칙을 분리합니다.

- 에이전트가 읽는 지침서, 프롬프트, 라우팅 문서: 기본 영어, 짧고 구조화된 문장
- 개발자가 읽는 결재 보고서, 설명, 승인 요청: 기본 한국어, 쉬운 비유와 예시 포함

추가로, `LATEST_PROPOSAL.md`만 유지하면 이전 결재안의 내용이 덮어써져서 나중에 “언제, 어떤 이유로, 어디를 바꿨는지” 추적하기 어렵습니다. 따라서 이번 변경에는 **현재 제안서와 과거 제안서 아카이브를 동시에 운영하는 이력 보관 시스템**도 포함합니다.

## 2. 변경 내용

`CLAUDE.md`를 업데이트합니다.

주요 반영 사항:

- 코딩 에이전트용 최상위 헌법은 영어로 작성한다.
- 중요한 내용은 문서 초반과 후반에 반복 배치한다.
- 앞으로 에이전트에게 요청할 프롬프트나 에이전트가 읽는 지침은 가능한 한 영어로 작성한다.
- 개발자가 읽는 문서(`docs/proposals/LATEST_PROPOSAL.md` 등)는 한국어로 작성한다.
- 개발자용 설명은 쉬운 비유, 출판사 업무 비유, 일상 사물 비유, 텍스트 기반 UI 스켈레톤을 사용한다.
- 모든 한글 문서는 UTF-8로 저장하고, 인코딩 깨짐이 보이면 먼저 복구 대상으로 판단한다.
- 승인 문구는 `APPROVE: proceed`, `REVISE: ...`, `REJECT: ...`로 통일한다.
- 제한적 예외를 명시한다.
- `LATEST_PROPOSAL.md`는 현재 검토 중인 최신 결재안으로만 사용한다.
- 승인되거나 반려된 제안서는 날짜별 폴더에 버전명으로 보관한다.
- 제안서뿐 아니라 이력 추적이 중요한 문서 영역에도 날짜별/버전별 보관 원칙을 둔다.
- 추가 라우팅을 포함한다.
  - `docs/change_protocol.md`
  - `docs/proposals/PROPOSAL_TEMPLATE.md`
  - `docs/proposals/archive/YYYY-MM-DD/proposal_<version>.md`
  - `docs/testing.md`
  - `docs/test_reports/YYYY-MM-DD/test_<version>.md`
  - `docs/runbook.md`
  - `docs/schemas.md`
  - `docs/adr/`
  - `docs/decision_logs/YYYY-MM-DD/decision_<version>.md`
  - `docs/state_snapshots/YYYY-MM-DD/state_<version>.md`

### 변경 이력 보관 구조

권장 구조는 아래와 같습니다.

```text
docs/
  proposals/
    LATEST_PROPOSAL.md
    PROPOSAL_TEMPLATE.md
    archive/
      2026-06-05/
        proposal_claude_constitution_v001.md
        proposal_history_archive_v001.md
  adr/
    2026-06-05/
      adr_blackboard_pattern_v001.md
  decision_logs/
    2026-06-05/
      decision_claude_language_policy_v001.md
  state_snapshots/
    2026-06-05/
      state_before_claude_update_v001.md
  test_reports/
    2026-06-05/
      test_claude_doc_encoding_v001.md
```

파일명 규칙:

- 제안서: `proposal_<topic>_vNNN.md`
- 결정 기록: `decision_<topic>_vNNN.md`
- 상태 스냅샷: `state_<topic>_vNNN.md`
- 테스트/검증 보고서: `test_<topic>_vNNN.md`
- 날짜 폴더: `YYYY-MM-DD`
- 임의 난수형 이름보다 사람이 읽을 수 있는 주제명과 버전 번호를 우선한다.

예시:

- `docs/proposals/archive/2026-06-05/proposal_claude_constitution_v001.md`
- `docs/proposals/archive/2026-06-05/proposal_archive_policy_v002.md`
- `docs/decision_logs/2026-06-05/decision_agent_facing_english_v001.md`

## 3. 예상 부작용

- `CLAUDE.md`가 영어로 바뀌므로 개발자가 직접 읽을 때는 이전보다 덜 친숙할 수 있습니다.
- 대신 개발자가 읽는 모든 결재 보고서와 설명은 한국어로 유지하므로, 실제 의사결정 문서는 더 명확해집니다.
- 기존 한국어 `CLAUDE.md`의 표현 중 일부는 짧은 영어 규칙으로 압축되며, 감성적인 설명은 줄어듭니다.
- 라우팅된 문서 중 아직 없는 파일은 이후 별도 승인 절차를 거쳐 생성해야 합니다.
- 날짜별 아카이브 폴더가 늘어나 문서 수가 증가합니다.
- 파일명 규칙을 지키지 않으면 오히려 이력 탐색이 어려워질 수 있습니다.
- `LATEST_PROPOSAL.md`와 아카이브 파일을 함께 관리해야 하므로, 제안서 승인/반려 시 보관 절차가 한 단계 추가됩니다.

## 4. 대안

### 대안 1: 현재 한국어 `CLAUDE.md` 유지

개발자가 읽기에는 편하지만, 코딩 에이전트가 매번 읽는 최상위 지침으로는 토큰 비용이 큽니다.

### 대안 2: 한국어와 영어를 모두 길게 병기

이해도는 높지만 토큰 절약 목적에 맞지 않습니다. 최상위 헌법이 다시 비대해질 위험도 있습니다.

### 대안 3: `CLAUDE.md`는 영어로 압축하고, 개발자용 보고서는 한국어로 분리

추천안입니다. 에이전트 실행 효율과 개발자 의사결정 편의성을 동시에 챙길 수 있습니다.

### 대안 4: `LATEST_PROPOSAL.md`만 유지

가장 단순하지만, 이전 보고서가 계속 덮어써져서 나중에 롤백이나 원인 추적이 어렵습니다.

### 대안 5: 날짜별 아카이브와 최신 제안서를 함께 운영

추천안입니다. `LATEST_PROPOSAL.md`는 현재 결재용 창구로 유지하고, 승인/반려된 제안서는 날짜별 폴더에 영구 보관합니다.

## 5. 쉬운 비유

`CLAUDE.md`는 에이전트가 매번 들고 다니는 “작은 업무 수첩”입니다.

수첩에는 긴 설명보다 “출근하면 상태 문서 읽기”, “변경 전 결재 올리기”, “모호하면 질문하기”처럼 짧은 체크 규칙이 적혀 있어야 합니다.

반대로 개발자가 결재하는 제안서는 “출판사 내부 기획안”입니다. 기획안은 사람이 읽고 판단해야 하므로 한국어로, 쉬운 비유와 예상 부작용까지 적혀 있어야 합니다.

변경 이력 아카이브는 출판사의 “결재 문서 보관함”입니다.

오늘 책 표지를 왜 바꿨는지, 지난주에 왜 교정 기준을 바꿨는지 문서가 남아 있어야 나중에 문제가 생겼을 때 되돌릴 수 있습니다. `LATEST_PROPOSAL.md`는 책상 위에 놓인 현재 결재 문서이고, `archive/YYYY-MM-DD/`는 날짜별 문서철입니다.

## 6. 문서 스켈레톤

업데이트될 `CLAUDE.md`는 대략 아래 구조를 가집니다.

```md
# AGENTSCRIBE CONSTITUTION

## Critical Rules First
## Role
## Core Philosophy
## Communication Language Policy
## Ouroboros Change Protocol
## Session Start Checklist
## Dynamic Routing Directory
## Approval Language
## Limited Exceptions
## Final Enforcement
```

핵심 규칙 예시:

```md
- Agent-facing instructions should be written in concise English to reduce recurring context cost.
- Developer-facing proposals must be written in Korean with plain examples, analogies, side effects, and checklists.
- If a Korean document is unreadable because of encoding damage, treat encoding recovery as the first task.
```

개발자용 설명 규칙 예시:

```md
When explaining complex architecture, design patterns, libraries, or UI changes to the developer, use Korean, plain language, a publishing-house analogy or everyday analogy, and a text-based UI skeleton when relevant.
```

## 7. 승인 체크리스트

아래 항목을 승인하면 실제 `CLAUDE.md` 업데이트와 이력 보관 구조 도입을 진행합니다.

- [ ] `CLAUDE.md`를 영어 기반 토큰 절약형 헌법으로 업데이트한다.
- [ ] 중요한 규칙을 문서 초반과 후반에 집중 배치한다.
- [ ] 에이전트가 읽는 지침/프롬프트는 영어로 작성한다는 원칙을 포함한다.
- [ ] 개발자가 읽는 결재 보고서/설명은 한국어로 작성한다는 원칙을 포함한다.
- [ ] 개발자 설명에는 쉬운 비유, 출판사 업무 비유, 일상 예시, 필요 시 텍스트 UI 스켈레톤을 사용한다는 규칙을 포함한다.
- [ ] UTF-8 인코딩 규칙과 인코딩 깨짐 복구 우선 원칙을 포함한다.
- [ ] 승인 문구와 제한적 예외를 유지한다.
- [ ] 변경 거버넌스, 제안서 템플릿, 테스트, 실행 절차, 스키마, ADR 라우팅을 포함한다.
- [ ] `LATEST_PROPOSAL.md`는 현재 결재안으로만 사용하고, 승인/반려된 제안서는 날짜별 아카이브에 보관한다.
- [ ] 제안서, 결정 기록, 상태 스냅샷, 테스트 보고서에 날짜별/버전별 보관 규칙을 적용한다.
- [ ] `docs/proposals/archive/`, `docs/decision_logs/`, `docs/state_snapshots/`, `docs/test_reports/` 라우팅을 `CLAUDE.md`에 포함한다.

## 8. 승인 요청

보고서를 확인한 뒤 승인하려면 아래 문구로 답변해 주세요.

`APPROVE: proceed`
