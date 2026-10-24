-- Server-owned chat accounting. Apply only through an approved Web migration.
create schema if not exists private;

-- Existing private-schema grants also serve unrelated product functions.
-- This migration revokes privileges only on its own table and helpers.

create table if not exists private.harne_chat_turn_reservations (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_code text not null check (member_code ~ '^M(0[1-9]|1[0-3])$'),
  usage_day date not null,
  request_key text not null check (char_length(request_key) between 8 and 120),
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  reserved_microusd bigint not null check (reserved_microusd > 0 and reserved_microusd <= 100000),
  thread_id uuid not null, -- Historical identity survives a user clearing chat history.
  ballot_id bigint not null,
  question_id bigint not null,
  option_id bigint not null,
  status text not null check (status in ('reserved', 'started', 'completed', 'released', 'uncertain', 'failed')),
  response_code integer,
  response_body jsonb,
  input_tokens integer,
  output_tokens integer,
  actual_microusd bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_key),
  constraint harne_chat_turn_reservations_cache_chk check (
    (status in ('reserved', 'started') and response_code is null and response_body is null)
    or (
      status in ('completed', 'released', 'uncertain', 'failed')
      and response_code is not null and response_body is not null
      and pg_catalog.jsonb_typeof(response_body) = 'object'
      and pg_catalog.octet_length(response_body::text) <= 65536
      and ((status = 'completed' and response_code = 200)
        or (status <> 'completed' and response_code between 400 and 599))
    )
  ),
  constraint harne_chat_turn_reservations_cost_chk check (
    (status in ('completed', 'failed')
      and input_tokens is not null and input_tokens between 0 and 1000000
      and output_tokens is not null and output_tokens between 0 and 1000000
      and actual_microusd is not null and actual_microusd between 0 and 1000000000)
    or (status not in ('completed', 'failed')
      and input_tokens is null and output_tokens is null and actual_microusd is null)
  )
);

create unique index if not exists harne_chat_turn_reservations_one_open_per_user_day
  on private.harne_chat_turn_reservations (user_id, usage_day)
  where status in ('reserved', 'started', 'uncertain');

create index if not exists harne_chat_turn_reservations_thread_id_idx
  on private.harne_chat_turn_reservations (thread_id);

create index if not exists harne_chat_turn_reservations_user_day_idx
  on private.harne_chat_turn_reservations (user_id, usage_day, status);

alter table private.harne_chat_turn_reservations enable row level security;

revoke all on table private.harne_chat_turn_reservations from public;
revoke all on table private.harne_chat_turn_reservations from anon;
revoke all on table private.harne_chat_turn_reservations from authenticated;
revoke all on table private.harne_chat_turn_reservations from service_role;

drop policy if exists harne_chat_turn_reservations_no_direct on private.harne_chat_turn_reservations;
create policy harne_chat_turn_reservations_no_direct
  on private.harne_chat_turn_reservations
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function private.harne_chat_denied(p_code text)
returns jsonb
language sql
immutable
set search_path to ''
as $$
  select pg_catalog.jsonb_build_object('kind', 'denied', 'code', p_code);
$$;

create or replace function private.harne_chat_cache_body_ok(p_body jsonb)
returns boolean
language sql
immutable
parallel safe
set search_path to ''
as $$
  select p_body is not null
    and pg_catalog.jsonb_typeof(p_body) = 'object'
    and pg_catalog.octet_length(p_body::pg_catalog.text) >= 2
    and pg_catalog.octet_length(p_body::pg_catalog.text) <= 65536;
$$;

create or replace function private.harne_chat_lock_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('harne.chat.user:' || p_user_id::text, 87214601)
  );
end;
$$;

