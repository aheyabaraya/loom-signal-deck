import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const WEB=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), mode='canonical';
const ts=createRequire(path.join(WEB,'package.json'))('typescript');
const snapshots=new Map(),sourceRows=[];
for(const relative of ['lib/harne/contracts.ts','lib/harne/client.ts','lib/harne/server.ts','lib/harne/config.ts','lib/harne/idempotency.ts','lib/harne/http.ts','app/api/harne/votes/route.ts','app/api/harne/chat/messages/route.ts','app/api/harne/chat/threads/[memberCode]/route.ts']){
 const sourcePath=path.join(WEB,relative);const source=fs.readFileSync(sourcePath,'utf8');snapshots.set(relative,source);sourceRows.push({relative,sha256:crypto.createHash('sha256').update(source).digest('hex'),bytes:Buffer.byteLength(source)});
}
function load(relative,_mode,mocks={},globals={}){
 const js=ts.transpileModule(snapshots.get(relative),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};vm.runInNewContext(js,{exports,module:{exports},Request,Response,URL,Headers,Buffer,crypto:crypto.webcrypto,process:{env:{}},setTimeout,clearTimeout,fetch:()=>{throw new Error('Unexpected real network');},require(n){if(Object.hasOwn(mocks,n))return mocks[n];if(n==='node:crypto')return crypto;throw new Error('Unmocked import '+n);},...globals});return exports;
}
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002';
const THREAD='00000000-0000-4000-8000-000000000011',RESERVATION='00000000-0000-4000-8000-000000000012';
const snapshot=()=>({round:{id:1,slug:'fixture',resultVisibility:'hidden'},ready:true,questions:[{
 id:1,kind:'member_identity',subjectKey:'M01',prompt:'Fixture',sortOrder:0,selectedOptionId:1,selectedBrief:null,
 options:[{id:1,optionKey:'fixture',label:'Fixture',dimension:'Fixture',detail:'Fixture',signal:'Fixture',sortOrder:0}]}]});
