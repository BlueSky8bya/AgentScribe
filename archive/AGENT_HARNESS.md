# SYSTEM INSTRUCTION: AGENTSCRIBE MULTI-AGENT PUBLISHING PIPELINE & ANTI-DRIFT HARNESS

[CRITICAL REQUIREMENT: DOCUMENT-DRIVEN CONTEXT & STRICT MULTI-AGENT PROTOCOL]
당신의 목표는 이전 프로젝트의 '컨텍스트 증발' 및 '구조적 드리프트'를 원천 차단하고, Vite 기반 TypeScript 환경 위에서 완벽하게 통제되는 소설 집필 멀티 에이전트 시스템(AgentScribe)을 구축하는 것입니다. 기억(Session Memory)을 신뢰하지 마십시오. 오직 기록(Document)만 신뢰하십시오.

## 1. SEED SPECIFICATION (불변 명세 - 절대 이탈 불가)
* **작업 디렉토리:** `C:\projects\AgentScribe`
* **코어 환경:** Vite 기반 TypeScript 환경 (React/Vue 등 UI 프레임워크 포함)
* **핵심 목적:** 독자의 몰입감을 저해하는 '문맥 오류(예: 잘린 팔 사용)'를 완벽히 차단하는, 출판사 구조(총괄-기획-집필-검수)의 멀티 에이전트 협업 파이프라인 구축.
* **절대 제약:**
    * 채팅 세션이 길어져도 지침이 노후화되지 않도록, 모든 시스템 아키텍처와 에이전트 상태는 프로젝트 내 `.md` 파일(예: `architecture.md`, `world_bible.md`)로 영구 저장되어야 합니다.
    * 새로운 아이디어가 떠오르더라도 현재 진행 중인 태스크에 즉각 반영하지 마십시오. 반드시 `backlog.md`에 기록하고 본래의 흐름을 유지하십시오.

## 2. MULTI-AGENT COLLABORATION PROTOCOL (태스크 할당 및 프로토콜)
자율 에이전트 간의 작업 할당과 조율은 중앙 집중형 게시판(Blackboard Pattern) 방식으로 이루어집니다.
* **Director (총괄팀):** 전체 진행도를 관리하고, 백로그를 검토하며, 각 에이전트에게 단기 목표를 할당합니다.
* **Planner (기획팀):** 인물/배경/사건의 뼈대를 짭니다. 결정된 설정은 반드시 `world_bible.json` 또는 `world_bible.md`에 속성값으로 추가하여 영구 저장합니다.
* **Writer (집필팀):** 기획팀이 작성한 뼈대와 `world_bible`의 제약 조건 안에서만 텍스트를 생성합니다. 임의로 설정을 창조할 수 없습니다.
* **QA/Reviewer (검수팀):** 집필된 텍스트를 `world_bible`의 상태값(예: `character_A.arm_status = "severed"`)과 교차 검증하여, 설정 충돌(문맥 이탈)이 발생하면 즉시 Writer에게 반려(Reject)합니다.

## 3. EXECUTION PIPELINE (실행 규칙)
1.  **STATE RESTORE:** 작업을 시작하거나 세션이 새로 열릴 때마다, 무조건 프로젝트 디렉토리의 `state.md`와 `world_bible.md`를 먼저 읽어 현재 상태와 지침을 동기화하십시오.
2.  **PREVENT BRANCHING:** 사용자가 추가 기능이나 아이디어를 제시할 경우, "해당 아이디어를 `backlog.md`에 저장하고 원래 작업하던 [현재 목표]로 돌아가시겠습니까?"라고 역질문(Interview)하여 메인 루프를 방어하십시오.
3.  **NO ENDLESS LOOPS:** LLM이 동일한 오류를 2회 이상 반복하여 루프에 빠질 경우, 즉시 코드 수정을 중단하고 사용자에게 "현재 접근 방식에 논리적 결함이 있습니다. A안 또는 B안으로 방향을 전환하시겠습니까?"라고 보고하십시오.

## 4. EVALUATION GATES (통과 기준)
* **Gate 1 (상태 동기화):** 코드를 작성하기 전, 현재 변경 사항이 지침서나 설계 문서(`.md`)에도 동일하게 업데이트(버전업) 되었는가?
* **Gate 2 (논리성 검증):** QA 에이전트의 검수 로직이, 이전 장면에 저장된 변수(상태)를 참조하여 현재 생성된 텍스트의 모순을 100% 잡아낼 수 있도록 설계되었는가?
