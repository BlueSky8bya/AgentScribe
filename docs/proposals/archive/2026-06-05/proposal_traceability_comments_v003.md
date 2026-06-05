# 제안서: `CLAUDE.md`에 제안서 추적 주석(Proposal Traceability) 규칙 추가

## 1. 도입 목적

지금 `CLAUDE.md`(헌법)에는 "제안서로 코드가 바뀌면 그 코드에 주석으로 출처를 남겨라"는 규칙이 **없습니다.** 이전에 한 번 넣었으나, 이후 헌법 전체를 영어 버전으로 덮어쓰는 과정에서 빠졌습니다.

문제: 우로보로스 루프는 "모든 코드 변경은 제안서 승인을 거친다"고 강제하지만, 정작 **승인된 코드가 어떤 제안서에서 나왔는지 코드 자체에는 표시가 안 됩니다.** 6개월 뒤 어떤 함수를 보면 "이게 왜 이렇게 짜였지? 어느 결재로 들어왔지?"를 알려면 제안서 아카이브 전체를 뒤져야 합니다.

목적: 승인된 제안서로 코드를 만들거나 고칠 때마다 **변경 지점에 추적 주석**을 남겨, 코딩 에이전트와 개발자가 코드만 보고 "언제·어떤 제안서·왜"를 즉시 알 수 있게 합니다.

## 2. 변경 내용

`CLAUDE.md`만 수정합니다. (코드 파일 변경 없음)

추가 사항:

1. **§3 Ouroboros Change Protocol**에 새 단계 추가 — 구현 시 변경 지점마다 추적 주석을 단다.
2. **§5 Dynamic Routing Directory** 바로 위 또는 §3 안에 **추적 주석 형식 규칙**을 신설한다.
3. **§9 Final Enforcement**에 한 줄 추가 — "제안서로 바뀐 코드는 추적 주석을 남긴다."

추적 주석 형식 (에이전트용이므로 영어):

```
[PROPOSAL: <doc-path> §<section>] <one-line reason>
```

언어별 주석 기호로 감쌉니다 (TS/JS `//`, CSS `/* */`, Python `#`, MD `<!-- -->`).

규칙:

- 새 블록/함수/파일: 시작 지점에 1개.
- 기존 줄 수정: 바로 위 줄에 1개.
- 한 제안서가 여러 파일에 걸치면: 파일마다 최소 1개.
- 제안서가 폐기/대체되면: 후속 제안서가 그 주석을 갱신하거나 제거 (고아 주석 금지).
- 신규 파일: 최상단 헤더 블록으로 표기.

## 3. 예상 부작용

- 코드에 주석이 늘어 약간 장황해질 수 있습니다. 대신 추적성이 크게 올라갑니다.
- 에이전트가 구현 단계마다 주석 작성을 한 단계 더 신경 써야 합니다.
- 헌법(`CLAUDE.md`)이 조금 길어집니다. (규칙 1개 + 형식 블록)
- 제안서를 폐기할 때 코드 속 고아 주석을 같이 정리해야 하는 부담이 생깁니다.
- 이 변경 자체는 코드를 바꾸지 않으므로 빌드/동작 영향 없음.

## 4. 대안

### 대안 1: 추적을 git blame / 커밋 메시지에만 의존

추가 주석 불필요. 단 현재 프로젝트는 git 저장소가 아니고, 커밋 메시지는 코드를 읽는 자리에서 바로 안 보입니다. 코딩 에이전트가 파일만 읽을 때 출처를 모릅니다.

### 대안 2: 별도 추적 표(`docs/traceability.md`)에 매핑 기록

코드는 깨끗하게 유지됩니다. 단 코드와 표가 따로 놀아 동기화가 깨지기 쉽고, 에이전트가 표를 또 읽어야 합니다.

### 대안 3: 코드 변경 지점에 인라인 추적 주석 (추천)

코드를 읽는 바로 그 자리에서 출처가 보입니다. 동기화 깨질 일 적음. 우로보로스의 "문서가 진실, 코드가 문서를 따른다"와 가장 잘 맞습니다.

## 5. 쉬운 비유

출판사에서 원고 한 문단을 고치면, 교정지 여백에 **"이 수정은 6/5 기획안 3번 결재에 따름"**이라고 빨간 펜으로 적어두는 것과 같습니다.

나중에 다른 편집자가 그 문단을 봐도, 결재 문서철을 다 뒤질 필요 없이 여백 메모만 보고 "아, 이건 그 기획안 때문이구나"를 압니다. 결재 보관함(아카이브)이 "왜"의 원본이라면, 여백 메모(추적 주석)는 "현장에 붙은 포스트잇"입니다.

## 6. 문서 스켈레톤 (반영 후 `CLAUDE.md` 일부)

```md
## 3. Ouroboros Change Protocol
4. Evolve & Update
   - ...
   - Tag every changed/created code location with a traceability comment (see §3.x).

## 3.x Proposal Traceability (신설)
- Format: `[PROPOSAL: <doc-path> §<section>] <one-line reason>`
- Wrap in the language comment syntax (TS/JS //, CSS /* */, Python #, MD <!-- -->).
- New block/function/file: one tag at the top. Edited line: one tag above it.
- Multi-file change: at least one tag per file.
- If a proposal is superseded, the follow-up updates or removes its tags. No orphan tags.

예시:
// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §3] gate entrypoint after ambiguity cleared
export function runOuroborosGate(spec) { ... }

## 9. Final Enforcement
- Code changed by a proposal must carry a traceability comment pointing back to it.
```

## 7. 승인 체크리스트

승인하면 아래를 `CLAUDE.md`에 반영합니다.

- [ ] §3 프로토콜의 구현 단계에 "변경 지점마다 추적 주석" 의무를 추가한다.
- [ ] 추적 주석 형식 규칙(신설 소절)을 추가한다: `[PROPOSAL: <doc-path> §<section>] <reason>`.
- [ ] 언어별 주석 기호, 위치 규칙(블록/수정/파일헤더), 다파일 규칙, 고아 주석 금지를 명시한다.
- [ ] 추적 주석은 에이전트용이므로 영어로 작성한다는 점을 명시한다.
- [ ] §9 Final Enforcement에 한 줄 강제 규칙을 추가한다.
- [ ] 코드 파일은 이번 변경에서 건드리지 않는다 (`CLAUDE.md`만 수정).

## 8. 승인 요청

보고서를 확인한 뒤 승인하려면 아래 문구로 답변해 주세요.

`APPROVE: proceed`
