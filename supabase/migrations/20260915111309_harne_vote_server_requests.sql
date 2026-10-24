-- Append-only vote request ledger + trusted RPC.
-- Replay window is created_at + 24 hours. Completed receipts only; never persist in_flight.
-- Expired rows are retained so the same key cannot silently start a new vote.
-- Production DELETE/purge of expired keys is a separate cleanup review.
-- Old harne_submit_vote body is left unchanged; execution is revoked.
-- Old harne_api_idempotency is unused by chat; browser table DML/select is revoked.

revoke all on function public.harne_submit_vote(bigint, bigint, text)
  from public, anon, authenticated, service_role;

revoke insert, update, delete, select
  on table public.harne_api_idempotency
  from public, anon, authenticated;

create schema if not exists private;

create table if not exists private.harne_vote_request_ledger (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key text not null check (char_length(request_key) between 8 and 120),
  question_id bigint not null check (question_id > 0),
  option_id bigint not null check (option_id > 0),
  brief text check (brief is null or char_length(brief) <= 240),
  ballot_id bigint not null check (ballot_id > 0),
  ballot_updated_at timestamptz not null,
  response_code integer not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  primary key (user_id, request_key),
  check (expires_at = created_at + interval '24 hours')
);

create index if not exists harne_vote_request_ledger_expires_at_idx
  on private.harne_vote_request_ledger (expires_at);

comment on table private.harne_vote_request_ledger is
  'Append-only vote receipts in private. Replay = 24h from created_at. No in_flight rows. Historical ballot_id is stored without a ballot FK. Do not purge expired keys without a reuse review.';

alter table private.harne_vote_request_ledger enable row level security;

revoke all on table private.harne_vote_request_ledger
  from public, anon, authenticated, service_role;

create or replace function private.harne_vote_request_envelope(
  p_kind text,
  p_response_code integer,
  p_code text default null,
  p_ballot_id bigint default null,
  p_question_id bigint default null,
  p_option_id bigint default null,
  p_updated_at timestamptz default null
)
returns jsonb
language sql
immutable
set search_path to ''
as $$
  select
    case
      when p_code is null then
        pg_catalog.jsonb_build_object(
          'kind', p_kind,
          'response_code', p_response_code,
          'receipt', r.receipt
        )
      else
        pg_catalog.jsonb_build_object(
          'kind', p_kind,
          'code', p_code,
          'response_code', p_response_code,
          'receipt', r.receipt
        )
    end
  from (
    select
      case
        when p_ballot_id is null then null::jsonb
        else pg_catalog.jsonb_build_object(
          'ballotId', p_ballot_id,
          'questionId', p_question_id,
          'optionId', p_option_id,
          'updatedAt', p_updated_at
        )
      end as receipt
  ) as r;
$$;

revoke all on function private.harne_vote_request_envelope(text, integer, text, bigint, bigint, bigint, timestamptz)
  from public, anon, authenticated, service_role;

