# Harne Vote And Request Identity

Status: development
Owner: `web`
Contract: `harne-vote-accounting.v1`

## Source owners

| Concern | Canonical source |
| --- | --- |
| Vote admission and fresh snapshot | `app/api/harne/votes/route.ts` |
| Atomic vote and immutable receipt | `supabase/migrations/20260915111309_harne_vote_server_requests.sql` |
| Verified request identity | `lib/harne/server.ts`, `lib/harne/contracts.ts` |
| Shared staff allowlist | `lib/harne/config.ts` |
| Client intent and bounded retries | `lib/harne/client.ts` |
| Account/member/operation UI state | `components/HarneVotePage.tsx` |
| Isolated PostgreSQL regression | `scripts/test-harne-vote-db.py` |
| Offline regressions | `scripts/test-harne-vote-security.mjs`, `scripts/test-harne-actor-binding.mjs`, `scripts/test-harne-ui-state.mjs` |

## Request identity

Vote PUT, chat POST, and thread DELETE require `X-Harne-Expected-User`. The UI
captures the user when creating the intent and passes it explicitly to the client.
A later session cannot silently replace that user. The client sends the captured
ID; `getHarneMutationContext` compares it with one `getUser()`-verified server
context. All downstream queries, reservations and writes keep using that verified
context's user. The hint never authenticates or selects another account. Missing,
invalid or mismatched hints and auth errors stop enabled writes before side effects.

The current client also binds snapshot/thread GETs to its captured user.
`getHarneReadContext` enforces a supplied hint and preserves the existing
authenticated read contract when a legacy GET has no hint. This closes the current
client's A-to-cookie-B-to-session-A race without treating a browser session check
as server authentication. GET keeps working while vote mode is off.

Account changes invalidate the current UI, user data and pending operation tokens;
the user reloads Harne to enter a fresh account context. The auth callback only
invalidates local state and performs no asynchronous Supabase operation. Account
generation and member mutation generation are separate. An unrelated member's
read stays valid; only the matching owner and operation object may release busy
state. Successful sends remain acknowledged if a following history read fails.
History clear invalidates reads started before and during deletion.

## Vote transaction and replay

Only `service_role` executes `harne_submit_vote_request`; it has no direct access
to the private request ledger. The old user-JWT vote RPC is revoked without
rewriting its historical body. Browser access to `harne_api_idempotency` is also
revoked; neither current write flow trusts that old client-editable cache.

The RPC validates positive safe IDs, an 8–120 character key and a bounded brief.
It serializes one user's requests, locks question/round/option rows, verifies their
relationships and checks the wall clock after lock waits. Ballot upsert and the
immutable receipt commit together; a rollback leaves no persistent in-flight row.
A matching key replays its original receipt without changing a later ballot.
Different normalized content conflicts. Expired keys return 410 and cannot
silently repeat a historical vote. The route reads a fresh user-scoped snapshot
after the commit; failure there is an unconfirmed response, not proof no vote saved.

Identical overlapping client votes share one request. Ambiguous failures retain
the key for explicit retries, without automatic resend. The in-memory map holds
at most 32 pending/ambiguous identities and never evicts one to admit a new vote.
A successful or terminal response ends that attempt; a later intentional vote
gets a new key. Account changes separate keys. Full page reloads and separate
tabs are outside this in-memory retry guarantee.

## Verification and release

Run `pnpm test:harne-regression`, `pnpm validate:all`, production build and
desktop/mobile browser checks. These offline tests use synthetic authentication,
HTTP, database and model responses. They do not establish deployed RLS or actual
PostgreSQL transaction behavior.

The chat runtime gate is `pnpm test:harne-db --pg-bin /absolute/server/bin`.
Run the vote gate with an installed local server:

```text
python3 scripts/test-harne-vote-db.py --pg-bin /absolute/server/bin
```

Both runners accept an optional `--report` path, create a fresh private Unix-socket
cluster and stop/remove it. They never accept a remote DSN or existing data directory.
On 2026-09-15, PostgreSQL 18.6 built from checksum-verified official source passed
49 chat and 65 vote checks with synthetic auth/users. Vote checks covered replay,
conflict, expiry, preservation of a newer ballot, forced transaction rollback,
role/table denial and ownership RLS. Nine real lock barriers covered concurrent
requests and question/round/option edits, including expiry of a round while waiting
on its option lock. The new ledger adds no ballot-delete restriction; the existing
chat foreign key still restricts referenced ballot deletion. These local engine
checks do not establish hosted Supabase/Data API exposure, real authentication,
remote migration or deployment.

Expired ledger rows retain key occupancy. An explicit production retention and
deletion policy is required before activation; deleting keys blindly would make
old requests executable again. No automatic purge or account-deletion workflow
is introduced here. Roll out the new RPCs, server credential and client/server
request contract together under feature-off/maintenance controls. Remote database
changes, credentials, preview and production deployment keep their existing gates.
