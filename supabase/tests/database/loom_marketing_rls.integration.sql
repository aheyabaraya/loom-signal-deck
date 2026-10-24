begin;

create or replace function pg_temp.loom_qa_assert(
  p_condition boolean,
  p_label text
)
returns void
language plpgsql
as $$
begin
  if p_condition is distinct from true then
    raise exception using
      errcode = 'P0001',
      message = format('LOOM_QA_FAILED: %s', p_label);
  end if;
end;
$$;

create or replace function pg_temp.loom_qa_expect_error(
  p_statement text,
  p_message_fragment text,
  p_label text
)
returns void
language plpgsql
as $$
declare
  v_message text;
begin
  begin
    execute p_statement;
  exception when others then
    v_message := sqlerrm;
  end;

  if v_message is null then
    raise exception using
      errcode = 'P0001',
      message = format('LOOM_QA_FAILED: %s did not fail', p_label);
  end if;

  if p_message_fragment is not null and position(p_message_fragment in v_message) = 0 then
    raise exception using
      errcode = 'P0001',
      message = format('LOOM_QA_FAILED: %s returned unexpected error: %s', p_label, v_message);
  end if;
end;
$$;

select pg_temp.loom_qa_assert(
  (
    select count(*) = 8
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'loom_campaign_touchpoints',
        'loom_marketing_events',
        'loom_fan_profiles',
        'loom_marketing_consents',
        'loom_follows',
        'loom_business_inquiries',
        'loom_membership_interests',
        'loom_experiment_assignments'
      )
      and relation.relrowsecurity
  ),
  'all eight marketing tables have RLS enabled'
);

select pg_temp.loom_qa_assert(
  not has_table_privilege('anon', 'public.loom_marketing_events', 'SELECT')
    and not has_table_privilege('anon', 'public.loom_fan_profiles', 'SELECT')
    and not has_table_privilege('anon', 'public.loom_business_inquiries', 'SELECT')
    and not has_table_privilege('anon', 'public.loom_membership_interests', 'SELECT'),
  'anon has no direct marketing table reads'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-0000000000a1',
    'authenticated',
    'authenticated',
    'loom-qa-a@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-0000000000b2',
    'authenticated',
    'authenticated',
    'loom-qa-b@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-0000000000c3',
    'authenticated',
    'authenticated',
    'loom-qa-staff@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into private.loom_staff_users (user_id, role)
values ('00000000-0000-4000-8000-0000000000c3', 'analyst');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}',
  true
);

select public.loom_save_fan_profile(
  'M01',
  'loom-track-root-signal',
  'ko-KR',
  true,
  '[
    {"subjectType":"member","subjectKey":"M01","notificationsEnabled":false},
    {"subjectType":"track","subjectKey":"loom-track-root-signal","notificationsEnabled":true}
  ]'::jsonb,
  'granted',
  'granted',
  'granted',
  'loom-privacy-2026-08'
);

insert into public.loom_membership_interests (user_id, plan_key, state)
values ('00000000-0000-4000-8000-0000000000a1', 'archive-plus', 'interested');

insert into public.loom_experiment_assignments (user_id, experiment_key, variant_key)
values ('00000000-0000-4000-8000-0000000000a1', 'fan-room-layout', 'signal-spine');

select * from public.loom_record_marketing_event(
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'campaign_entry',
  'first-signal',
  'web-first-signal-hero',
  'member',
  'M01',
  '/campaign/first-signal',
  'web',
  '{"medium":"owned","cta_position":"primary"}'::jsonb,
  now()
);

select * from public.loom_record_marketing_event(
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'campaign_entry',
  'first-signal',
  'web-first-signal-hero',
  'member',
  'M01',
  '/campaign/first-signal',
  'web',
  '{"medium":"owned","cta_position":"primary"}'::jsonb,
  now()
);

select * from public.loom_submit_business_inquiry(
  'QA User A',
  'loom-qa-a@example.invalid',
  'Loom QA',
  'ai_content_system',
  'Verify the isolated inquiry path and its owner policy.',
  'exploring',
  'undecided',
  'loom-privacy-2026-08'
);

select pg_temp.loom_qa_assert(
  (select count(*) = 1 from public.loom_fan_profiles),
  'user A sees one owned profile'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 2 from public.loom_follows),
  'user A sees two owned follows'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 4 from public.loom_marketing_consents),
  'user A sees four append-only consents'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 1 from public.loom_marketing_events),
  'idempotent event retry creates one row'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 1 from public.loom_business_inquiries),
  'user A sees one owned inquiry'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 1 from public.loom_membership_interests),
  'user A sees one owned membership interest'
);

select pg_temp.loom_qa_expect_error(
  $sql$
    select * from public.loom_record_marketing_event(
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000099',
      'page_view',
      null,
      null,
      null,
      null,
      '/fan',
      'web',
      '{"email":"must-not-pass@example.invalid"}'::jsonb,
      now()
    )
  $sql$,
  'LOOM_PROPERTIES_UNSAFE',
  'direct RPC rejects a PII property key'
);

