# ADR 0001: Web-Owned Product Governance

Status: accepted
Decision date: 2026-08-09

## Context

상위 IDOL 저장소는 제작·발행·분석 계약과 해시 레지스트리를 이미 소유한다.
Loom 웹 제품의 빠른 기능 확장을 그 레지스트리에 모두 섞으면 작은 UI 변경도
전체 제작 하네스 변경처럼 취급되고, 반대로 웹 계약은 찾기 어려워진다.

## Decision

웹 제품의 설계, ADR, 계약 버전, 릴리스 사건은 `web/docs`에서 정본으로
관리한다. 상위 해시 레지스트리가 이미 추적하는 `web/README.md`와
`web/data/signalDeckPublications.json`의 소유권은 변경하지 않는다.

`version-registry.json`은 웹 제품 계약의 안정 경로와 SHA-256을 검증하고,
`release-ledger.jsonl`은 배포 상태 사건을 append-only로 기록한다. Git은 일반
문서의 변경 이력을 소유한다.

## Consequences

- 웹 확장 계약을 한 저장소 안에서 독립적으로 찾고 검증할 수 있다.
- SNS 공개 원장이나 제작 PASS를 웹 코드가 대체하지 않는다.
- 상위 추적 파일을 수정할 때는 여전히 상위 레지스트리 갱신이 필요하다.
- `released` 상태는 실제 배포 증거가 없으면 기록할 수 없다.
