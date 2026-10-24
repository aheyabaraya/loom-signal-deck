# Harne Vote & Member Chat Activation Spec

- Status: historical proposal; implementation superseded
- Owner: Founder
- Application: `loom-signal-deck`
- Baseline: 2026-08-03 production CSS maintenance release
- Scope: public vote persistence and vote-gated private member chat

This preserves the original 2026-08-03 proposal, including its then-current
baseline and proposed paths. It is not an active instruction to release failed
chat reservations or a current statement about deployed credentials. Current
chat trust, accounting, retry and rollout rules are owned by
[Harne chat security](architecture/harne-chat-security.md) and its version-bound
implementation. Historical design values below are retained as proposal evidence.

## 1. Decision summary

Keep the current Next.js application and connect only three primary runtime systems:

1. **Vercel / Next.js** owns the UI, first-party API routes, server-side validation, feature flags, and deployment.
2. **Supabase** owns anonymous sessions, Postgres persistence, row ownership, vote uniqueness, chat quota, and aggregate data.
3. **OpenAI API** owns input moderation and the short member response. It remains server-only and uses `store: false`.

Vercel Bot Protection/WAF is the first network guard. Cloudflare Turnstile is an optional step-up challenge if anonymous-session or chat abuse is observed; it is not required for the first closed rollout.

The browser must never receive an OpenAI key or Supabase secret key. The browser may receive only the Supabase project URL and publishable key required to create an anonymous session.

## 2. Current baseline

### Vote

- Identity votes are stored under `loom-harne-identity-votes-v1` in browser `localStorage`.
- Next-track votes are stored under `loom-next-track-vote-v1` in browser `localStorage`.
- A user can clear or duplicate the local state; there is no shared total or server receipt.
- The home modal and `/vote` page duplicate the same state and interaction logic.

### Chat

- The UI unlocks chat by trusting the locally stored vote option.
- `/api/member-chat` validates the member and option against repository data, then calls OpenAI.
- Transcript state is stored only under `loom-harne-member-chat-v1` in browser `localStorage`.
- The daily cost budget is an in-memory server variable. It resets across function instances and deployments, so it is not a production quota.
- There is no user session, durable rate limit, input moderation call, stored usage ledger, or ownership policy.
- Production currently has no environment variables. The existing route therefore returns `503` before any paid request.

## 3. Product rules for v1

### Vote rules

- Entry requires no email, phone number, or social login.
- Supabase creates one anonymous authenticated user per browser session.
- One active ballot is allowed per user and vote question.
- A user may change a choice while the round is open. The previous choice is replaced atomically and does not increase the total.
- The server accepts only active question and option IDs already registered in the database.
- Identity-vote chat unlock is granted only when the server finds the user's ballot for that member.
- Public results expose aggregate counts and percentages only. User IDs and individual ballots are never public.
- The optional next-track brief is limited to 240 characters and is never rendered publicly without a separate moderation and review flow.

### Chat rules

- Chat is private to the anonymous user and selected Loom member.
- A server-verified identity vote for the same member is mandatory before the first message.
- Input limit: 240 characters.
- Context limit: latest 10 messages.
- Output limit: 160 tokens.
- Per user/member limit: 15 user messages per KST day.
- Per user global limit: 30 user messages per KST day.
- A separate global daily cost ceiling stops all new model calls when reached.
- Only one request per user/member can be in flight at a time.
- Responses remain explicitly fictional, non-canonical, and unable to make real-world promises or private-contact requests.
- Clear deletes the user's stored thread rather than only hiding it in the browser.

## 4. Runtime architecture

```text
Browser
  -> Supabase anonymous session (publishable key only)
  -> Next.js Route Handlers on Vercel
       -> verify Supabase JWT and feature flag
       -> validate request and ownership
       -> Supabase Postgres transaction / RLS
       -> OpenAI Moderation
       -> reserve durable quota
       -> OpenAI Responses API (store: false)
       -> persist reply and usage
       -> return typed receipt
```