const receipt=()=>({ballotId:1,questionId:1,optionId:1,updatedAt:'2026-09-15T00:00:00Z'});
const next={NextResponse:{json:(body,init)=>Response.json(body,init)}};
function fixture(mode,{switchActor=true,authError=false,aba=false}={}){
 const state={sessionActor:A,cookieActor:A,intentActor:A,reads:[],sessionReads:[],effects:[],events:[],httpStatuses:[],headers:[],epochs:null};
 const rows={[A]:{votes:[],messages:[],thread:true},[B]:{votes:[],messages:[],thread:true}};
 const config={getHarneConfig:()=>({voteMode:'public',chatMode:'public',supabaseConfigured:true,openAiConfigured:true}),
  isModeEnabled:()=>true,isHarneStaffUser:()=>true,parseMemberCode:x=>x==='M01'?x:null};
 const contracts=load('lib/harne/contracts.ts',mode);
 const http=load('lib/harne/http.ts',mode,{'next/server':next});
 const idem=load('lib/harne/idempotency.ts',mode);
 const record=(kind,actor,detail={})=>{state.effects.push({kind,actor,...detail});state.events.push(kind+':'+actor);};
 const userClient=actor=>({actor,auth:{getUser:async()=>{state.events.push('server_verified:'+actor);return {data:{user:{id:actor}},error:authError?new Error('Synthetic auth failure'):null};}},
  rpc:async(name,args)=>{assert.equal(name,'harne_submit_vote');record('vote',actor,{optionId:args.p_option_id});rows[actor].votes.push(args.p_option_id);return {data:[{ballot_id:1,question_id:args.p_question_id,option_id:args.p_option_id,updated_at:receipt().updatedAt}],error:null};},
  from(table){assert.equal(table,'harne_chat_threads');const filters={};return {delete(){return this;},eq(k,v){filters[k]=v;return this;},then(resolve,reject){assert.equal(filters.user_id,actor);record('clear',actor,{memberCode:filters.member_code});rows[actor].thread=false;return Promise.resolve({error:null}).then(resolve,reject);}}}});
 const server=load('lib/harne/server.ts',mode,{'./contracts':contracts,'../supabase/env':{isSupabaseConfigured:()=>true},'../supabase/server':{createClient:async()=>userClient(state.cookieActor)}});

 const admin={rpc:async(name,args)=>{
  if(name==='harne_submit_vote_request'){record('vote',args.p_user_id,{optionId:args.p_option_id});rows[args.p_user_id].votes.push(args.p_option_id);return {data:{kind:'completed',response_code:200,receipt:receipt()},error:null};}
  if(name==='harne_reserve_chat_turn'){record('reserve',args.p_user_id);return {data:{kind:'new',reservation_id:RESERVATION,thread_id:THREAD},error:null};}
  if(name==='harne_start_chat_turn'){record('start',args.p_user_id);return {data:true,error:null};}
  if(name==='harne_complete_chat_turn'){record('chat',args.p_user_id,{text:args.p_user_content});rows[args.p_user_id].messages.push(args.p_user_content);return {data:{kind:'completed',response_code:200,response_body:args.p_response_body},error:null};}
  throw new Error('unexpected RPC '+name);
 }};
 const common={'next/server':next};
 const vote=load('app/api/harne/votes/route.ts',mode,{...common,
  '../../../../lib/harne/config':config,'../../../../lib/harne/http':http,
  '../../../../lib/harne/server':server,'../../../../lib/harne/admin':{getHarneAdminClient:()=>admin},
  '../../../../lib/harne/data':{getOpenVoteSnapshot:async(c,user)=>{assert.equal(c.actor,user);state.reads.push({kind:'snapshot',actor:user});return snapshot();}},
  '../../../../lib/harne/idempotency':{...idem,beginIdempotency:async(_c,actor)=>{state.events.push('legacy_idempotency:'+actor);return {kind:'new'};},completeIdempotency:async()=>{}},
 });
 const member={code:'M01',name:'Fixture',identity:'Synthetic',role:'Synthetic',voteOptions:[]};
 const chat=load('app/api/harne/chat/messages/route.ts',mode,{...common,
  '../../../../../data/members':{memberByCode:new Map([['M01',member]]),getMember:()=>member},
  '../../../../../lib/harne/admin':{getHarneAdminClient:()=>admin},'../../../../../lib/harne/config':config,
  '../../../../../lib/harne/data':{getOpenVoteSnapshot:async()=>snapshot(),getMemberChatThread:async()=>({messages:[]})},
  '../../../../../lib/harne/http':http,'../../../../../lib/harne/idempotency':idem,'../../../../../lib/harne/server':server,
  '../../../../../lib/harne/openai':{prepareMemberReply:args=>args,estimateReservedMicrousd:()=>1,calculateActualMicrousd:()=>1,
   moderateText:async()=>false,generateMemberReply:async prepared=>{record('generate_stub',prepared.userId);return {reply:'Synthetic reply.',inputTokens:1,outputTokens:1};},GenerationUsageError:class extends Error{}},
 });
 const clear=load('app/api/harne/chat/threads/[memberCode]/route.ts',mode,{...common,
  '../../../../../../lib/harne/config':config,'../../../../../../lib/harne/http':http,
  '../../../../../../lib/harne/data':{getMemberChatThread:async(c,user,member)=>{assert.equal(c.actor,user);state.reads.push({kind:'thread',actor:user});return {id:THREAD,memberCode:member,messages:[]};}},'../../../../../../lib/harne/server':server,
 });
 const client=load('lib/harne/client.ts',mode,{'./contracts':contracts,'../supabase/client':{createClient:()=>({auth:{getSession:async()=>{
  const actor=state.sessionActor;state.sessionReads.push(actor);state.events.push('client_session:'+actor);
  return {data:{session:{user:{id:actor}}},error:null};}}})}},
 {fetch:async(url,init)=>{
  // This is a deterministic fake browser dispatch, not a real Cookie/network operation.
  if(switchActor){state.cookieActor=B;state.sessionActor=B;if(state.epochs)state.epochs.current+=1;}
  const headers=new Headers(init?.headers);
  state.headers.push(Object.fromEntries(headers));state.events.push('dispatch_cookie_actor:'+state.cookieActor);
  const req=new Request('http://fixture.invalid'+url,{...init,headers});
  const response=url==='/api/harne/votes'?(init?.method==='PUT'?await vote.PUT(req):await vote.GET(req)):url==='/api/harne/chat/messages'?await chat.POST(req):init?.method==='DELETE'?await clear.DELETE(req,{params:Promise.resolve({memberCode:'M01'})}):await clear.GET(req,{params:Promise.resolve({memberCode:'M01'})});
  state.httpStatuses.push(response.status);if(aba)state.sessionActor=A;return response;
 }});
 return {state,rows,client,raw:async(operation,headers={})=>{
  const read=operation==='snapshot'||operation==='thread';const url=operation==='vote'||operation==='snapshot'?'/api/harne/votes':operation==='chat'?'/api/harne/chat/messages':'/api/harne/chat/threads/M01';
  const method=read?'GET':operation==='vote'?'PUT':operation==='chat'?'POST':'DELETE';const body=operation==='vote'?{questionId:1,optionId:1}:operation==='chat'?{memberCode:'M01',text:'synthetic'}:null;
  const req=new Request('http://fixture.invalid'+url,{method,headers:{'Content-Type':'application/json','Idempotency-Key':'synthetic-raw-key',...headers},...(body?{body:JSON.stringify(body)}:{})});
  const response=operation==='vote'?await vote.PUT(req):operation==='chat'?await chat.POST(req):operation==='clear'?await clear.DELETE(req,{params:Promise.resolve({memberCode:'M01'})}):operation==='snapshot'?await vote.GET(req):await clear.GET(req,{params:Promise.resolve({memberCode:'M01'})});state.httpStatuses.push(response.status);return response;
 }};
}

