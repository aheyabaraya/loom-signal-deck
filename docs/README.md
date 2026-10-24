# Loom Web Product System

이 디렉터리는 Loom Signal Deck 웹 제품의 설계, 데이터 계약, 의사결정,
릴리스 상태를 관리하는 정본(canonical) 문서 표면이다. 상위 IDOL 제작
계약과 SNS 발행 원장은 그대로 유지하고, 웹 제품 확장에 필요한 계약만
`web/` 안에서 독립적으로 버전 관리한다.

## 정본 지도

| 영역 | 정본 |
| --- | --- |
| 제품·마케팅 구조 | `architecture/business-marketing-platform.md` |
| 데이터·보안 구조 | `architecture/data-and-security.md` |
| 채팅 정산·재시도 보안 | `architecture/harne-chat-security.md` |
| 투표·요청 계정 경계 | `architecture/harne-vote-security.md` |
| 테스트·릴리스 절차 | `architecture/testing-and-release.md` |
| 웹 소유권 결정 | `adr/0001-web-owned-governance.md` |
| 동의·어트리뷰션 결정 | `adr/0002-consented-first-party-signals.md` |
| 멤버십·결제 경계 | `adr/0003-membership-payment-boundary.md` |
| 현재 계약 버전·해시 | `governance/version-registry.json` |
| append-only 릴리스 사건 | `governance/release-ledger.jsonl` |

## 변경 절차

1. 변경하려는 기능의 정본 문서와 ADR을 먼저 확인한다.
2. 공개 데이터 계약이나 저장 구조가 바뀌면 호환성 영향을 기록하고
   계약 버전을 올린다.
3. 정본 파일을 수정한 뒤 `pnpm validate:governance`로 경로와 SHA-256을
   검증한다.
4. `pnpm validate:marketing`, `pnpm type-check`, `pnpm build`를 순서대로
   통과시킨다.
5. 데스크톱·모바일 실제 브라우저 확인을 완료한다.
6. 릴리스 원장에 새 사건을 한 줄 추가한다. 기존 사건을 덮어쓰지 않는다.
7. 원격 DB 마이그레이션과 프로덕션 배포는 별도 승인 후에만 실행한다.

Git이 일반 텍스트의 변경 이력을 소유한다. `final`, `latest2`, 날짜별 복제본을
만들지 않고 각 정본 경로를 제자리에서 갱신한다.

## 상태 의미

- `development`: 기능과 계약을 로컬에서 작성 중이다.
- `local_verified`: 정적 검증, 타입 검사, 빌드, 브라우저 QA를 통과했다.
- `preview_ready`: 원격 테스트 DB와 프리뷰 환경에서 검증할 준비가 됐다.
- `production_ready`: 원격 마이그레이션, 보안, 운영자 접근, 롤백 확인까지
  끝났고 배포 승인만 남았다.
- `released`: 실제 프로덕션 반영 증거가 있다.

구조가 존재하거나 로컬 테스트를 통과한 것만으로 `production_ready` 또는
`released`를 선언하지 않는다.