All vote and chat writes go through first-party `/api/harne/**` routes. The client does not write directly to vote or chat tables. This keeps domain validation in one place while RLS remains a database-level backstop.

Supabase Realtime is intentionally excluded from v1. Vote submission responses can return the latest aggregate, and public totals can use a short refresh interval. Realtime can be added only if live-result motion becomes a confirmed product requirement.

## 5. Proposed repository structure

```text
app/api/harne/
  session/route.ts
  votes/route.ts
  votes/summary/route.ts
  chat/messages/route.ts
  chat/threads/[memberCode]/route.ts

features/harne/
  api.ts
  contracts.ts
  storage-migration.ts
  use-harne-session.ts
  use-harne-votes.ts
  use-member-chat.ts
  components/
    identity-vote-panel.tsx
    next-track-vote-panel.tsx
    member-chat-dock.tsx

lib/server/harne/
  env.ts
  auth.ts
  flags.ts
  moderation.ts
  openai.ts
  quota.ts
  supabase.ts

supabase/
  migrations/
  tests/
```

`SignalDeck.tsx` and `HarneVotePage.tsx` become route-level composition surfaces. Shared vote/chat behavior moves into `features/harne/**`, preventing the two pages from drifting again.

## 6. Database contract

All tables use lowercase identifiers, explicit constraints, indexed foreign keys, RLS, and minimum grants.

### `vote_rounds`

- `id bigint identity primary key`
- `slug text unique not null`
- `status text check (status in ('draft', 'open', 'closed'))`
- `opens_at timestamptz`
- `closes_at timestamptz`
- `created_at timestamptz not null default now()`

### `vote_questions`

- `id bigint identity primary key`
- `round_id bigint references vote_rounds(id)`
- `kind text check (kind in ('member_identity', 'next_track'))`
- `subject_key text not null` — member code or track-round key
- `prompt text not null`
- `sort_order integer not null`
- Unique: `(round_id, kind, subject_key)`
- Index: `(round_id, sort_order)`

### `vote_options`

- `id bigint identity primary key`
- `question_id bigint references vote_questions(id)`
- `option_key text not null`
- `label text not null`
- `sort_order integer not null`
- Unique: `(question_id, option_key)`
- Index: `(question_id, sort_order)`

### `vote_ballots`