const results=[];async function test(name,run){try{await run();results.push({name,status:'pass'});}catch(e){results.push({name,status:'fail',error:e.stack});}}
const invoke=(f,op,expectedUserId)=>op==='vote'?f.client.submitHarneVote({questionId:1,optionId:1},{expectedUserId}):op==='chat'?f.client.sendHarneMessage('M01','Fixture',{expectedUserId}):op==='clear'?f.client.clearHarneThread('M01',{expectedUserId}):op==='snapshot'?f.client.getHarneSnapshot({expectedUserId}):f.client.getHarneThread('M01',{expectedUserId});
for(const op of ['vote','chat','clear','snapshot','thread']){
 const read=['snapshot','thread'].includes(op);
 await test(op+' normal A/A',async()=>{const f=fixture(mode,{switchActor:false});await invoke(f,op,A);assert.equal(f.state.httpStatuses[0],200);assert.equal(f.state.headers[0]['x-harne-expected-user'],A);assert.equal(f.state.events.filter(x=>x.startsWith('server_verified:')).length,1);if(read)assert(f.state.reads.some(r=>r.actor===A));else assert(f.state.effects.some(r=>r.kind===op&&r.actor===A));});
 await test(op+' A intent/B cookie stops before effects or data',async()=>{const f=fixture(mode);await assert.rejects(invoke(f,op,A),e=>e.status===401);assert.equal(f.state.httpStatuses[0],401);assert.equal(f.state.headers.length,1);assert.equal(f.state.headers[0]['x-harne-expected-user'],A);assert.equal(f.state.effects.length,0);assert.equal(f.state.reads.length,0);});
 await test(op+' A->cookie B->SDK A ABA still rejects',async()=>{const f=fixture(mode,{aba:true});await assert.rejects(invoke(f,op,A),e=>e.status===401);assert.equal(f.state.sessionActor,A);assert.equal(f.state.httpStatuses[0],401);assert.equal(f.state.effects.length,0);assert.equal(f.state.reads.length,0);});
 await test(op+' UI A/client B cannot rebind',async()=>{const f=fixture(mode,{switchActor:false});f.state.sessionActor=B;f.state.cookieActor=B;await assert.rejects(invoke(f,op,A),e=>e.status===401);assert.equal(f.state.headers.length,0);assert.equal(f.state.effects.length,0);});
 await test(op+' null intent never dispatches',async()=>{const f=fixture(mode,{switchActor:false});await assert.rejects(invoke(f,op,null),e=>e.status===401);assert.equal(f.state.headers.length,0);});
 for(const [name,hint] of [['forged',B],['invalid','not-a-uuid'],['empty','']])await test(op+' raw '+name+' hint denied',async()=>{const f=fixture(mode,{switchActor:false});assert.equal((await f.raw(op,{'X-Harne-Expected-User':hint})).status,401);assert.equal(f.state.effects.length,0);assert.equal(f.state.reads.length,0);});
 await test(op+' auth error cannot authorize matching hint',async()=>{const f=fixture(mode,{switchActor:false,authError:true});assert.equal((await f.raw(op,{'X-Harne-Expected-User':A})).status,401);assert.equal(f.state.effects.length,0);assert.equal(f.state.reads.length,0);});
 await test(op+' raw hint omission '+(read?'keeps legacy read':'denies mutation'),async()=>{const f=fixture(mode,{switchActor:false});const r=await f.raw(op);assert.equal(r.status,read?200:401);assert.equal(f.state.effects.length,0);if(read)assert(f.state.reads.some(x=>x.actor===A));});
 await test(op+' explicit B intent works after rejected A without key reuse',async()=>{const f=fixture(mode);await assert.rejects(invoke(f,op,A),e=>e.status===401);assert.equal(f.state.headers.length,1);await invoke(f,op,B);assert.equal(f.state.headers.length,2);assert.equal(f.state.headers[1]['x-harne-expected-user'],B);if(op==='vote'||op==='chat')assert.notEqual(f.state.headers[0]['idempotency-key'],f.state.headers[1]['idempotency-key']);});
}
const report={mode,status:results.every(r=>r.status==='pass')?'pass':'fail',checks:results.length,passed:results.filter(r=>r.status==='pass').length,source_hashes:sourceRows,header_injected:false,source_transformed:false,real_network:false,real_database:false,real_cookies:false,results};console.log(JSON.stringify(process.argv.includes('--json')?report:{status:report.status,passed:report.passed,checks:report.checks,failures:results.filter(r=>r.status!=='pass')},null,2));if(report.status!=='pass')process.exitCode=1;
