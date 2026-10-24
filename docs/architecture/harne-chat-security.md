# Harne Chat Accounting And Replay

Status: development
Owner: `web`
Contract: `harne-chat-accounting.v2`

The chat route verifies the cookie user, expected-user intent, feature and staff gates before using a
separate server-only Supabase client. `SUPABASE_SERVICE_ROLE_KEY` is required by
that client. Its value is never browser configuration. Missing configuration
stops the request before any model call; the example file contains no key.

## Canonical owners

| Concern | Owner |
| --- | --- |
| Verified user and request orchestration | `app/api/harne/chat/messages/route.ts` |
| Server-only RPC client and redirect rejection | `lib/harne/admin.ts` |
| Exact prepared model input and usage validation | `lib/harne/openai.ts` |
| Browser retry identity | `lib/harne/client.ts` |
| Admission, immutable replay and transactional accounting | `supabase/migrations/20260914233742_harne_chat_server_budget.sql` |
| Offline application checks | `scripts/test-harne-chat-security.mjs` |
| Isolated PostgreSQL and concurrent transaction checks | `scripts/test-harne-chat-db.py` |

Member persona instructions, model configuration, the owned-member-ballot requirement,
successful response shape and creative authority remain unchanged. Configured token prices calculate
internal estimated cost; they are not an independently verified provider bill.

## Trust and accounting

Only `service_role` can execute the four new public chat RPCs. Browser roles
cannot invoke them or read/write the private reservation table. The three old
quota reserve/release/settle RPC definitions remain for history, with execution
revoked from browser and service roles. Neither current write flow trusts the legacy vote idempotency table. Vote uses
a separate private immutable ledger; see [vote and request identity](harne-vote-security.md).

Each reservation binds the verified user, member, semantic request hash, request
key, frozen Asia/Seoul usage day, historical thread and ballot/option identities,
and reserved amount. A same-key payload conflict is rejected. A terminal replay
returns its stored response and makes no additional model call.

Admission locks the user and the global daily usage row. It includes prior
`actual_microusd + reserved_microusd + requested_reservation` in the existing
100000-microusd daily ceiling. Existing 15/member and 30/user attempt limits are
retained. Failures still count as attempts.

| Transition | Accounting and output |
| --- | --- |
| reserved → started | Required before the first provider call |
| reserved → released | Known pre-provider failure; refund the exact reservation once |
| started → completed | Atomically store approved messages, known usage and cached success |
| started → uncertain | Usage unknown; keep the reservation held and cache the safe error |
| started → failed | Usage known; settle actual cost once and cache the safe error, without storing rejected output as approved |

Completed, released, uncertain and failed responses are immutable. An uncertain
turn blocks another turn for that user on the frozen day. It is not automatically
refunded or retried. Lost completion delivery cannot turn a committed success
into a refund. Known actual cost is recorded even if it exceeds the reservation.
A row-count inconsistency raises inside the SQL subtransaction so partial message
or counter writes roll back before a sanitized error is returned.

Users may clear visible chat history. Historical reservation identity and replay
accounting survive that operation; a generation finishing against a deleted
thread cannot insert approved messages, but its known cost can still settle.
The cleanup function preserves usage days with unresolved reservations. No new
automatic reservation deletion or reconciliation job is introduced.

## Model and browser boundaries

The reservation estimates the full prepared instructions, recent history and
new message using UTF-8 bytes plus a framing margin and the existing 160 output
token ceiling. Pricing configuration must be finite and positive; arithmetic and
usage must be bounded integers. Missing usage is not interpreted as zero.
Malformed moderation results fail closed. HTTP redirects are rejected by the
provider transport and the server-only Supabase client.

Identical overlapping browser sends share one network request. An explicit retry
after a network error, malformed success, conflict or server failure reuses the
same key. There is no automatic resend. The bounded in-memory map does not evict
uncertain requests to make room for new spending. Auth changes separate users;
a prior user's pending reply cannot become the new user's result. A failed
sign-out does not discard retry identity. Browser process reloads are outside
this in-memory retry guarantee. Request headers, optional-bound legacy GET compatibility
and account/member/operation UI guards follow [request identity](harne-vote-security.md#request-identity).

## Verification and release

`pnpm test:harne-security` uses synthetic transport, auth and RPC responses with
all real network calls disabled. It proves application ordering and response
handling; it does not prove database transactions or deployed RLS.

Run real SQL checks with an installed local PostgreSQL server:

```text
pnpm test:harne-db --pg-bin /absolute/path/to/postgresql/bin
```

The runner creates a fresh synthetic database, listens only on its private Unix
socket and stops/removes that test instance. It accepts no remote DSN or existing
data directory. Two independent backends exercise shared-user and global-budget
races. A missing server is a verification gap, not a passing test.

On 2026-09-15, the unchanged migration passed 49 checks on PostgreSQL 18.6
compiled from checksum-verified official source in a temporary local environment.
This included real role/RLS checks, immutable accounting, rollback and two-backend
user/global budget races. The auth schema and users were synthetic; hosted
Supabase, real authentication, remote migration and deployment were not exercised.

Before production application, verify this migration and RLS in the approved
isolated/test environment, provision only the intended server-side credential,
and review the migration/application rollout together. The new route requires
the new RPCs; the migration intentionally revokes the old route's functions.
Use a maintenance window or feature-off rollout while changing both. Never
restore browser privileges or erase usage rows as a rollback. Existing production
migration/deployment authorization gates remain separate.

Reservation cache retention contains user-scoped response data and needs an
explicit retention/deletion policy before production enablement. Visible-history
clear is not an account-wide data deletion receipt. Uncertain usage reconciliation
requires a separately reviewed trusted operator path; no browser can perform it.

API field references: [OpenAI Responses](https://developers.openai.com/api/reference/cli/resources/responses/methods/create),
[OpenAI Moderations](https://developers.openai.com/api/reference/resources/moderations),
and [Supabase database functions](https://supabase.com/docs/guides/database/functions).