- `id bigint identity primary key`
- `question_id bigint references vote_questions(id)`
- `user_id uuid references auth.users(id)`
- `option_id bigint references vote_options(id)`
- `brief text check (char_length(brief) <= 240)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Unique: `(question_id, user_id)`
- Indexes: `(user_id, updated_at desc)`, `(question_id, option_id)`

Submission uses one `insert ... on conflict (question_id, user_id) do update` operation. The transaction validates that the option belongs to the question and that the round is open.

### `chat_threads`

- `id bigint identity primary key`
- `user_id uuid references auth.users(id)`
- `member_code text not null`
- `unlock_ballot_id bigint references vote_ballots(id)`
- `created_at timestamptz not null default now()`
- `last_message_at timestamptz`
- Unique: `(user_id, member_code)`
- Index: `(user_id, last_message_at desc)`

### `chat_messages`

- `id bigint identity primary key`
- `thread_id bigint references chat_threads(id) on delete cascade`
- `role text check (role in ('user', 'assistant'))`
- `content text not null`
- `moderation_status text not null`
- `input_tokens integer`
- `output_tokens integer`
- `cost_microusd bigint`
- `created_at timestamptz not null default now()`
- Index: `(thread_id, created_at desc)`

### `chat_daily_usage`

- `user_id uuid references auth.users(id)`
- `member_code text not null`
- `usage_day date not null`
- `user_message_count integer not null default 0`
- `reserved_microusd bigint not null default 0`
- `actual_microusd bigint not null default 0`
- Primary key: `(user_id, member_code, usage_day)`
- Additional global rows or a separate `chat_global_daily_usage` table enforce the application-wide cost ceiling.

### `api_idempotency`

- `user_id uuid references auth.users(id)`
- `idempotency_key text not null`
- `route_key text not null`
- `response_code integer`
- `response_body jsonb`
- `expires_at timestamptz not null`
- Primary key: `(user_id, route_key, idempotency_key)`
- Index: `(expires_at)` for cleanup.

## 7. Authorization and database security

- Anonymous sign-ins use the `authenticated` Postgres role, so policies must check both ownership and the JWT `is_anonymous` claim where needed.
- Every table in an exposed schema has RLS enabled before grants are added.
- `vote_ballots`, `chat_threads`, `chat_messages`, and usage rows require `(select auth.uid()) = user_id` directly or through the owning thread.
- `UPDATE` policies include both `USING` and `WITH CHECK`.
- Columns used by RLS and foreign keys are indexed.
- Browser roles cannot select raw ballots, raw usage, or another user's messages.
- Public summaries are returned by a server route; no raw-ballot view is exposed.
- A privileged quota function, if required, uses a fixed empty `search_path`, checks `auth.uid()` inside the body, revokes `EXECUTE` from `PUBLIC`/`anon`, and grants only the minimum caller role.
- The Supabase secret key is restricted to server-side administration and aggregate operations. It is never prefixed with `NEXT_PUBLIC_`.
- Authorization never depends on user-editable metadata.

## 8. API contracts

### `POST /api/harne/session`

Creates or refreshes the anonymous Supabase session and returns only session readiness.

```json
{ "ready": true, "anonymous": true }
```

### `GET /api/harne/votes`

Returns open questions, options, the current user's selections, and feature availability.

### `PUT /api/harne/votes`

Headers: `Idempotency-Key` required.

```json
{
  "questionId": 101,
  "optionId": 302,
  "brief": null
}
```

Response includes a durable ballot receipt and optionally the latest aggregate.

### `GET /api/harne/votes/summary?round=<slug>`

Returns aggregate count/percentage only after the round's result-visibility rule permits it.

### `POST /api/harne/chat/messages`

Headers: `Idempotency-Key` required.

```json
{
  "memberCode": "M01",
  "text": "오늘 무대에서 가장 기억에 남은 순간은 뭐였어?"
}
```

The server resolves the vote and recent transcript. The client cannot submit a vote option as proof.

### `DELETE /api/harne/chat/threads/M01`

Deletes only the authenticated user's thread for that member.

### Error envelope

```json
{
  "error": {
    "code": "CHAT_DAILY_LIMIT_REACHED",
    "message": "오늘의 채팅 횟수를 모두 사용했습니다."
  }
}
```

Expected status codes: `400` invalid input, `401` missing session, `403` vote required or feature disabled, `409` duplicate in-flight request, `422` moderated input, `429` quota/budget exhausted, `502` model failure, `503` dependency unavailable.

## 9. Chat request sequence

1. Verify the anonymous session on the server.
2. Validate feature flag, member code, text length, and idempotency key.
3. Confirm an owned ballot exists for the member's current identity question.
4. Run input moderation.
5. Atomically reserve member, user, and global quota in a short database transaction.
6. Read only the latest 10 owned messages.
7. Call OpenAI Responses with server-owned instructions, `store: false`, bounded output, and a stable privacy-preserving safety identifier.
8. Moderate or policy-check the output.
9. In a new short transaction, store both messages and settle actual usage. Never hold a database lock during the external model call.
10. On model failure, release the reservation and return a retry-safe error.

## 10. Environment contract

### Browser-safe

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` only if step-up CAPTCHA is enabled

### Server-only

