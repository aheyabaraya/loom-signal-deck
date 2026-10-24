# Testing And Release Architecture

Status: local_verified
Owner: `web`
Current contract: `loom-web-release-gates.v1`

## 순차 검증 흐름

```text
design + ADR
-> governance hash check
-> marketing contract tests
-> existing content/Harne validators
-> TypeScript check
-> production build
-> desktop browser QA
-> mobile browser QA
-> test DB migration + RLS QA
-> preview deploy QA
-> production approval
-> remote migration
-> production deploy
-> smoke test and rollback watch
```

한 단계가 실패하면 다음 외부 단계로 진행하지 않는다. 로컬 빌드 성공은 원격
DB 또는 프로덕션 준비 완료를 뜻하지 않는다.

## 로컬 명령

```text
pnpm validate:governance
pnpm validate:marketing
pnpm validate:harne
pnpm validate:content-data
pnpm validate:member-assets
pnpm validate:public-images
pnpm type-check
pnpm build
```

통합 확인은 `pnpm validate:all`을 사용한다. 브라우저 QA는 실제 Next 서버에서
1440px 데스크톱과 390px 모바일을 최소 기준으로 한다.

## 2026-08-09 로컬 검증 기록

- `pnpm validate:all`: governance, marketing, Harne, content, member asset,
  public image, TypeScript 검사 통과
- `pnpm build`: 80개 페이지/라우트의 프로덕션 빌드 통과
- 1440px 데스크톱: 홈, 캠페인, Fan Room, Business, Membership, Studio,
  공개 share 경로 확인
- 390px 모바일: 위 7개 경로 모두 문서 폭 초과 없음
- Allow signals: 비식별 이벤트와 캠페인 attribution이 브라우저에 기록됨
- Essential only: 이벤트 수 0, 영구 attribution 없음, 로컬 팬 선택은 유지됨
- Fan Room preview: 로컬 저장 성공, 계정 profile API 호출 0건
- Business preview: 폼 검증 성공, inquiry API 호출 0건, 연락처 이벤트 속성 0건
- API 경계: preview 이벤트 `202`, PII 속성 `400`, 문의 `403`, 결제 `409`
- 증거 화면: `output/playwright/`

이 기록은 원격 테스트 DB, RLS 다중 사용자 검증, 프리뷰 배포 또는 프로덕션
배포 증거가 아니다.

## 브라우저 핵심 시나리오

1. 홈에서 Fan Room, Business, 캠페인 진입점이 현재 UI와 충돌하지 않는다.
2. 동의 배너에서 Essential only와 Allow signals가 키보드로 동작한다.
3. 캠페인 CTA가 올바른 콘텐츠로 이동하고 캠페인 문맥을 유지한다.
4. Harne에서 선택된 멤버 신호의 공유 페이지가 PII 없는 URL을 만든다.
5. Fan Room의 로컬 저장·재방문 복원이 동작한다.
6. Business 문의는 preview에서 외부 전송 없이 검증 결과를 알리고,
   database 모드에서는 명시적 동의가 없으면 전송하지 않는다.
7. Studio가 현재 브라우저 집계와 계약 상태를 명확히 구분한다.
8. Membership에서 결제 버튼이 없고 checkout API가 닫혀 있다.
9. 320px 이상에서 가로 페이지 오버플로와 가려진 주요 CTA가 없다.

## 원격 테스트 DB 게이트

프로덕션과 분리된 Supabase 프로젝트에 마이그레이션을 적용한 뒤 최소 두
사용자로 아래를 확인한다.

테스트 브랜치에 링크한 상태에서도 `LOOM_SUPABASE_TEST_PROJECT_REF`가 실제
링크와 일치해야만 `pnpm test:marketing:rls`가 실행된다. 선택적으로
`LOOM_SUPABASE_PRODUCTION_PROJECT_REF`를 함께 지정하면 두 값이 같은 경우
즉시 중단한다. 테스트 SQL은 트랜잭션 안에서 QA 사용자와 행을 만들고 마지막에
롤백한다.

- 사용자 A가 사용자 B의 프로필, follow, 문의, 관심 행을 읽지 못한다.
- `anon` 직접 테이블 접근이 거부된다.
- staff가 아닌 사용자가 `loom_marketing_summary`를 호출하지 못한다.
- staff 응답에 이름, 이메일, goal 원문이 없다.
- 중복 이벤트 idempotency key가 새 행을 만들지 않는다.
- 동의 철회가 append-only 사건으로 남는다.
- 익명 계정에서 영구 계정 전환 시 사용자 소유권 정책이 유지된다.

## 프리뷰·프로덕션 게이트

프리뷰 배포 전:

- `NEXT_PUBLIC_LOOM_MARKETING_MODE=database`는 테스트 DB에서만 활성화한다.
- OAuth/Anonymous 설정을 실제 대시보드에서 재확인한다.
- 운영자 UUID를 `private.loom_staff_users`에 별도 등록한다.
- 문의 처리 주체, 개인정보 문구, 보존 기간을 확정한다.

프로덕션 반영 전:

- DB 백업/롤백 절차와 마이그레이션 dry review
- 프리뷰 브라우저·RLS 증거
- 환경 변수의 값 비노출 확인
- 기존 Harne 투표·채팅 회귀 테스트
- Founder의 원격 마이그레이션·배포 승인

결제는 이 릴리스의 프로덕션 게이트 대상이 아니다. 항상 비활성 상태로
배포한다.

## 롤백

- UI 문제: 직전 검증 커밋으로 앱을 롤백하고 DB의 append-only 데이터는
  유지한다.
- 이벤트 수집 문제: 마케팅 모드를 `off` 또는 `preview`로 전환한다.
- RLS 문제: 원격 쓰기를 즉시 중지하고 정책 수정 마이그레이션을 별도로
  검토한다. 이미 적용한 마이그레이션을 임의로 삭제·수정하지 않는다.
- 결제 문제: 발생할 수 없다. 체크아웃 경로가 닫혀 있어야 한다.
