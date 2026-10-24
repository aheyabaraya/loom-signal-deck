#!/usr/bin/env python3
"""Run real PostgreSQL chat accounting checks in a newly initialized local server.

Never accepts a DSN or existing data directory. No production connection is possible.
Supply an installed PostgreSQL server bin directory; no downloads are performed.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parent.parent
DAY = "(now() at time zone 'Asia/Seoul')::date"
USERS = [f"00000000-0000-4000-8000-{n:012d}" for n in range(1, 5)]
FAIL_SIGNATURE = "public.harne_fail_chat_turn(uuid,uuid,integer,jsonb,integer,integer,bigint)"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pg-bin", required=True, type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    binaries = args.pg_bin.resolve()
    for binary in ("postgres", "initdb", "pg_ctl", "psql"):
        if not (binaries / binary).is_file():
            parser.error(f"PostgreSQL server binary missing: {binary}")
    with tempfile.TemporaryDirectory(prefix="harne-chat-db-") as temporary:
        work = Path(temporary).resolve()
        work.chmod(0o700)
        data, socket = work / "data", work / "socket"
        socket.mkdir(mode=0o700)
        env = {"PATH": f"{binaries}:/usr/bin:/bin", "LC_ALL": "C", "PGPASSFILE": os.devnull, "PGSERVICEFILE": os.devnull}
        report = {"status": "running", "database": "fresh synthetic local Unix-socket server", "checks": [], "remote_database_applied": False}
        def command(argv, **kwargs):
            return subprocess.run([str(x) for x in argv], env=env, capture_output=True, text=True, timeout=60, **kwargs)
        def control(*parameters):
            result = command([binaries / "pg_ctl", "-D", data, *parameters])
            if result.returncode: raise RuntimeError(result.stderr + result.stdout)
        command_init = command([binaries / "initdb", "-D", data, "-U", "harne_fixture_owner", "--auth-local=trust", "--auth-host=reject", "--no-locale", "-E", "UTF8"])
        if command_init.returncode: raise RuntimeError(command_init.stderr)
        config = data / "postgresql.conf"
        with config.open("a") as handle:
            handle.write(f"\nlisten_addresses = ''\nunix_socket_directories = '{socket}'\nunix_socket_permissions = 0700\nport = 55432\nmax_connections = 12\n")
        control("-l", str(work / "server.log"), "-w", "start")
        base = [str(binaries / "psql"), "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-h", str(socket), "-p", "55432", "-U", "harne_fixture_owner", "-d", "postgres"]
        def sql(source, *, allowed_failure=False):
            result = command(base, input=source)
            if result.returncode and not allowed_failure:
                raise AssertionError(result.stderr.strip())
            return result
        def value(source): return sql(source).stdout.strip().splitlines()[-1]
        def query(source): return json.loads(value(source))
        def ok(condition, name):
            if not condition: raise AssertionError(name)
            report["checks"].append(name)
        def call(expression): return query("set role service_role; select " + expression + ";")
        def lit(value): return "'" + str(value).replace("'", "''") + "'"
        def errbody(): return "'{\"error\":{\"code\":\"CHAT_MODEL_FAILED\",\"message\":\"Fixture failure\"}}'::jsonb"
        options = {}
        def reserve(user=USERS[0], member="M01", key=None, amount=5000, digest="a" * 64):
            question, option = options[member]
            key = key or str(uuid.uuid4())
            expression = f"public.harne_reserve_chat_turn({lit(user)}::uuid,{lit(member)},{lit(key)},{lit(digest)},{amount},{question},{option})"
            return expression
        def start(row, user=USERS[0]):
            return value(f"set role service_role; select public.harne_start_chat_turn({lit(user)}::uuid,{lit(row['reservation_id'])}::uuid);") == "t"
        def finish(row, user=USERS[0], actual=165):
            body = json.dumps({"ok": True, "threadId": row["thread_id"], "memberCode": "M01", "reply": "Fixture reply", "usage": {"inputTokens": 100, "outputTokens": 20, "actualMicrousd": actual}})
            return call(f"public.harne_complete_chat_turn({lit(user)}::uuid,{lit(row['reservation_id'])}::uuid,'Fixture question','Fixture reply',100,20,{actual},{lit(body)}::jsonb)")
        def fail(row, user=USERS[0], known=None):
            extra = "" if known is None else f",100,20,{known}"
            return call(f"public.harne_fail_chat_turn({lit(user)}::uuid,{lit(row['reservation_id'])}::uuid,502,{errbody()}{extra})")
        def usage(day=DAY):
            return query(f"select jsonb_build_array(reserved_microusd,actual_microusd) from public.harne_chat_global_daily_usage where usage_day={day};")
        def reset():
            sql("truncate private.harne_chat_turn_reservations, public.harne_chat_threads, public.harne_chat_messages, public.harne_chat_daily_usage, public.harne_chat_global_daily_usage;")
        peers = []
        def overlap(first, second):
            # Keep transaction A's actual locks while starting an independent backend B.
            tag = "harne-fixture-" + uuid.uuid4().hex[:8]
            process = subprocess.Popen(base, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            peers.append(process)
            process.stdin.write(f"set application_name={lit(tag)}; begin; set local role service_role; select {first}; select pg_sleep(1.2); commit;\n")
            process.stdin.close()
            deadline = time.monotonic() + 10
            while time.monotonic() < deadline:
                if value(f"select count(*) from pg_stat_activity where application_name={lit(tag)} and wait_event='PgSleep';") == "1": break
                if process.poll() is not None: raise AssertionError("First concurrent transaction exited before barrier")
                time.sleep(0.02)
            else: raise AssertionError("Concurrent transaction barrier was not reached")
            then = time.monotonic(); result_b = call(second); duration = time.monotonic() - then
            output = process.stdout.read(); stderr = process.stderr.read(); process.wait(timeout=10)
            if process.returncode: raise AssertionError(stderr)
            result_a = json.loads(next(line for line in output.splitlines() if line.startswith("{")))
            ok(duration > 0.5, "independent transaction waited on real database locks")
            return result_a, result_b
        try:
            sql("""create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create table auth.users (id uuid primary key, created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid$$;
grant usage on schema auth, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
create schema private; grant usage on schema private to authenticated;
create function private.unchanged_fixture() returns integer language sql as $$select 1$$;
grant execute on function private.unchanged_fixture() to authenticated;
""")
            for relative in ("20260806052610_harne_vote_chat_demo.sql", "20260806054711_harne_hardening.sql"):
                sql((ROOT / "supabase/migrations" / relative).read_text())
            sql(f"insert into public.harne_chat_global_daily_usage values ({DAY},7000,11000);")
            sql((ROOT / "supabase/migrations/20260914233742_harne_chat_server_budget.sql").read_text())
            ok(usage() == [7000, 11000], "migration preserves existing global usage")
            ok(value("set role authenticated; select private.unchanged_fixture();") == "1", "unrelated private schema permissions preserved")
            sql("insert into auth.users(id) values " + ",".join(f"({lit(user)}::uuid)" for user in USERS) + ";")
            for member in ("M01", "M02", "M03"):
                rows = value(f"select q.id||','||min(o.id) from public.harne_vote_questions q join public.harne_vote_options o on o.question_id=q.id where q.subject_key={lit(member)} group by q.id;").split(",")
                options[member] = tuple(map(int, rows))
            for user in USERS:
                for question, option in options.values(): sql(f"insert into public.harne_vote_ballots(question_id,user_id,option_id) values ({question},{lit(user)}::uuid,{option});")
            signatures = ["public.harne_reserve_chat_turn(uuid,text,text,text,bigint,bigint,bigint)", "public.harne_start_chat_turn(uuid,uuid)", "public.harne_complete_chat_turn(uuid,uuid,text,text,integer,integer,bigint,jsonb)", FAIL_SIGNATURE]
            for signature in signatures:
                for role in ("anon", "authenticated"):
                    ok(value(f"select has_function_privilege({lit(role)},{lit(signature)},'execute');") == "f", f"{role} cannot invoke {signature.split('(')[0]}")
                ok(value(f"select has_function_privilege('service_role',{lit(signature)},'execute');") == "t", "trusted server RPC is executable")
            denied = sql("set role authenticated; select " + reserve() + ";", allowed_failure=True)
            ok(denied.returncode != 0 and "permission denied" in denied.stderr, "actual authenticated direct reserve call is denied")
            for signature in ["public.harne_reserve_chat_quota(text,bigint)", "public.harne_release_chat_quota(uuid,bigint)", "public.harne_settle_chat_turn(uuid,text,text,integer,integer,bigint,bigint)"]:
                ok(value(f"select has_function_privilege('authenticated',{lit(signature)},'execute') or has_function_privilege('service_role',{lit(signature)},'execute');") == "f", "legacy quota RPC execution revoked")
            for role in ("anon", "authenticated", "service_role"):
                denied = sql(f"set role {role}; select * from private.harne_chat_turn_reservations;", allowed_failure=True)
                ok(denied.returncode != 0, f"{role} has no direct reservation-table access")
            reset()
            for amount in (-1, 0, 100001): ok(call(reserve(amount=amount))["code"] == "HARNE_INVALID_INPUT", "invalid reservation amount denied")
            key = str(uuid.uuid4()); expression = reserve(key=key); row = call(expression)
            ok(row["kind"] == "new", "trusted reserve succeeds")
            ok(call(expression)["kind"] == "busy", "duplicate in-flight key does not reserve again")
            ok(call(reserve(key=key, digest="b" * 64))["kind"] == "conflict", "same key different payload rejected")
            ok(call(reserve(member="M02"))["kind"] == "busy", "one unresolved turn across members")
            ok(not start(row, USERS[1]), "different user cannot start reservation")
            ok(fail(row, USERS[1])["kind"] == "denied", "different user cannot release reservation")
            ok(start(row) and not start(row), "only one start transition succeeds")
            result = finish(row); ok(result["response_code"] == 200 and usage() == [0,165], "atomic completion settles known usage")
            ok(finish(row, actual=9000)["response_body"] == result["response_body"] and fail(row, known=9000)["response_body"] == result["response_body"] and usage() == [0,165], "completed cache and accounting are immutable")
            sql(f"set role authenticated; select set_config('request.jwt.claim.sub',{lit(USERS[0])},false); delete from public.harne_chat_threads where id={lit(row['thread_id'])}::uuid;")
            ok(call(expression)["kind"] == "cached" and value("select count(*) from private.harne_chat_turn_reservations;") == "1", "clearing visible history preserves replay identity")
            reset(); row = call(reserve()); fail(row); fail(row)
            ok(usage() == [0,0] and value("select user_message_count from public.harne_chat_daily_usage;") == "1", "pre-provider release refunds once and retains attempt count")
            reset(); row = call(reserve()); start(row); fail(row)
            ok(usage() == [5000,0] and call(reserve(member="M02"))["kind"] == "busy", "unknown started failure holds budget and blocks another turn")
            reset(); row = call(reserve()); start(row); result = fail(row, known=9000); fail(row, known=1)
            ok(result["kind"] == "failed" and usage() == [0,9000] and value("select count(*) from public.harne_chat_messages;") == "0", "known failed output records overspend once without approved messages")
            ok(call(reserve(member="M02"))["kind"] == "new", "known failed terminal permits a new properly budgeted turn")
            reset(); row = call(reserve()); start(row)
            sql(f"update public.harne_chat_global_daily_usage set reserved_microusd=0 where usage_day={DAY};")
            ok(finish(row)["kind"] == "denied" and value("select count(*) from public.harne_chat_messages;") == "0" and value("select reserved_microusd from public.harne_chat_daily_usage;") == "5000", "consistency failure rolls back inserted messages and partial member settlement")
            ok(fail(row, known=100)["kind"] == "denied" and value("select reserved_microusd from public.harne_chat_daily_usage;") == "5000", "failure settlement also rolls back partial accounting")
            reset(); row = call(reserve()); start(row); sql(f"delete from public.harne_chat_threads where id={lit(row['thread_id'])}::uuid;")
            ok(finish(row)["kind"] == "denied" and fail(row,known=100)["kind"] == "failed" and usage() == [0,100], "history clear during generation cannot erase known cost")
            reset(); sql(f"insert into public.harne_chat_global_daily_usage values ({DAY},0,94000);")
            ok(call(reserve(amount=7000))["code"] == "CHAT_GLOBAL_BUDGET_EXHAUSTED", "legacy actual spending participates in cumulative budget")
            reset(); sql(f"insert into public.harne_chat_daily_usage values ({lit(USERS[0])}::uuid,'M01',{DAY},15,0,0);")
            ok(call(reserve())["code"] == "CHAT_MEMBER_DAILY_LIMIT", "member attempt cap is enforced")
            sql(f"insert into public.harne_chat_daily_usage values ({lit(USERS[0])}::uuid,'M02',{DAY},15,0,0);")
            ok(call(reserve(member='M03'))["code"] == "CHAT_USER_DAILY_LIMIT", "user attempt cap sums across members")
            reset(); row = call(reserve()); start(row)
            # An owner-created fixture represents a turn started on the previous day.
            sql(f"alter table private.harne_chat_turn_reservations disable trigger harne_chat_turn_reservations_guard; update private.harne_chat_turn_reservations set usage_day=usage_day-1; alter table private.harne_chat_turn_reservations enable trigger harne_chat_turn_reservations_guard; update public.harne_chat_global_daily_usage set usage_day=usage_day-1; update public.harne_chat_daily_usage set usage_day=usage_day-1;")
            finish(row)
            ok(usage(f"{DAY}-1") == [0,165] and value(f"select count(*) from public.harne_chat_global_daily_usage where usage_day={DAY};") == "0", "completion uses immutable reservation day across midnight")
            reset(); sql(f"insert into public.harne_chat_global_daily_usage values ({DAY},0,90000);")
            first,second=overlap(reserve(USERS[0],amount=7000),reserve(USERS[1],amount=7000))
            ok(first['kind']=='new' and second['code']=='CHAT_GLOBAL_BUDGET_EXHAUSTED' and usage()==[7000,90000], "concurrent users cannot oversubscribe global daily budget")
            reset(); first,second=overlap(reserve(USERS[0],'M01'),reserve(USERS[0],'M02'))
            ok(first['kind']=='new' and second['kind']=='busy' and usage()==[5000,0], "concurrent member requests share per-user admission lock")
            report['status']='pass'
        except Exception as error:
            report['status']='fail'; report['failure']=str(error)
            raise
        finally:
            for process in peers:
                if process.poll() is None: process.terminate(); process.wait(timeout=10)
            control('-m','fast','-w','stop')
            report['checks_passed']=len(report['checks'])
            report['test_server_stopped']=True
            if args.report:
                args.report.parent.mkdir(parents=True,exist_ok=True)
                args.report.write_text(json.dumps(report,indent=2)+'\n')
            print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()