- `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `OPENAI_MODERATION_MODEL=omni-moderation-latest`
- `OPENAI_DAILY_COST_LIMIT_USD`
- `HARNE_VOTE_MODE=off|shadow|public`
- `HARNE_CHAT_MODE=off|staff|public`
- `HARNE_RESULT_VISIBILITY=hidden|after_vote|after_close`
- `TURNSTILE_SECRET_KEY` only if step-up CAPTCHA is enabled

No code path may silently fall back from an absent server variable to a paid public mode.

## 11. Data retention and privacy

- Do not store raw IP addresses in application tables.
- Chat content default retention: 7 days, then delete.
- Idempotency records default retention: 24 hours.
- Anonymous users inactive for 30 days are cleaned by a reviewed scheduled job after their owned data is deleted or expired.
- Closed-round individual ballots are retained only for the defined audit window, then reduced to aggregate counts.
- Model requests keep `store: false`.
- The UI must disclose that the character response is fictional and AI-generated before the first message.

## 12. Observability

- Existing Vercel Analytics continues to measure page-level traffic only.
- Server logs use request IDs and error codes, never message content or secrets.
- Required operational counters: vote success/failure, duplicate retry, chat unlock failure, moderation rejection, quota rejection, model failure, p50/p95 latency, token usage, and daily cost.
- Cost and quota state live in Postgres, not process memory.
- Alert thresholds are set for rapid 429 growth, model error spikes, and 80% of the global daily budget.

## 13. Rollout gates

### Gate A — persistence foundation

- Add pinned Supabase dependencies and migration files.
- Create schema, RLS, indexes, seed data, and database tests.
- Keep both public feature flags `off`.

### Gate B — shadow vote

- Create anonymous sessions and write ballots to Supabase.
- Keep public totals hidden.
- Compare server receipts with migrated local selections.
- Chat stays `off`.

### Gate C — public vote

- Enable `HARNE_VOTE_MODE=public`.
- Monitor duplicate rate, write errors, and abuse.
- Keep a one-click rollback to `off` without a redeploy.

### Gate D — staff chat

- Enable chat only for a staff allowlist.
- Verify moderation, ownership, persisted quotas, deletion, and cost alerts.

### Gate E — public chat

- Enable `HARNE_CHAT_MODE=public` only after the staff window passes.
- Start with a low global budget and raise it only from observed usage.
- Add Turnstile if anonymous-session or message abuse crosses the agreed threshold.

## 14. Acceptance tests

- Two rapid identical vote requests produce one ballot and one total.
- Changing a vote replaces the active option without increasing total ballots.
- A forged option belonging to another question is rejected.
- A user cannot read or delete another user's ballot or chat thread.
- Clearing `localStorage` does not unlock chat without a server ballot.
- Two tabs cannot exceed the atomic daily quota.
- A server restart or new Vercel instance does not reset quota or cost state.
- A model request is never made after moderation rejection or exhausted quota.
- A failed model call releases reserved cost exactly once.
- No Supabase secret or OpenAI key appears in the client bundle.
- `off` flags disable writes immediately while leaving the rest of the site available.
- Mobile and desktop vote/chat flows pass keyboard, reduced-motion, and visual regression checks.

## 15. Explicitly deferred

- Email/social login and cross-device history
- Public chat rooms or fan-to-fan messaging
- Live Realtime totals
- Push notifications
- Public rendering of free-text track briefs
- Staff moderation dashboard
- Long-term chat memory or vector search
- Monetization, memberships, or paid voting

## 16. Implementation order

1. Database schema, RLS, grants, indexes, and tests
2. Anonymous SSR session and typed API contracts
3. Shared `features/harne` state layer and local-data migration
4. Durable vote submission and receipts
5. Moderation, atomic quota, and chat persistence
6. Staff-only rollout and cost observation
7. Founder review before each public feature flag changes

## 17. Current references

- Supabase anonymous sign-ins: <https://supabase.com/docs/guides/auth/auth-anonymous>
- Supabase row-level security: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase CAPTCHA protection: <https://supabase.com/docs/guides/auth/auth-captcha>
- Supabase breaking changes: <https://supabase.com/changelog?types=breaking-change>
- OpenAI moderation: <https://developers.openai.com/api/docs/guides/moderation>
- Vercel bot management: <https://vercel.com/docs/bot-management>
