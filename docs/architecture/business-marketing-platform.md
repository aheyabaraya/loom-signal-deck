# Business Marketing Platform Architecture

Status: local_verified
Owner: `web`
Current contract: `loom-business-marketing-platform.v1`

## 목표

Loom Signal Deck를 단순 아카이브에서 아래의 순환을 측정하고 운영할 수 있는
제품으로 확장한다.

```text
campaign entry
-> content discovery
-> vote or profile action
-> privacy-safe share
-> return/follow signal
-> business inquiry
```

현재 콘텐츠·멤버·트랙·CF 정본은 그대로 읽는다. 웹 마케팅 계층은 콘텐츠의
창작 PASS, 실제 발행, 외부 플랫폼 성과를 새로 주장하거나 덮어쓰지 않는다.

## 기능 지도

| 기능 | 공개 경로 | 현재 범위 |
| --- | --- | --- |
| 캠페인 랜딩 | `/campaign/[slug]` | 버전된 캠페인 카탈로그, 콘텐츠별 CTA, 유입 문맥 |
| 투표 공유 | `/share/[memberCode]/[optionKey]` | 개인 식별자 없는 정적 결과 카드와 공유 CTA |
| 팬 룸 | `/fan` | 선호 멤버·트랙, 팔로우, 명시적 동의, 로컬/계정 동기화 |
| 비즈니스 | `/business` | 실제 CF 사례 근거, 문의 폼, 과장 없는 제작 경계 |
| 운영 콘솔 | `/studio` | 계약 버전, 캠페인, 집계, 릴리스 게이트의 읽기 전용 화면 |
| 멤버십 | `/membership` | 플랜·관심 신호만 제공, 결제 및 카드 수집 비활성 |

## 계층 구조

```text
Versioned content and campaign catalogs
             |
Public experience components + consent boundary
             |
Versioned API payloads and server validation
             |
Supabase RPC/RLS persistence or local preview adapter
             |
Aggregate-only Studio read model + release registry
```

### 1. 카탈로그 계층

- `data/marketingCampaigns.json`은 웹 캠페인의 공개 메시지, 타깃, CTA,
  콘텐츠 바인딩을 소유한다.
- `data/membershipPlans.json`은 결제가 아닌 제품 플랜의 구조와 공개 상태를
  소유한다.
- 기존 `data/members.ts`, `data/tracks.ts`, `data/cf.ts`,
  `data/signalDeckPublications.json`은 각자의 기존 진실을 유지한다.

### 2. 경험 계층

- 현재의 검정·시안·세리프 기반 Loom UI 토큰을 재사용한다.
- “Signal Spine”을 캠페인 유입에서 문의까지의 공통 시각 문법으로 사용한다.
- 모든 행동 수집은 동의 상태를 먼저 읽는다.
- 공유 URL에는 사용자 ID, 투표 ID, 이메일, 세션 ID를 넣지 않는다.

### 3. 서비스 계층

- `preview`: 기본 안전 모드. 브라우저 안의 제한된 비식별 이벤트와 선호만
  저장하고 외부 DB에는 쓰지 않는다.
- `database`: 명시적으로 활성화한 경우에만 Supabase 사용자 세션과 RLS를
  통해 저장한다.
- `off`: 행동 저장과 폼 전송을 닫되 공개 콘텐츠는 계속 읽을 수 있다.

`NEXT_PUBLIC_LOOM_MARKETING_MODE`가 이 모드를 선택한다. 미설정 기본값은
`preview`이며, 프로덕션 전환은 마이그레이션과 보안 QA가 끝난 뒤에만 한다.

### 4. 운영 계층

Studio v1은 읽기 전용이다. 미리보기에서는 현재 브라우저의 동의된 이벤트만
집계한다. DB 모드에서는 `private.loom_staff_users`에 등록된 사용자만 집계
RPC를 호출할 수 있고, 응답에는 이메일·이름·자유 서술문이 포함되지 않는다.

## 캠페인 및 어트리뷰션

허용된 유입 문맥은 `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `ref`, `campaign`이다. 최초 유입 문맥은 세션 메모리에 보관하고,
분석 동의가 있을 때만 제한된 기간 동안 로컬 저장 및 서버 이벤트에 포함한다.

캠페인 카탈로그의 `id`, URL `campaign`, DB의 `campaign_id`는 같은 안정 키를
쓴다. 창작물의 실제 공개 발행 여부나 플랫폼 성과는 상위 SNS 원장만이
소유한다. 웹 이벤트는 그 원장을 추측해서 채우지 않는다.

## 확장 규칙

1. 새 기능은 새 페이지보다 먼저 소유 데이터와 계약 버전을 정한다.
2. 컴포넌트는 카탈로그 데이터를 읽고, 문자열 상수의 중복 소유를 피한다.
3. API는 버전된 입력을 검증하고 알 수 없는 필드를 저장하지 않는다.
4. 결제, 외부 발행, 이메일 전송, CRM 동기화는 별도 어댑터와 별도 승인
   없이는 호출할 수 없다.
5. 운영 화면은 원본 PII가 아닌 집계 read model을 기본으로 한다.
6. 공개 캠페인 주장은 현재 저장소에서 확인되는 콘텐츠 근거만 사용한다.

## 의도적으로 제외한 범위

- 실제 결제·구독 갱신·환불·세금·인보이스
- 외부 광고 플랫폼 픽셀 및 서드파티 쿠키
- 자동 이메일, CRM 전송, 리드 배정
- SNS 게시·업로드·성과 원장 수정
- 운영자용 콘텐츠/캠페인 쓰기 CMS

위 항목은 이번 버전의 미완성이 아니라 안전하게 닫힌 후속 통합 경계다.
