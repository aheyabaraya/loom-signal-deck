#!/usr/bin/env python3
"""Real vote SQL tests in a fresh, owned Unix-socket PostgreSQL cluster only."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parent.parent
USERS = [f'00000000-0000-4000-8000-{i:012d}' for i in range(1, 4)]
SIGNATURE = 'public.harne_submit_vote_request(uuid,text,bigint,bigint,text)'
MIGRATIONS = ['20260806052610_harne_vote_chat_demo.sql', '20260806054711_harne_hardening.sql',
              '20260914233742_harne_chat_server_budget.sql', '20260915111309_harne_vote_server_requests.sql']

def lit(value):
    return 'null' if value is None else "'" + str(value).replace("'", "''") + "'"

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pg-bin', required=True, type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    binaries = args.pg_bin.resolve()
    for binary in ['postgres', 'psql', 'pg_ctl', 'initdb']:
        if not (binaries / binary).is_file():
            parser.error(f'PostgreSQL server binary missing: {binary}')
    report = {'status':'running','checks':[],'database':'fresh synthetic Unix-socket cluster',
              'real_accounts':False,'remote_database_applied':False,'sources':[]}
    for name in MIGRATIONS:
        data = (ROOT/'supabase/migrations'/name).read_bytes()
        report['sources'].append({'path':'supabase/migrations/'+name,'sha256':hashlib.sha256(data).hexdigest()})
    peers = []
    with tempfile.TemporaryDirectory(prefix='harne-vote-db-') as temporary:
        work=Path(temporary);work.chmod(0o700);data=work/'data';socket=work/'socket';socket.mkdir(mode=0o700)
        env={'PATH':str(binaries)+':/usr/bin:/bin','LC_ALL':'C','PGPASSFILE':os.devnull,'PGSERVICEFILE':os.devnull}
        def command(argv,**kwargs):
            return subprocess.run([str(x) for x in argv],env=env,capture_output=True,text=True,timeout=30,**kwargs)
        def control(*parameters):
            result=command([binaries/'pg_ctl','-D',data,*parameters])
            assert result.returncode==0,result.stderr+result.stdout
        initialized=command([binaries/'initdb','-D',data,'-U','harne_fixture_owner','--auth-local=trust','--auth-host=reject','--no-locale','-E','UTF8'])
        assert initialized.returncode==0,initialized.stderr
        with (data/'postgresql.conf').open('a') as handle:
            handle.write(f"\nlisten_addresses = ''\nunix_socket_directories = '{socket}'\nunix_socket_permissions = 0700\nport = 55433\nmax_connections = 12\n")
        control('-l',work/'server.log','-w','start')
        base=[str(binaries/'psql'),'-X','-qAt','-v','ON_ERROR_STOP=1','-h',str(socket),'-p','55433','-U','harne_fixture_owner','-d','postgres']
        def sql(source,allow_failure=False):
            result=command(base,input=source)
            if result.returncode and not allow_failure:raise AssertionError(result.stderr.strip())
            return result
        def value(source):
            lines=sql(source).stdout.strip().splitlines()
            return lines[-1] if lines else ''
        def scalar(source):return json.loads(value(source))
        def ok(condition,name,**evidence):
            assert condition,name
            report['checks'].append({'name':name,**evidence})
        def vote(catalog,key=None,user=USERS[0],option=None,brief=None):
            r,q,options=catalog
            return f"public.harne_submit_vote_request({lit(user)}::uuid,{lit(key or str(uuid.uuid4()))},{q},{option or options[0]},{lit(brief)})"
        def call(expression,role='service_role'):
            return scalar(f'set role {role}; select {expression};')
        def catalog(status='open'):
            slug='fixture-'+uuid.uuid4().hex
            r=int(value(f"insert into public.harne_vote_rounds(slug,status) values({lit(slug)},{lit(status)}) returning id;"))
            q=int(value(f"insert into public.harne_vote_questions(round_id,kind,subject_key,prompt) values({r},'member_identity',{lit(slug)},'Fixture question') returning id;"))
            options=[int(value(f"insert into public.harne_vote_options(question_id,option_key,label) values({q},{lit(slug+str(i))},'Fixture option') returning id;")) for i in range(2)]
            return r,q,options
        def count(table,where='true'):return int(value(f'select count(*) from {table} where {where};'))
        def wait_for(predicate,label,seconds=5):
            end=time.monotonic()+seconds
            while time.monotonic()<end:
                if predicate():return
                time.sleep(.02)
            raise AssertionError('Barrier timeout: '+label)
        def hold_and_overlap(first_sql,second_sql,name,release_when=None):
            # A is held idle in its transaction; B must be observed waiting on A's real locks.
            tag_a='fixture-a-'+uuid.uuid4().hex[:8];tag_b='fixture-b-'+uuid.uuid4().hex[:8]
            a=subprocess.Popen(base,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);peers.append(a)
            a.stdin.write(f"set application_name={lit(tag_a)}; begin; {first_sql}; select 777;\n");a.stdin.flush()
            wait_for(lambda:value(f"select count(*) from pg_stat_activity where application_name={lit(tag_a)} and state='idle in transaction';")=='1',name+' A ready')
            b=subprocess.Popen(base,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);peers.append(b)
            b.stdin.write(f"set application_name={lit(tag_b)}; {second_sql};\n");b.stdin.close()
            def blocked():
                return value(f"select count(*) from pg_stat_activity b join pg_stat_activity a on a.pid=any(pg_blocking_pids(b.pid)) where a.application_name={lit(tag_a)} and b.application_name={lit(tag_b)} and b.wait_event_type='Lock';")=='1'
            wait_for(blocked,name+' B blocked')
            if release_when:wait_for(release_when,name+' release condition')
            a.stdin.write('commit;\n');a.stdin.close()
            stdout_a=a.stdout.read();stderr_a=a.stderr.read();a.wait(timeout=10)
            stdout_b=b.stdout.read();stderr_b=b.stderr.read();b.wait(timeout=10)
            assert a.returncode==0,stderr_a
            assert b.returncode==0,stderr_b
            ok(True,name+' independent backend waited on held transaction',blocking_observed=True)
            return stdout_a,stdout_b
        def last_json(output):return json.loads(next(line for line in reversed(output.splitlines()) if line.startswith('{')))
        try:
            sql("""create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create table auth.users(id uuid primary key,created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
create schema private; grant usage on schema private to authenticated;
create function private.unchanged_fixture() returns integer language sql as $$select 1$$;
grant execute on function private.unchanged_fixture() to authenticated;""")
            for name in MIGRATIONS:sql((ROOT/'supabase/migrations'/name).read_text())
            ok(True,'all four canonical migrations execute unchanged')
            ok(value('show listen_addresses;')=='','server has no TCP listener')
            ok(value('set role authenticated; select private.unchanged_fixture();')=='1','unrelated private grants preserved')
            sql('insert into auth.users(id) values '+','.join(f'({lit(u)}::uuid)' for u in USERS)+';')
            for role in ['anon','authenticated','service_role']:
                ok(value(f"select has_function_privilege({lit(role)},{lit(SIGNATURE)},'execute');")==('t' if role=='service_role' else 'f'),role+' new RPC execute privilege')
                ok(value(f"select has_function_privilege({lit(role)},'public.harne_submit_vote(bigint,bigint,text)','execute');")=='f',role+' legacy vote RPC revoked')
                for verb in ['select','insert','update','delete']:
                    ok(value(f"select has_table_privilege({lit(role)},'private.harne_vote_request_ledger',{lit(verb)});")=='f',role+' private ledger '+verb+' denied')
            c=catalog()
            for role in ['anon','authenticated']:
                denied=sql(f'set role {role}; select '+vote(c)+';',True)
                ok(denied.returncode!=0 and 'permission denied' in denied.stderr,role+' actual direct RPC denied')
                for verb in ['select','insert','update','delete']:
                    ok(value(f"select has_table_privilege({lit(role)},'public.harne_api_idempotency',{lit(verb)});")=='f',role+' old mutable idempotency '+verb+' revoked')
            ok(value("select relrowsecurity from pg_class where oid='private.harne_vote_request_ledger'::regclass;")=='t','private ledger RLS enabled')
            key=str(uuid.uuid4());expression=vote(c,key=key,brief='  fixture  ');first=call(expression)
            ok(first['kind']=='completed','new vote and receipt commit')
            cached=call(vote(c,key=key,brief='fixture'))
            ok(cached['kind']=='cached' and cached['receipt']==first['receipt'],'normalized replay returns immutable receipt')
            ok(call(vote(c,key=key,option=c[2][1],brief='fixture'))['kind']=='conflict','same key different option conflicts')
            ok(call(vote(c,key=key,brief='changed'))['kind']=='conflict','same key different brief conflicts')
            for user in USERS[1:]:call(vote(c,user=user))
            for user in USERS:
                own=scalar(f"set role authenticated; select set_config('request.jwt.claim.sub',{lit(user)},false); select coalesce(jsonb_agg(distinct user_id),'[]') from public.harne_vote_ballots;")
                ok(own==[user],'authenticated RLS sees only own ballots',user=user)
            denied=sql(f"set role authenticated; update public.harne_vote_ballots set option_id={c[2][1]};",True)
            ok(denied.returncode!=0 and 'permission denied' in denied.stderr,'authenticated direct ballot update denied')
            for role in ['anon','authenticated']:
                visible=value(f'begin; grant usage on schema private to {role}; grant select on private.harne_vote_request_ledger to {role}; set local role {role}; select count(*) from private.harne_vote_request_ledger; rollback;')
                ok(visible=='0',role+' ledger RLS denies rows even with fixture-only SELECT grant')
            newer=call(vote(c,option=c[2][1]));old=call(expression)
            ok(old['receipt']==first['receipt'] and int(value(f'select option_id from public.harne_vote_ballots where id={newer["receipt"]["ballotId"]};'))==c[2][1],'old replay does not overwrite newer ballot')
            sql(f"update private.harne_vote_request_ledger set created_at=s.t-interval '25 hours',expires_at=s.t-interval '1 hour' from (select clock_timestamp() as t) s where request_key={lit(key)};")
            expired=call(expression)
            ok(expired['response_code']==410 and count('private.harne_vote_request_ledger',f'request_key={lit(key)}')==1,'expired key retains occupancy and returns 410')
            rollback_key='fixture-rollback-'+uuid.uuid4().hex
            sql(f"create function private.fixture_abort_ledger() returns trigger language plpgsql as $$begin if new.request_key={lit(rollback_key)} then raise exception 'fixture ledger insert failure'; end if; return new; end$$; create trigger fixture_abort before insert on private.harne_vote_request_ledger for each row execute function private.fixture_abort_ledger();")
            denied=sql('set role service_role; select '+vote(c,key=rollback_key)+';',True)
            ok(denied.returncode!=0 and 'fixture ledger insert failure' in denied.stderr and count('private.harne_vote_request_ledger',f'request_key={lit(rollback_key)}')==0 and int(value(f'select option_id from public.harne_vote_ballots where id={newer["receipt"]["ballotId"]};'))==c[2][1],'ledger failure rolls back earlier ballot mutation')
            sql('drop trigger fixture_abort on private.harne_vote_request_ledger; drop function private.fixture_abort_ledger();')
            c=catalog();same=vote(c,key='concurrent-same-key')
            a,b=hold_and_overlap('set local role service_role; select '+same,'set role service_role; select '+same,'same key concurrency')
            ok(last_json(a)['kind']=='completed' and last_json(b)['kind']=='cached' and last_json(a)['receipt']==last_json(b)['receipt'] and count('public.harne_vote_ballots',f'question_id={c[1]}')==1,'same-key concurrency creates one ballot and one immutable receipt')
            c=catalog();a,b=hold_and_overlap('set local role service_role; select '+vote(c,key='concurrent-conflict'),'set role service_role; select '+vote(c,key='concurrent-conflict',option=c[2][1]),'conflicting concurrency')
            ok(last_json(b)['kind']=='conflict','concurrent changed payload cannot overwrite first ballot')
            c=catalog();r,q,o=c;closed=catalog('closed')
            a,b=hold_and_overlap(f'update public.harne_vote_questions set round_id={closed[0]} where id={q}','set role service_role; select '+vote(c),'question relation move')
            ok(last_json(b)['code']=='closed' and count('public.harne_vote_ballots',f'question_id={q}')==0,'question move to closed round rechecked after wait')
            c=catalog();other=catalog();r,q,o=c
            a,b=hold_and_overlap(f'update public.harne_vote_options set question_id={other[1]} where id={o[0]}','set role service_role; select '+vote(c),'option relation move')
            ok(last_json(b)['code']=='invalid' and count('public.harne_vote_ballots',f'question_id={q}')==0,'option parent rechecked after wait')
            c=catalog();r,q,o=c
            a,b=hold_and_overlap(f"update public.harne_vote_rounds set status='closed' where id={r}",'set role service_role; select '+vote(c),'round closure')
            ok(last_json(b)['code']=='closed','round status rechecked after wait')
            c=catalog();r,q,o=c
            sql(f"update public.harne_vote_rounds set closes_at=clock_timestamp()+interval '1 second' where id={r};")
            a,b=hold_and_overlap(f'select id from public.harne_vote_options where id={o[0]} for update','set role service_role; select '+vote(c),'wall clock after final option lock',lambda:value(f'select clock_timestamp()>closes_at from public.harne_vote_rounds where id={r};')=='t')
            ok(last_json(b)['code']=='closed' and count('public.harne_vote_ballots',f'question_id={q}')==0,'option-lock wait past close rejects vote using fresh wall clock')
            for table,col,position in [('harne_vote_questions','prompt',1),('harne_vote_rounds','status',0),('harne_vote_options','label',2)]:
                c=catalog();target=c[position][0] if position==2 else c[position]
                val='open' if col=='status' else 'fixture edit'
                a,b=hold_and_overlap('set local role service_role; select '+vote(c),f'update public.{table} set {col}={lit(val)} where id={target} returning id',table+' reverse write exclusion')
                ok(last_json(a)['kind']=='completed' and str(target) in b.splitlines(),table+' write commits only after admitted vote releases its row lock')
            c=catalog();key='delete-no-chat-reference';receipt=call(vote(c,key=key))['receipt'];ballot=receipt['ballotId']
            sql(f'delete from public.harne_vote_ballots where id={ballot};')
            ok(call(vote(c,key=key))['receipt']==receipt,'ledger adds no ballot deletion FK and deleted-ballot replay stays immutable')
            c=catalog();receipt=call(vote(c))['receipt'];ballot=receipt['ballotId']
            sql(f"insert into public.harne_chat_threads(user_id,member_code,unlock_ballot_id) values({lit(USERS[0])}::uuid,'M01',{ballot});")
            denied=sql(f'delete from public.harne_vote_ballots where id={ballot};',True)
            ok(denied.returncode!=0 and 'foreign key' in denied.stderr,'existing chat unlock ballot FK still restricts deletion')
            report['status']='pass'
        except Exception as error:
            report['status']='fail';report['failure']=str(error)
            raise
        finally:
            for peer in peers:
                if peer.poll() is None:peer.terminate();peer.wait(timeout=10)
            control('-m','fast','-w','stop')
            report['test_server_stopped']=True;report['checks_passed']=len(report['checks'])
            if args.report:
                args.report.parent.mkdir(parents=True,exist_ok=True)
                args.report.write_text(json.dumps(report,indent=2)+'\n')
            print(json.dumps(report,indent=2))

if __name__=='__main__':main()