create or replace function public.harne_submit_vote_request(
  p_user_id uuid,
  p_request_key text,
  p_question_id bigint,
  p_option_id bigint,
  p_brief text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_now timestamptz;
  v_request_key text;
  v_brief text;
  v_ledger_user_id uuid;
  v_ledger_question_id bigint;
  v_ledger_option_id bigint;
  v_ledger_brief text;
  v_ledger_ballot_id bigint;
  v_ledger_ballot_updated_at timestamptz;
  v_ledger_expires_at timestamptz;
  v_round_id bigint;
  v_option_question_id bigint;
  v_round_status text;
  v_opens_at timestamptz;
  v_closes_at timestamptz;
  v_ballot_id bigint;
  v_receipt_question_id bigint;
  v_receipt_option_id bigint;
  v_receipt_updated_at timestamptz;
begin
  if p_user_id is null then
    return private.harne_vote_request_envelope('denied', 401, 'unauthorized');
  end if;

  if not exists (
    select 1
    from auth.users as auth_user
    where auth_user.id = p_user_id
  ) then
    return private.harne_vote_request_envelope('denied', 401, 'unauthorized');
  end if;

  v_request_key := nullif(pg_catalog.btrim(p_request_key), '');
  if v_request_key is null
     or pg_catalog.char_length(v_request_key) < 8
     or pg_catalog.char_length(v_request_key) > 120 then
    return private.harne_vote_request_envelope('denied', 422, 'invalid');
  end if;

  if p_question_id is null or p_option_id is null
     or p_question_id < 1 or p_option_id < 1
     or p_question_id > 9007199254740991
     or p_option_id > 9007199254740991 then
    return private.harne_vote_request_envelope('denied', 422, 'invalid');
  end if;

  if p_brief is not null and pg_catalog.char_length(p_brief) > 240 then
    return private.harne_vote_request_envelope('denied', 422, 'invalid');
  end if;

  v_brief := nullif(pg_catalog.btrim(p_brief), '');

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('harne_vote_request:' || p_user_id::text, 0)
  );

  v_now := pg_catalog.clock_timestamp();

  select
    ledger.user_id,
    ledger.question_id,
    ledger.option_id,
    ledger.brief,
    ledger.ballot_id,
    ledger.ballot_updated_at,
    ledger.expires_at
  into
    v_ledger_user_id,
    v_ledger_question_id,
    v_ledger_option_id,
    v_ledger_brief,
    v_ledger_ballot_id,
    v_ledger_ballot_updated_at,
    v_ledger_expires_at
  from private.harne_vote_request_ledger as ledger
  where ledger.user_id = p_user_id
    and ledger.request_key = v_request_key;

  if v_ledger_user_id is not null then
    if v_ledger_expires_at <= v_now then
      return private.harne_vote_request_envelope('denied', 410, 'expired');
    end if;

    if v_ledger_question_id is distinct from p_question_id
       or v_ledger_option_id is distinct from p_option_id
       or v_ledger_brief is distinct from v_brief then
      return private.harne_vote_request_envelope(
        'conflict',
        409,
        'conflict',
        v_ledger_ballot_id,
        v_ledger_question_id,
        v_ledger_option_id,
        v_ledger_ballot_updated_at
      );
    end if;

    return private.harne_vote_request_envelope(
      'cached',
      200,
      null,
      v_ledger_ballot_id,
      v_ledger_question_id,
      v_ledger_option_id,
      v_ledger_ballot_updated_at
    );
  end if;

  -- Lock each relationship before using it so concurrent catalog edits cannot
  -- move a question or option underneath an admitted vote.
  select vote_question.round_id
    into v_round_id
  from public.harne_vote_questions as vote_question
  where vote_question.id = p_question_id
  for share;
  if not found then
    return private.harne_vote_request_envelope('denied', 422, 'missing');
  end if;

  select vote_round.status, vote_round.opens_at, vote_round.closes_at
    into v_round_status, v_opens_at, v_closes_at
  from public.harne_vote_rounds as vote_round
  where vote_round.id = v_round_id
  for share;
  if not found then
    return private.harne_vote_request_envelope('denied', 422, 'missing');
  end if;

  select vote_option.question_id
    into v_option_question_id
  from public.harne_vote_options as vote_option
  where vote_option.id = p_option_id
  for share;
  if not found or v_option_question_id is distinct from p_question_id then
    return private.harne_vote_request_envelope('denied', 422, 'invalid');
  end if;

  -- now() is fixed at transaction start. Admission must check the wall clock
  -- after every possible catalog-lock wait, including option/question changes.
  v_now := pg_catalog.clock_timestamp();

  if v_round_status is distinct from 'open'
     or (v_opens_at is not null and v_opens_at > v_now)
     or (v_closes_at is not null and v_closes_at <= v_now) then
    return private.harne_vote_request_envelope('denied', 403, 'closed');
  end if;

  insert into public.harne_vote_ballots as ballot (
    question_id,
    user_id,
    option_id,
    brief
  )
  values (
    p_question_id,
    p_user_id,
    p_option_id,
    v_brief
  )
  on conflict (question_id, user_id) do update
    set option_id = excluded.option_id,
        brief = excluded.brief,
        updated_at = v_now
  returning ballot.id, ballot.question_id, ballot.option_id, ballot.updated_at
  into v_ballot_id, v_receipt_question_id, v_receipt_option_id, v_receipt_updated_at;

  insert into private.harne_vote_request_ledger (
    user_id,
    request_key,
    question_id,
    option_id,
    brief,
    ballot_id,
    ballot_updated_at,
    response_code,
    created_at,
    expires_at
  )
  values (
    p_user_id,
    v_request_key,
    p_question_id,
    p_option_id,
    v_brief,
    v_ballot_id,
    v_receipt_updated_at,
    200,
    v_now,
    v_now + interval '24 hours'
  );

  return private.harne_vote_request_envelope(
    'completed',
    200,
    null,
    v_ballot_id,
    v_receipt_question_id,
    v_receipt_option_id,
    v_receipt_updated_at
  );
end;
$$;

comment on function public.harne_submit_vote_request(uuid, text, bigint, bigint, text) is
  'Trusted vote RPC. Server supplies p_user_id after auth/staff/mode gates. One-call ballot+receipt; 24h replay; expired keys occupy the slot.';

revoke all on function public.harne_submit_vote_request(uuid, text, bigint, bigint, text)
  from public, anon, authenticated;
grant execute on function public.harne_submit_vote_request(uuid, text, bigint, bigint, text)
  to service_role;
