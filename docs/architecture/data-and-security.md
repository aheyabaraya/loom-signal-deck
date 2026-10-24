# Data And Security Architecture

Status: local_verified
Owner: `web`
Current contract: `loom-marketing-data.v1`

## 데이터 분리 원칙

| 데이터군 | 예시 | 저장 원칙 |
| --- | --- | --- |
| 공개 카탈로그 | 캠페인 메시지, 플랜, CTA | Git의 버전된 JSON/TypeScript |
| 행동 이벤트 | page view, CTA, share, save | 동의 후 비식별 필드만 append-only |
| 팬 선호 | 선호 멤버·트랙, follow | 사용자 소유 RLS, 명시적 동기화 |
| 동의 기록 | analytics/profile/notification | append-only 상태 사건 |
| 비즈니스 문의 | 이름, 이메일, 목표 | 이벤트와 분리, 사용자/운영자 RLS |
| 멤버십 관심 | plan key, interested/withdrawn | 결제 정보 없이 사용자 소유 |
| 운영 집계 | 이벤트/캠페인/문의 수 | staff 확인 뒤 aggregate-only RPC |

## Supabase 소유 표면

마이그레이션 `supabase/migrations/*_loom_marketing_platform.sql`이 아래를
정의한다.

- `public.loom_campaign_touchpoints`
- `public.loom_marketing_events`
- `public.loom_fan_profiles`
- `public.loom_marketing_consents`
- `public.loom_follows`
- `public.loom_business_inquiries`
- `public.loom_membership_interests`
- `public.loom_experiment_assignments`
- `private.loom_staff_users`

모든 사용자 행은 `auth.users.id`에 결합한다. 외래 키와 RLS 조회 열에는
인덱스를 둔다. 시간은 `timestamptz`, 자유 구조는 크기 제한된 `jsonb`, 상태는
CHECK 제약으로 제한한다.

## 권한 모델

- 브라우저에는 Supabase publishable key만 사용한다.
- service-role key를 브라우저 번들, 공개 환경 변수, 명령 인자에 넣지 않는다.
- `anon` 역할은 마케팅 테이블에 직접 접근할 수 없다.
- 익명 사용자도 Supabase Auth가 만든 `authenticated` 세션으로만 접근한다.
- 이벤트 입력은 `loom_record_marketing_event` RPC 한 경로로 제한한다.
- 프로필 저장은 `loom_save_fan_profile` RPC 한 트랜잭션으로 처리한다.
- 운영 집계는 `loom_marketing_summary`가 staff 여부를 재검증한 뒤 반환한다.
- 운영자 명단은 `private` 스키마에 있고 공개 테이블 권한이 없다.

RLS에서는 반복 호출 비용을 줄이기 위해 `(select auth.uid())`를 사용한다.
정책과 테이블 GRANT를 모두 통과해야만 접근할 수 있다.

## 이벤트 계약

허용 이벤트는 계약의 enum에만 추가한다. 현재 포함되는 주요 사건은 다음과
같다.

```text
page_view, campaign_entry, cta_click, member_select, track_open,
vote_started, vote_saved, share_created, share_opened,
profile_saved, follow_changed, inquiry_started, inquiry_submitted,
membership_interest
```

`properties`는 최대 12개의 평면 scalar 값만 허용한다. 허용 키는
`medium`, `cta_position`, `state`, `inquiry_type`, `timeline`, `follow_count`,
`cross_device`, `option_key`, `vote_kind`로 고정한다. 문자열 값도 공백·`@`가
없는 짧은 토큰만 허용한다. 이메일, 이름, 전화번호, 메시지 본문, 토큰, IP,
채팅·투표 brief 같은 개인 정보나 자유 텍스트는 API 검증과 DB RPC 양쪽에서
거부한다. 서버는 경로·시간·UUID·소스 enum·문자열 길이를 다시 검증한다.

## 동의와 보존

- Essential: 선택한 UI 상태와 현재 세션 운영에 필요한 최소 데이터.
- Analytics: 페이지·캠페인·CTA 등 비식별 행동 이벤트.
- Profile sync: 브라우저 선호를 계정에 연결하는 선택.
- Notifications: 알림 기능이 실제 연결되기 전까지 관심 표시만 기록.
- Business contact: 입력한 문의에 답변하기 위한 별도 동의.

동의 철회는 과거 행을 덮어쓰지 않고 새로운 `withdrawn` 사건을 추가한다.
사용자 삭제 시 외래 키 cascade로 사용자 소유 데이터가 함께 제거되도록 한다.
구체적인 운영 보존 기간과 삭제 SLA는 프로덕션 활성화 전에 법적 검토와 함께
확정해야 한다.

## 문의 데이터 경계

문의 API는 이름·이메일·회사·목표를 `loom_business_inquiries`에만 저장한다.
이 값은 마케팅 이벤트 `properties`, Vercel Analytics, URL, 로그에 복사하지
않는다. Studio 집계는 문의 상태별 수만 반환한다.

## 결제 경계

현재 어떤 테이블에도 카드, 결제 토큰, 청구 주소, 거래 금액, 인보이스 ID를
두지 않는다. 체크아웃 API는 항상 `PAYMENTS_DISABLED`를 반환한다. 결제를
활성화하려면 새로운 ADR, 공급자 webhook 검증, 멱등성, 환불/실패 상태,
세금·약관·보안 검토가 모두 필요하다.