select pg_temp.loom_qa_expect_error(
  $sql$
    select * from public.loom_record_marketing_event(
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000098',
      'page_view',
      null,
      null,
      null,
      null,
      '/fan/qa@example.invalid',
      'web',
      '{}'::jsonb,
      now()
    )
  $sql$,
  'LOOM_PATH_UNSAFE',
  'direct RPC rejects an unsafe event path'
);

select pg_temp.loom_qa_expect_error(
  $sql$
    insert into public.loom_marketing_events (
      user_id,
      session_id,
      idempotency_key,
      event_name,
      path,
      source,
      occurred_at
    ) values (
      '00000000-0000-4000-8000-0000000000a1',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000097',
      'page_view',
      '/fan',
      'web',
      now()
    )
  $sql$,
  'permission denied',
  'authenticated users cannot bypass the event RPC'
);

select pg_temp.loom_qa_expect_error(
  $sql$
    insert into public.loom_membership_interests (user_id, plan_key, state)
    values ('00000000-0000-4000-8000-0000000000b2', 'studio-circle', 'interested')
  $sql$,
  'row-level security',
  'user A cannot insert a membership row for user B'
);

select pg_temp.loom_qa_expect_error(
  $sql$select public.loom_marketing_summary(now() - interval '30 days')$sql$,
  'LOOM_STAFF_REQUIRED',
  'non-staff cannot read aggregate summary'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}',
  true
);

select pg_temp.loom_qa_assert(
  (select count(*) = 0 from public.loom_fan_profiles),
  'user B cannot read user A profile'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 0 from public.loom_follows),
  'user B cannot read user A follows'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 0 from public.loom_marketing_consents),
  'user B cannot read user A consents'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 0 from public.loom_marketing_events),
  'user B cannot read user A events'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 0 from public.loom_business_inquiries),
  'user B cannot read user A inquiry'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 0 from public.loom_membership_interests),
  'user B cannot read user A membership interest'
);
select pg_temp.loom_qa_assert(
  (
    with changed as (
      update public.loom_membership_interests
      set state = 'withdrawn'
      where user_id = '00000000-0000-4000-8000-0000000000a1'
      returning 1
    )
    select count(*) = 0 from changed
  ),
  'user B cannot update user A membership interest'
);
select pg_temp.loom_qa_assert(
  (
    with removed as (
      delete from public.loom_membership_interests
      where user_id = '00000000-0000-4000-8000-0000000000a1'
      returning 1
    )
    select count(*) = 0 from removed
  ),
  'user B cannot delete user A membership interest'
);

select public.loom_save_fan_profile(
  'M07',
  'loom-track-ink-final-master-v24',
  'en',
  false,
  '[{"subjectType":"member","subjectKey":"M07","notificationsEnabled":false}]'::jsonb,
  'withdrawn',
  'withdrawn',
  'withdrawn',
  'loom-privacy-2026-08'
);

select * from public.loom_record_marketing_event(
  '10000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000001',
  'page_view',
  null,
  null,
  'fan',
  'signal-shelf',
  '/fan',
  'direct',
  '{}'::jsonb,
  now()
);

select pg_temp.loom_qa_assert(
  (select count(*) = 1 from public.loom_fan_profiles),
  'user B sees only its own profile after save'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 1 from public.loom_marketing_events),
  'idempotency keys are scoped per user'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c3', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}',
  true
);

select pg_temp.loom_qa_assert(
  (select public.loom_is_staff()),
  'allowlisted staff identity is recognized'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 2 from public.loom_marketing_events),
  'staff can read both users event rows'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 1 from public.loom_business_inquiries),
  'staff can read the inquiry queue'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 1 from public.loom_membership_interests),
  'staff can read membership interest rows'
);
select pg_temp.loom_qa_assert(
  (select count(*) = 0 from public.loom_fan_profiles),
  'staff does not bypass owner-only fan profiles'
);
select pg_temp.loom_qa_assert(
  public.loom_marketing_summary(now() - interval '30 days')::text
    !~* '(loom-qa|example[.]invalid|Verify the isolated)',
  'staff summary contains aggregates only'
);

select pg_temp.loom_qa_expect_error(
  $sql$select * from private.loom_staff_users$sql$,
  'permission denied',
  'staff allowlist table is not exposed to authenticated users'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select pg_temp.loom_qa_expect_error(
  $sql$select * from public.loom_campaign_touchpoints$sql$,
  'permission denied',
  'anon cannot read campaign touchpoints directly'
);
select pg_temp.loom_qa_expect_error(
  $sql$
    select * from public.loom_record_marketing_event(
      '10000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000003',
      'page_view',
      null,
      null,
      null,
      null,
      '/fan',
      'direct',
      '{}'::jsonb,
      now()
    )
  $sql$,
  'permission denied',
  'anon cannot execute marketing event RPC'
);

reset role;
select 'LOOM_MARKETING_RLS_INTEGRATION_PASS' as result;
rollback;
