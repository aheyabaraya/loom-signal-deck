# ADR 0002: Consented First-Party Signals

Status: accepted
Decision date: 2026-08-09

## Context

캠페인과 팬 경험을 개선하려면 유입과 행동의 연결이 필요하지만, 현재 SNS
원장은 실제 발행·고정 체크포인트 성과만 소유하며 웹 개인 행동을 저장하도록
설계되지 않았다. 서드파티 픽셀을 바로 붙이면 증거 경계와 개인정보 경계가
불분명해진다.

## Decision

웹은 자체 계약으로 제한된 first-party 행동 이벤트만 수집한다. 분석 동의 전에는
서버 행동 이벤트와 Vercel Analytics를 활성화하지 않는다. 팬 프로필과 문의
PII는 이벤트 원장과 분리한다. 캠페인 유입은 공개 URL 키와 허용된 소스 enum만
사용한다.

공유 결과는 멤버 코드와 공개 옵션 키만 포함하는 정적 URL로 만든다. 사용자,
ballot, session 식별자는 포함하지 않는다.

## Consequences

- 유입→행동 흐름을 콘텐츠·SNS 원장을 오염시키지 않고 측정할 수 있다.
- 동의하지 않은 사용자는 공개 콘텐츠와 로컬 필수 기능을 계속 이용할 수 있다.
- 광고 플랫폼의 view-through attribution과 cross-device attribution은 제공하지
  않는다.
- 프로덕션 활성화 전 보존 기간과 법적 문구 확정이 필요하다.
