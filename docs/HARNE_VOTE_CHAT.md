# Harne vote/chat runbook

Current implementation and rollout authority: [Harne chat security](architecture/harne-chat-security.md) and [vote/request identity](architecture/harne-vote-security.md).
The account observations below are historical reports from 2026-08-06, not a
current account or production verification. The new chat accounting migration
has not been applied to a remote database by this local security review.

## What is connected

- `harne-demo-2026` is an open Supabase round with 13 member questions and 1 next-track question.
- Vote writes use the authenticated user, an atomic RPC, and an `Idempotency-Key`.
- Chat requires that user's member vote, stores the thread/messages in Supabase, moderates input and output, and settles quota/cost atomically.
- `/login` contains Google, GitHub, and email magic-link entry points. `/auth/callback` completes the PKCE exchange.
- The OpenAI key is read only on the server. It is never sent to the browser.

## Supabase Auth setup

In the `aheyabaraya_prod` project:

1. Enable Anonymous Users for one-click demo sessions.
2. Keep Email enabled for magic links.
3. Add the local and deployed callback URLs to Auth URL Configuration:
   - `http://localhost:3000/auth/callback`
   - `https://<deployed-host>/auth/callback`
4. For Google/GitHub, create provider credentials and add the Supabase Auth callback URL shown by the provider page. The buttons are already wired; provider credentials remain project-owned settings.

The current project was checked live on 2026-08-06: Email is enabled, while Anonymous, Google, and GitHub providers are disabled. The app's OAuth callback and magic-link flow are ready, but the project-level provider switches and redirect allowlist still need to be changed in Supabase. Until one of those sign-in paths is enabled, `/vote` correctly stops at the authentication gate.

The existing OpenAI key was re-probed on 2026-08-06. `omni-moderation-latest` and the configured `gpt-5.4-nano` Responses call both returned HTTP 200, which records availability at that time; current provider/account availability was not re-probed in this review. The server still enforces input/output moderation, per-user/member limits, and the demo-wide cost ceiling.

## What requires project-owner input

- To make the one-click demo work, enable **Anonymous Users** and add the local/deployed callback URLs above.
- To use Google or GitHub, create the provider application credentials and enter them in Supabase Auth Providers. Those credentials cannot be generated from this repository.
- This workspace did not have an authenticated Supabase Dashboard session or a Supabase Management API token, so no provider switch was guessed or written through internal database tables.

## Local run

Use the project-owned environment setup. Keep `OPENAI_API_KEY` and the new
`SUPABASE_SERVICE_ROLE_KEY` server-only, and set the Supabase URL/publishable key.
The chat route requires the reviewed new RPC migration and its server credential;
follow the linked security contract before enabling chat. Then:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/vote`, start an anonymous session or use `/login`, choose a member identity, and open Member Chat. Chat is deliberately bounded to 15 sends per member/day, 30 sends/user/day, and a small demo-wide daily budget.

## Verification

```bash
pnpm validate:harne
pnpm test:harne-security
pnpm type-check
pnpm build
```

The previously documented migrations are `harne_vote_chat_demo`, `harne_hardening`, and `harne_foreign_key_indexes`. They do not alter the existing application tables.

The new `20260914233742_harne_chat_server_budget.sql` migration changes chat
RPC execution privileges and must be rolled out with the new server route.
Its isolated SQL and concurrent transaction gate is `pnpm test:harne-db
--pg-bin /absolute/path/to/postgresql/bin`. No remote application is implied.

The local vote request migration is `20260915111309_harne_vote_server_requests.sql`.
Current clients bind vote/chat/clear intents to an expected user; the same verified
server context must match before effects. Run `pnpm test:harne-regression`.
This migration and the new request contract have not been remotely activated.
