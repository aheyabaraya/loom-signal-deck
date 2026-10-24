# ADR 0003: Membership Without Payments

Status: accepted
Decision date: 2026-08-09

## Context

멤버십 구조와 팬의 관심을 미리 검증할 필요는 있지만, 결제는 금액·정산·세금·
환불·webhook·보안·약관까지 함께 설계해야 한다. 지금 카드 입력이나 가짜
체크아웃을 제공하면 준비 상태를 과장하고 운영 위험을 만든다.

## Decision

이번 버전은 플랜 카탈로그, 공개 상태, 혜택 구조, 사용자별 관심 신호만
구현한다. 모든 플랜의 `billingEnabled`는 `false`이며 결제·카드 입력 UI를
만들지 않는다. `/api/membership/checkout`은 항상
`PAYMENTS_DISABLED`를 반환한다.

결제 활성화는 별도 ADR과 공급자 어댑터, 가격 정본, webhook 서명 검증,
멱등성, 상태 머신, 환불/실패 처리, 보안·법적 검토를 요구한다.

## Consequences

- 제품 정보 구조와 관심 수요는 지금 테스트할 수 있다.
- 매출, 결제 전환, 구독자 수를 주장할 수 없다.
- 환경 변수 하나만으로 결제가 우발적으로 켜지지 않는다.