create or replace function private.harne_chat_lock_usage(
  p_user_id uuid,
  p_member_code text,
  p_usage_day date
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  insert into public.harne_chat_global_daily_usage (usage_day)
  values (p_usage_day)
  on conflict (usage_day) do nothing;

  perform 1
  from public.harne_chat_global_daily_usage
  where usage_day = p_usage_day
  for update;

  insert into public.harne_chat_daily_usage (user_id, member_code, usage_day)
  values (p_user_id, p_member_code, p_usage_day)
  on conflict (user_id, member_code, usage_day) do nothing;

  perform 1
  from public.harne_chat_daily_usage
  where user_id = p_user_id
    and member_code = p_member_code
    and usage_day = p_usage_day
  for update;
end;
$$;

create or replace function private.harne_chat_reservation_guard()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.member_code is distinct from old.member_code
     or new.usage_day is distinct from old.usage_day
     or new.request_key is distinct from old.request_key
     or new.request_sha256 is distinct from old.request_sha256
     or new.reserved_microusd is distinct from old.reserved_microusd
     or new.thread_id is distinct from old.thread_id
     or new.ballot_id is distinct from old.ballot_id
     or new.question_id is distinct from old.question_id
     or new.option_id is distinct from old.option_id
  then
    raise exception using errcode = 'P0001', message = 'HARNE_RESERVATION_IMMUTABLE';
  end if;

  if old.status = 'reserved' then
    if new.status not in ('reserved', 'started', 'released') then
      raise exception using errcode = 'P0001', message = 'HARNE_RESERVATION_IMMUTABLE';
    end if;
    if new.status = 'started' and (
      new.response_code is not null
      or new.response_body is not null
      or new.actual_microusd is not null
      or new.input_tokens is not null
      or new.output_tokens is not null
    ) then
      raise exception using errcode = 'P0001', message = 'HARNE_RESERVATION_IMMUTABLE';
    end if;
  elsif old.status = 'started' then
    if new.status not in ('started', 'completed', 'uncertain', 'failed') then
      raise exception using errcode = 'P0001', message = 'HARNE_RESERVATION_IMMUTABLE';
    end if;
  elsif old.status in ('completed', 'released', 'uncertain', 'failed') then
    if new.status is distinct from old.status
       or new.response_code is distinct from old.response_code
       or new.response_body is distinct from old.response_body
       or new.input_tokens is distinct from old.input_tokens
       or new.output_tokens is distinct from old.output_tokens
       or new.actual_microusd is distinct from old.actual_microusd
    then
      raise exception using errcode = 'P0001', message = 'HARNE_RESERVATION_IMMUTABLE';
    end if;
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists harne_chat_turn_reservations_guard on private.harne_chat_turn_reservations;
create trigger harne_chat_turn_reservations_guard
before update on private.harne_chat_turn_reservations
for each row execute function private.harne_chat_reservation_guard();

revoke all on function private.harne_chat_denied(text) from public, anon, authenticated, service_role;
revoke all on function private.harne_chat_cache_body_ok(jsonb) from public, anon, authenticated, service_role;
revoke all on function private.harne_chat_lock_user(uuid) from public, anon, authenticated, service_role;
revoke all on function private.harne_chat_lock_usage(uuid, text, date) from public, anon, authenticated, service_role;
revoke all on function private.harne_chat_reservation_guard() from public, anon, authenticated, service_role;

create or replace function public.harne_reserve_chat_turn(
  p_user_id uuid,
  p_member_code text,
  p_request_key text,
  p_request_sha256 text,
  p_reserved_microusd bigint,
  p_question_id bigint,
  p_option_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_existing private.harne_chat_turn_reservations;
  v_day date;
  v_kind text;
  v_subject text;
  v_round_status text;
  v_opens timestamptz;
  v_closes timestamptz;
  v_ballot_id bigint;
  v_thread_id uuid;
  v_member_count integer;
  v_user_count integer;
  v_global_reserved bigint;
  v_global_actual bigint;
  v_reservation_id uuid;
  v_global_limit bigint := 100000;
begin
  if p_user_id is null then
    return private.harne_chat_denied('HARNE_AUTH_REQUIRED');
  end if;

  if p_member_code is null or p_member_code !~ '^M(0[1-9]|1[0-3])$' then
    return private.harne_chat_denied('HARNE_INVALID_INPUT');
  end if;

  if p_request_key is null or pg_catalog.char_length(p_request_key) < 8 or pg_catalog.char_length(p_request_key) > 120 then
    return private.harne_chat_denied('HARNE_INVALID_INPUT');
  end if;

  if p_request_sha256 is null or p_request_sha256 !~ '^[0-9a-f]{64}$' then
    return private.harne_chat_denied('HARNE_INVALID_INPUT');
  end if;

  if p_reserved_microusd is null or p_reserved_microusd <= 0 or p_reserved_microusd > v_global_limit then
    return private.harne_chat_denied('HARNE_INVALID_INPUT');
  end if;

  if p_question_id is null or p_option_id is null then
    return private.harne_chat_denied('HARNE_INVALID_INPUT');
  end if;

  begin
    perform private.harne_chat_lock_user(p_user_id);

    select *
      into v_existing
    from private.harne_chat_turn_reservations
    where user_id = p_user_id
      and request_key = p_request_key;

    if found then
      if v_existing.request_sha256 is distinct from p_request_sha256 then
        return pg_catalog.jsonb_build_object('kind', 'conflict', 'code', 'HARNE_IDEMPOTENCY_CONFLICT');
      end if;
      if v_existing.status in ('completed', 'released', 'uncertain', 'failed') then
        return pg_catalog.jsonb_build_object(
          'kind', 'cached',
          'response_code', v_existing.response_code,
          'response_body', v_existing.response_body
        );
      end if;
      return pg_catalog.jsonb_build_object('kind', 'busy', 'code', 'HARNE_IDEMPOTENCY_CONFLICT');
    end if;

    select question.kind, question.subject_key, round.status, round.opens_at, round.closes_at
      into v_kind, v_subject, v_round_status, v_opens, v_closes
    from public.harne_vote_questions question
    join public.harne_vote_rounds round on round.id = question.round_id
    where question.id = p_question_id;

    if not found then
      return private.harne_chat_denied('CHAT_VOTE_REQUIRED');
    end if;

    if v_kind is distinct from 'member_identity' or v_subject is distinct from p_member_code then
      return private.harne_chat_denied('CHAT_VOTE_REQUIRED');
    end if;

    if v_round_status is distinct from 'open'
       or (v_opens is not null and v_opens > pg_catalog.now())
       or (v_closes is not null and v_closes < pg_catalog.now()) then
      return private.harne_chat_denied('HARNE_ROUND_CLOSED');
    end if;

    if not exists (
      select 1
      from public.harne_vote_options option
      where option.id = p_option_id
        and option.question_id = p_question_id
    ) then
      return private.harne_chat_denied('HARNE_OPTION_INVALID');
    end if;

    select ballot.id
      into v_ballot_id
    from public.harne_vote_ballots ballot
    where ballot.question_id = p_question_id
      and ballot.user_id = p_user_id
      and ballot.option_id = p_option_id;

    if v_ballot_id is null then
      return private.harne_chat_denied('CHAT_VOTE_REQUIRED');
    end if;

    v_day := (pg_catalog.timezone('Asia/Seoul', pg_catalog.now()))::pg_catalog.date;

    if exists (
      select 1
      from private.harne_chat_turn_reservations
      where user_id = p_user_id
        and usage_day = v_day
        and status in ('reserved', 'started', 'uncertain')
    ) then
      return pg_catalog.jsonb_build_object('kind', 'busy', 'code', 'HARNE_IDEMPOTENCY_CONFLICT');
    end if;

    perform private.harne_chat_lock_usage(p_user_id, p_member_code, v_day);

    select usage.user_message_count
      into v_member_count
    from public.harne_chat_daily_usage usage
    where usage.user_id = p_user_id
      and usage.member_code = p_member_code
      and usage.usage_day = v_day;

    select coalesce(pg_catalog.sum(usage.user_message_count), 0)::integer
      into v_user_count
    from public.harne_chat_daily_usage usage
    where usage.user_id = p_user_id
      and usage.usage_day = v_day;

    select global_usage.reserved_microusd, global_usage.actual_microusd
      into v_global_reserved, v_global_actual
    from public.harne_chat_global_daily_usage global_usage
    where global_usage.usage_day = v_day;

    if v_member_count >= 15 then
      return private.harne_chat_denied('CHAT_MEMBER_DAILY_LIMIT');
    end if;

    if v_user_count >= 30 then
      return private.harne_chat_denied('CHAT_USER_DAILY_LIMIT');
    end if;

    if v_global_actual + v_global_reserved + p_reserved_microusd > v_global_limit then
      return private.harne_chat_denied('CHAT_GLOBAL_BUDGET_EXHAUSTED');
    end if;

    insert into public.harne_chat_threads (user_id, member_code, unlock_ballot_id)
    values (p_user_id, p_member_code, v_ballot_id)
    on conflict (user_id, member_code) do update
      set unlock_ballot_id = public.harne_chat_threads.unlock_ballot_id
    returning id into v_thread_id;

    update public.harne_chat_daily_usage
    set user_message_count = user_message_count + 1,
        reserved_microusd = reserved_microusd + p_reserved_microusd
    where user_id = p_user_id
      and member_code = p_member_code
      and usage_day = v_day;

    update public.harne_chat_global_daily_usage
    set reserved_microusd = reserved_microusd + p_reserved_microusd
    where usage_day = v_day;

    insert into private.harne_chat_turn_reservations (
      user_id,
      member_code,
      usage_day,
      request_key,
      request_sha256,
      reserved_microusd,
      thread_id,
      ballot_id,
      question_id,
      option_id,
      status
    )
    values (
      p_user_id,
      p_member_code,
      v_day,
      p_request_key,
      p_request_sha256,
      p_reserved_microusd,
      v_thread_id,
      v_ballot_id,
      p_question_id,
      p_option_id,
      'reserved'
    )
    returning id into v_reservation_id;

    return pg_catalog.jsonb_build_object(
      'kind', 'new',
      'reservation_id', v_reservation_id,
      'thread_id', v_thread_id,
      'ballot_id', v_ballot_id
    );
  exception
    when unique_violation then
      return pg_catalog.jsonb_build_object('kind', 'busy', 'code', 'HARNE_IDEMPOTENCY_CONFLICT');
    when others then
      return private.harne_chat_denied('HARNE_DEPENDENCY_UNAVAILABLE');
  end;
end;
$$;

create or replace function public.harne_start_chat_turn(
  p_user_id uuid,
  p_reservation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_updated integer;
begin
  if p_user_id is null or p_reservation_id is null then
    return false;
  end if;

  begin
    perform private.harne_chat_lock_user(p_user_id);

    update private.harne_chat_turn_reservations
    set status = 'started'
    where id = p_reservation_id
      and user_id = p_user_id
      and status = 'reserved';

    get diagnostics v_updated = row_count;
    return v_updated = 1;
  exception
    when others then
      return false;
  end;
end;
$$;

create or replace function public.harne_complete_chat_turn(
  p_user_id uuid,
  p_reservation_id uuid,
  p_user_content text,
  p_assistant_content text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_actual_microusd bigint,
  p_response_body jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row private.harne_chat_turn_reservations;
  v_thread_id uuid;
  v_updated integer;
begin
  if p_user_id is null or p_reservation_id is null then
    return private.harne_chat_denied('HARNE_AUTH_REQUIRED');
  end if;

  begin
    perform private.harne_chat_lock_user(p_user_id);

    select thread_id
      into v_thread_id
    from private.harne_chat_turn_reservations
    where id = p_reservation_id
      and user_id = p_user_id;

    if not found then
      return private.harne_chat_denied('HARNE_NOT_FOUND');
    end if;

    select *
      into v_row
    from private.harne_chat_turn_reservations
    where id = p_reservation_id
      and user_id = p_user_id
    for update;

    if not found then
      return private.harne_chat_denied('HARNE_NOT_FOUND');
    end if;

    if v_row.status in ('completed', 'released', 'uncertain', 'failed') then
      return pg_catalog.jsonb_build_object(
        'kind', 'cached',
        'response_code', v_row.response_code,
        'response_body', v_row.response_body
      );
    end if;

    if v_row.status is distinct from 'started' then
      return private.harne_chat_denied('HARNE_TURN_NOT_STARTED');
    end if;

    if p_user_content is null or pg_catalog.char_length(p_user_content) < 1 or pg_catalog.char_length(p_user_content) > 1000 then
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    if p_assistant_content is null or pg_catalog.char_length(p_assistant_content) < 1 or pg_catalog.char_length(p_assistant_content) > 1000 then
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    if p_input_tokens is null or p_input_tokens < 0 or p_input_tokens > 1000000 then
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    if p_output_tokens is null or p_output_tokens < 0 or p_output_tokens > 1000000 then
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    if p_actual_microusd is null or p_actual_microusd < 0 or p_actual_microusd > 1000000000 then
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    if not private.harne_chat_cache_body_ok(p_response_body) then
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    perform 1 from public.harne_chat_threads
    where id = v_row.thread_id and user_id = p_user_id
    for update;
    if not found then
      raise exception using errcode = 'P0001', message = 'HARNE_THREAD_MISSING';
    end if;

    perform private.harne_chat_lock_usage(p_user_id, v_row.member_code, v_row.usage_day);

    insert into public.harne_chat_messages (thread_id, role, content, moderation_status)
    values (v_row.thread_id, 'user', p_user_content, 'approved');

    insert into public.harne_chat_messages (
      thread_id, role, content, moderation_status, input_tokens, output_tokens, cost_microusd
    )
    values (
      v_row.thread_id,
      'assistant',
      p_assistant_content,
      'approved',
      p_input_tokens,
      p_output_tokens,
      p_actual_microusd
    );

    update public.harne_chat_threads
    set last_message_at = pg_catalog.now()
    where id = v_row.thread_id;

    update public.harne_chat_daily_usage
    set reserved_microusd = reserved_microusd - v_row.reserved_microusd,
        actual_microusd = actual_microusd + p_actual_microusd
    where user_id = p_user_id
      and member_code = v_row.member_code
      and usage_day = v_row.usage_day
      and reserved_microusd >= v_row.reserved_microusd;

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
    end if;

    update public.harne_chat_global_daily_usage
    set reserved_microusd = reserved_microusd - v_row.reserved_microusd,
        actual_microusd = actual_microusd + p_actual_microusd
    where usage_day = v_row.usage_day
      and reserved_microusd >= v_row.reserved_microusd;

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
    end if;

    update private.harne_chat_turn_reservations
    set status = 'completed',
        response_code = 200,
        response_body = p_response_body,
        input_tokens = p_input_tokens,
        output_tokens = p_output_tokens,
        actual_microusd = p_actual_microusd
    where id = v_row.id
      and status = 'started';

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
    end if;

    return pg_catalog.jsonb_build_object(
      'kind', 'completed',
      'response_code', 200,
      'response_body', p_response_body
    );
  exception
    when others then
      return private.harne_chat_denied('HARNE_DEPENDENCY_UNAVAILABLE');
  end;
end;
$$;

create or replace function public.harne_fail_chat_turn(
  p_user_id uuid,
  p_reservation_id uuid,
  p_response_code integer,
  p_response_body jsonb,
  p_input_tokens integer default null,
  p_output_tokens integer default null,
  p_actual_microusd bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row private.harne_chat_turn_reservations;
  v_updated integer;
  v_usage_known boolean;
begin
  if p_user_id is null or p_reservation_id is null then
    return private.harne_chat_denied('HARNE_AUTH_REQUIRED');
  end if;

  begin
    perform private.harne_chat_lock_user(p_user_id);

    select *
      into v_row
    from private.harne_chat_turn_reservations
    where id = p_reservation_id
      and user_id = p_user_id
    for update;

    if not found then
      return private.harne_chat_denied('HARNE_NOT_FOUND');
    end if;

    if v_row.status in ('completed', 'released', 'uncertain', 'failed') then
      return pg_catalog.jsonb_build_object(
        'kind', 'cached',
        'response_code', v_row.response_code,
        'response_body', v_row.response_body
      );
    end if;

    if p_response_code is null or p_response_code < 400 or p_response_code > 599 then
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    if not private.harne_chat_cache_body_ok(p_response_body) then
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    if p_input_tokens is null and p_output_tokens is null and p_actual_microusd is null then
      v_usage_known := false;
    elsif p_input_tokens is not null
      and p_output_tokens is not null
      and p_actual_microusd is not null
      and p_input_tokens >= 0 and p_input_tokens <= 1000000
      and p_output_tokens >= 0 and p_output_tokens <= 1000000
      and p_actual_microusd >= 0 and p_actual_microusd <= 1000000000 then
      v_usage_known := true;
    else
      return private.harne_chat_denied('HARNE_INVALID_INPUT');
    end if;

    if v_row.status = 'reserved' then
      if v_usage_known then
        return private.harne_chat_denied('HARNE_INVALID_INPUT');
      end if;

      perform private.harne_chat_lock_usage(p_user_id, v_row.member_code, v_row.usage_day);

      update public.harne_chat_daily_usage
      set reserved_microusd = reserved_microusd - v_row.reserved_microusd
      where user_id = p_user_id
        and member_code = v_row.member_code
        and usage_day = v_row.usage_day
        and reserved_microusd >= v_row.reserved_microusd;

      get diagnostics v_updated = row_count;
      if v_updated <> 1 then
        raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
      end if;

      update public.harne_chat_global_daily_usage
      set reserved_microusd = reserved_microusd - v_row.reserved_microusd
      where usage_day = v_row.usage_day
        and reserved_microusd >= v_row.reserved_microusd;

      get diagnostics v_updated = row_count;
      if v_updated <> 1 then
        raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
      end if;

      update private.harne_chat_turn_reservations
      set status = 'released',
          response_code = p_response_code,
          response_body = p_response_body
      where id = v_row.id
        and status = 'reserved';

      get diagnostics v_updated = row_count;
      if v_updated <> 1 then
        raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
      end if;

      return pg_catalog.jsonb_build_object(
        'kind', 'released',
        'response_code', p_response_code,
        'response_body', p_response_body
      );
    end if;

    if v_row.status = 'started' and not v_usage_known then
      perform private.harne_chat_lock_usage(p_user_id, v_row.member_code, v_row.usage_day);
      if not exists (select 1 from public.harne_chat_global_daily_usage
        where usage_day = v_row.usage_day and reserved_microusd >= v_row.reserved_microusd)
        or not exists (select 1 from public.harne_chat_daily_usage
        where user_id = p_user_id and member_code = v_row.member_code
          and usage_day = v_row.usage_day and reserved_microusd >= v_row.reserved_microusd) then
        raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
      end if;

      update private.harne_chat_turn_reservations
      set status = 'uncertain',
          response_code = p_response_code,
          response_body = p_response_body
      where id = v_row.id
        and status = 'started';

      get diagnostics v_updated = row_count;
      if v_updated <> 1 then
        raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
      end if;

      return pg_catalog.jsonb_build_object(
        'kind', 'uncertain',
        'response_code', p_response_code,
        'response_body', p_response_body
      );
    end if;

    if v_row.status = 'started' and v_usage_known then
      perform private.harne_chat_lock_usage(p_user_id, v_row.member_code, v_row.usage_day);

      update public.harne_chat_daily_usage
      set reserved_microusd = reserved_microusd - v_row.reserved_microusd,
          actual_microusd = actual_microusd + p_actual_microusd
      where user_id = p_user_id
        and member_code = v_row.member_code
        and usage_day = v_row.usage_day
        and reserved_microusd >= v_row.reserved_microusd;

      get diagnostics v_updated = row_count;
      if v_updated <> 1 then
        raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
      end if;

      update public.harne_chat_global_daily_usage
      set reserved_microusd = reserved_microusd - v_row.reserved_microusd,
          actual_microusd = actual_microusd + p_actual_microusd
      where usage_day = v_row.usage_day
        and reserved_microusd >= v_row.reserved_microusd;

      get diagnostics v_updated = row_count;
      if v_updated <> 1 then
        raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
      end if;

      update private.harne_chat_turn_reservations
      set status = 'failed',
          response_code = p_response_code,
          response_body = p_response_body,
          input_tokens = p_input_tokens,
          output_tokens = p_output_tokens,
          actual_microusd = p_actual_microusd
      where id = v_row.id
        and status = 'started';

      get diagnostics v_updated = row_count;
      if v_updated <> 1 then
        raise exception using errcode = 'P0001', message = 'HARNE_COUNTER_MISMATCH';
      end if;

      return pg_catalog.jsonb_build_object(
        'kind', 'failed',
        'response_code', p_response_code,
        'response_body', p_response_body
      );
    end if;

    return private.harne_chat_denied('HARNE_DEPENDENCY_UNAVAILABLE');
  exception
    when others then
      return private.harne_chat_denied('HARNE_DEPENDENCY_UNAVAILABLE');
  end;
end;
$$;

revoke all on function public.harne_reserve_chat_turn(uuid, text, text, text, bigint, bigint, bigint) from public;
revoke all on function public.harne_reserve_chat_turn(uuid, text, text, text, bigint, bigint, bigint) from anon;
revoke all on function public.harne_reserve_chat_turn(uuid, text, text, text, bigint, bigint, bigint) from authenticated;
grant execute on function public.harne_reserve_chat_turn(uuid, text, text, text, bigint, bigint, bigint) to service_role;

revoke all on function public.harne_start_chat_turn(uuid, uuid) from public;
revoke all on function public.harne_start_chat_turn(uuid, uuid) from anon;
revoke all on function public.harne_start_chat_turn(uuid, uuid) from authenticated;
grant execute on function public.harne_start_chat_turn(uuid, uuid) to service_role;

revoke all on function public.harne_complete_chat_turn(uuid, uuid, text, text, integer, integer, bigint, jsonb) from public;
revoke all on function public.harne_complete_chat_turn(uuid, uuid, text, text, integer, integer, bigint, jsonb) from anon;
revoke all on function public.harne_complete_chat_turn(uuid, uuid, text, text, integer, integer, bigint, jsonb) from authenticated;
grant execute on function public.harne_complete_chat_turn(uuid, uuid, text, text, integer, integer, bigint, jsonb) to service_role;

revoke all on function public.harne_fail_chat_turn(uuid, uuid, integer, jsonb, integer, integer, bigint) from public;
revoke all on function public.harne_fail_chat_turn(uuid, uuid, integer, jsonb, integer, integer, bigint) from anon;
revoke all on function public.harne_fail_chat_turn(uuid, uuid, integer, jsonb, integer, integer, bigint) from authenticated;
grant execute on function public.harne_fail_chat_turn(uuid, uuid, integer, jsonb, integer, integer, bigint) to service_role;

revoke all on function public.harne_reserve_chat_quota(text, bigint) from public;
revoke all on function public.harne_reserve_chat_quota(text, bigint) from anon;
revoke all on function public.harne_reserve_chat_quota(text, bigint) from authenticated;
revoke all on function public.harne_reserve_chat_quota(text, bigint) from service_role;

revoke all on function public.harne_release_chat_quota(uuid, bigint) from public;
revoke all on function public.harne_release_chat_quota(uuid, bigint) from anon;
revoke all on function public.harne_release_chat_quota(uuid, bigint) from authenticated;
revoke all on function public.harne_release_chat_quota(uuid, bigint) from service_role;

revoke all on function public.harne_settle_chat_turn(uuid, text, text, integer, integer, bigint, bigint) from public;
revoke all on function public.harne_settle_chat_turn(uuid, text, text, integer, integer, bigint, bigint) from anon;
revoke all on function public.harne_settle_chat_turn(uuid, text, text, integer, integer, bigint, bigint) from authenticated;
revoke all on function public.harne_settle_chat_turn(uuid, text, text, integer, integer, bigint, bigint) from service_role;

create or replace function public.harne_cleanup_demo_data()
returns void
language sql
security definer
set search_path to ''
as $$
  delete from public.harne_api_idempotency where expires_at < pg_catalog.now();
  delete from public.harne_chat_messages where created_at < pg_catalog.now() - interval '7 days';
  delete from public.harne_chat_global_daily_usage g
  where g.usage_day < (pg_catalog.timezone('Asia/Seoul', pg_catalog.now()))::pg_catalog.date - 30
    and not exists (
      select 1
      from private.harne_chat_turn_reservations r
      where r.usage_day = g.usage_day
        and r.status in ('reserved', 'started', 'uncertain')
    );
  delete from public.harne_chat_daily_usage d
  where d.usage_day < (pg_catalog.timezone('Asia/Seoul', pg_catalog.now()))::pg_catalog.date - 30
    and not exists (
      select 1
      from private.harne_chat_turn_reservations r
      where r.usage_day = d.usage_day
        and r.user_id = d.user_id
        and r.member_code = d.member_code
        and r.status in ('reserved', 'started', 'uncertain')
    );
$$;

revoke all on function public.harne_cleanup_demo_data() from public;
revoke all on function public.harne_cleanup_demo_data() from anon;
revoke all on function public.harne_cleanup_demo_data() from authenticated;
grant execute on function public.harne_cleanup_demo_data() to service_role;
