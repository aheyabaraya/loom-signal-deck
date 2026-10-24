import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import crypto from "node:crypto";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceMap = JSON.parse(process.env.HARNE_TEST_SOURCE_MAP || "{}");
const tests = [];
const test = (name, run) => tests.push({ name, run });
const clone = (value) => JSON.parse(JSON.stringify(value));
const blockedFetch = () => { throw new Error("Unexpected network call in offline test"); };
function load(relative, mocks = {}, globals = {}) {
  const source = readFileSync(sourceMap[relative] || resolve(root, relative), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports, module: { exports }, Buffer, Request, Response, AbortController, URL,
    setTimeout, clearTimeout, crypto: crypto.webcrypto,
    process: { env: {} }, fetch: blockedFetch,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === "node:crypto") return crypto;
      if (name === "./contracts") return load("lib/harne/contracts.ts");
      if (name === "server-only") return {};
      throw new Error(`Unmocked import ${name}`);
    }, ...globals
  }, { filename: relative });
  return exports;
}
const member = { code: "M01", name: "Fixture", identity: "Synthetic identity", role: "Synthetic role", voteOptions: [] };
const args = () => ({ userId: "11111111-1111-4111-8111-111111111111", member, voteOption: { label: "Choice", dimension: "Cue", signal: "Signal" }, messages: [{ role: "user", content: "hello" }] });
const successful = () => ({ output_text: "A synthetic reply.", usage: { input_tokens: 100, output_tokens: 20 } });
function provider(options = {}) {
  const env = { OPENAI_API_KEY: "synthetic-test-key", ...options.env };
  const calls = [];
  const api = load("lib/harne/openai.ts", {}, { process: { env }, fetch: async (url, init) => {
    calls.push({ url, ...init });
    return new Response(JSON.stringify(options.body ?? successful()), { status: options.status ?? 200 });
  } });
  return { api, env, calls };
}

test("full prepared history and UTF8 affect reservation; preparation has no provider call", () => {
  const { api, calls } = provider();
  const small = api.prepareMemberReply(args());
  const large = api.prepareMemberReply({ ...args(), messages: [{ role: "assistant", content: "가".repeat(800) }, ...args().messages] });
  assert(api.estimateReservedMicrousd(large) > api.estimateReservedMicrousd(small) + 1000);
  assert.equal(small.body.model, "gpt-5.4-nano"); assert.equal(small.body.max_output_tokens, 160); assert.equal(small.body.store, false);
  assert.equal(calls.length, 0);
});
test("configured rates are validated and frozen with prepared body", () => {
  const { api, env } = provider(); const p = api.prepareMemberReply(args());
  env.OPENAI_INPUT_COST_PER_1M = "100";
  assert.equal(api.calculateActualMicrousd(100, 20, p), 165);
  for (const value of ["0", "-1", "NaN", "Infinity"]) {
    env.OPENAI_INPUT_COST_PER_1M = value; assert.throws(() => api.prepareMemberReply(args()));
  }
  env.OPENAI_INPUT_COST_PER_1M = "1e308";
  assert.throws(() => api.estimateReservedMicrousd(api.prepareMemberReply(args())));
});
test("oversized/malformed history is rejected before provider", () => {
  const { api, calls } = provider();
  for (const messages of [Array(11).fill({ role: "user", content: "x" }), [{ role: "system", content: "x" }], [{ role: "user", content: "x".repeat(1001) }]]) {
    assert.throws(() => api.prepareMemberReply({ ...args(), messages }));
  }
  assert.equal(calls.length, 0);
});
for (const body of [{}, { results: [] }, { results: [{}] }, { results: [{ flagged: "false" }] }, { results: [{ flagged: false }, { flagged: false }] }]) {
  test(`moderation fails closed: ${JSON.stringify(body)}`, async () => { await assert.rejects(provider({ body }).api.moderateText("fixture")); });
}
test("valid moderation preserves true and false", async () => {
  for (const flagged of [true, false]) assert.equal(await provider({ body: { results: [{ flagged }] } }).api.moderateText("fixture"), flagged);
});
for (const usage of [undefined, {}, { input_tokens: -1, output_tokens: 2 }, { input_tokens: 1.5, output_tokens: 2 }, { input_tokens: 1, output_tokens: "2" }]) {
  test(`missing/invalid usage is never zero: ${JSON.stringify(usage)}`, async () => {
    const { api } = provider({ body: { output_text: "fixture", usage } }); await assert.rejects(api.generateMemberReply(api.prepareMemberReply(args())));
  });
}
test("provider sends exact prepared body with redirect rejection", async () => {
  const { api, calls } = provider(); const p = api.prepareMemberReply(args());
  assert.deepEqual(clone(await api.generateMemberReply(p)), { reply: "A synthetic reply.", inputTokens: 100, outputTokens: 20 });
  assert.deepEqual(JSON.parse(calls[0].body), clone(p.body)); assert.equal(calls[0].redirect, "error");
});
test("empty output preserves known usage in its error", async () => {
  const { api } = provider({ body: { ...successful(), output_text: "" } });
  await assert.rejects(api.generateMemberReply(api.prepareMemberReply(args())), (e) => e instanceof api.GenerationUsageError && e.inputTokens === 100 && e.outputTokens === 20);
});
test("admin client requires server configuration and rejects credential-bearing redirects", async () => {
  const env = {}; let options; let created = 0; let sent;
  const api = load("lib/harne/admin.ts", { "@supabase/supabase-js": { createClient: (_url, _key, opts) => { created++; options = opts; return {}; } } }, { process: { env }, fetch: async (_input, init) => { sent = init; return new Response("{}"); } });
  assert.equal(api.getHarneAdminClient(), null); assert.equal(created, 0);
  env.NEXT_PUBLIC_SUPABASE_URL = "https://fixture.supabase.co"; env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-server-key";
  api.getHarneAdminClient(); assert.equal(options.auth.persistSession, false); assert.equal(options.auth.autoRefreshToken, false);
  await options.global.fetch("https://fixture.supabase.co/rest/v1/rpc/fixture", {}); assert.equal(sent.redirect, "error");
  env.NEXT_PUBLIC_SUPABASE_URL = "https://user:pass@fixture.supabase.co"; assert.throws(() => api.getHarneAdminClient()); assert.equal(created, 1);
});

const USER = "11111111-1111-4111-8111-111111111111";
const RESERVATION = "22222222-2222-4222-8222-222222222222";
const THREAD = "33333333-3333-4333-8333-333333333333";
const replyBody = () => ({ ok: true, threadId: THREAD, memberCode: "M01", reply: "A synthetic reply.", usage: { inputTokens: 100, outputTokens: 20, actualMicrousd: 165 } });
const errorBody = () => ({ error: { code: "CHAT_MODEL_FAILED", message: "Synthetic failure" } });
function routeFixture(options = {}) {
  const calls = []; let cached; let modCount = 0;
  const p = provider().api;
  const staffConfig = load("lib/harne/config.ts", {}, { process: { env: { HARNE_STAFF_USER_IDS: options.staff } } });
  const admin = { rpc: async (name, params) => {
    calls.push({ name, params });
    if (options.rpc) { const result = await options.rpc(name, params); if (result !== undefined) return result; }
    if (name === "harne_reserve_chat_turn") return { data: options.reserve ?? { kind: "new", reservation_id: RESERVATION, thread_id: THREAD, ballot_id: 1 }, error: null };
    if (name === "harne_start_chat_turn") return { data: options.started ?? true, error: null };
    if (name === "harne_complete_chat_turn") {
      cached = { kind: "completed", response_code: 200, response_body: params.p_response_body };
      if (options.lostComplete) throw new Error("Synthetic lost delivery");
      return { data: cached, error: null };
    }
    if (name === "harne_fail_chat_turn") return { data: cached ?? { kind: params.p_actual_microusd === undefined ? "uncertain" : "failed", response_code: params.p_response_code, response_body: params.p_response_body }, error: null };
    throw new Error("Unexpected or legacy RPC " + name);
  } };
  const next = { NextResponse: { json: (body, init) => Response.json(body, init) } };
  const mocks = {
    "next/server": next,
    "../../../../../data/members": { getMember: () => member, memberByCode: new Map([["M01", member]]) },
    "../../../../../lib/harne/admin": { getHarneAdminClient: () => { calls.push({ name: "admin" }); return options.adminMissing ? null : admin; } },
    "../../../../../lib/harne/config": { getHarneConfig: () => ({ chatMode: "public", supabaseConfigured: true, openAiConfigured: true, ...options.config }), isHarneStaffUser: staffConfig.isHarneStaffUser, isModeEnabled: (mode) => mode !== "off", parseMemberCode: (v) => v === "M01" ? "M01" : null },
    "../../../../../lib/harne/data": { getMemberChatThread: async () => null, getOpenVoteSnapshot: async () => ({ ready: true, questions: [{ id: 1, kind: "member_identity", subjectKey: "M01", selectedOptionId: 1, options: [{ id: 1, label: "Choice", dimension: "Cue", signal: "Signal" }] }] }) },
    "../../../../../lib/harne/http": { errorResponse: (code, message, status) => Response.json({ error: { code, message } }, { status }) },
    "../../../../../lib/harne/idempotency": { readIdempotencyKey: (request) => request.headers.get("Idempotency-Key") },
    "../../../../../lib/harne/server": { getHarneMutationContext: async () => { calls.push({ name: "auth" }); return { user: options.auth === false ? null : { id: USER }, supabase: {} }; } },
    "../../../../../lib/harne/openai": { ...p,
      moderateText: async () => { calls.push({ name: "moderate" }); modCount++; if (options.modError) throw new Error("Synthetic moderation error"); return Boolean(options.rejectOutput && modCount === 2); },
      generateMemberReply: async () => { calls.push({ name: "generate" }); if (options.empty) throw new p.GenerationUsageError("empty", 100, 20); if (options.modelError) throw new Error("Synthetic model failure"); return { reply: "A synthetic reply.", inputTokens: 100, outputTokens: 20 }; }
    }
  };
  const route = load("app/api/harne/chat/messages/route.ts", mocks, { process: { env: { HARNE_STAFF_USER_IDS: options.staff } } });
  return { calls, run: () => route.POST(new Request("http://fixture.invalid/api/harne/chat/messages", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": "fixture-request-key" }, body: JSON.stringify({ memberCode: "M01", text: "hello", userId: "untrusted-browser-user" }) })) };
}
for (const options of [{ auth: false }, { adminMissing: true }, { config: { chatMode: "off" } }, { reserve: { kind: "busy" } }, { started: false }]) {
  test(`no provider before auth/config/reserve/start: ${JSON.stringify(options)}`, async () => {
    const f = routeFixture(options); const response = await f.run(); assert(response.status >= 400); assert(!f.calls.some((c) => c.name === "generate" || c.name === "moderate"));
    if (options.auth === false) assert(!f.calls.some((c) => c.name === "admin"));
    if (options.started === false) assert(!f.calls.some((c) => c.name === "harne_fail_chat_turn"));
  });
}
for (const [staff, expectedStatus] of [[undefined, 403], [" , ", 403], ["other-user", 403], [` , ${USER} , `, 200]]) {
  test(`shared staff predicate preserves chat gate: ${String(staff)}`, async () => {
    const f = routeFixture({ config: { chatMode: "staff" }, staff });
    assert.equal((await f.run()).status, expectedStatus);
    if (expectedStatus !== 200) assert(!f.calls.some((call) => call.name === "generate" || call.name === "admin"));
  });
}
test("route binds trusted user and provider follows start", async () => {
  const f = routeFixture(); const response = await f.run(); assert.equal(response.status, 200); assert.deepEqual(await response.json(), replyBody());
  const names = f.calls.map((c) => c.name); assert(names.indexOf("harne_start_chat_turn") < names.indexOf("generate"));
  assert.equal(f.calls.find((c) => c.name === "harne_reserve_chat_turn").params.p_user_id, USER);
});
test("cached replay has no repeated provider calls", async () => {
  const f = routeFixture({ reserve: { kind: "cached", response_code: 200, response_body: replyBody() } });
  assert.equal((await f.run()).status, 200); assert(!f.calls.some((c) => c.name === "generate" || c.name === "harne_start_chat_turn"));
});
for (const options of [{ modelError: true }, { modError: true }]) {
  test(`unknown failures hold budget without old refund: ${JSON.stringify(options)}`, async () => {
    const f = routeFixture(options); assert.equal((await f.run()).status, 502); const fail = f.calls.find((c) => c.name === "harne_fail_chat_turn"); assert(fail); assert.equal(fail.params.p_actual_microusd, undefined);
  });
}
for (const options of [{ rejectOutput: true }, { empty: true }]) {
  test(`known failed output accounts cost without approved message: ${JSON.stringify(options)}`, async () => {
    const f = routeFixture(options); assert((await f.run()).status >= 400);
    assert(!f.calls.some((c) => c.name === "harne_complete_chat_turn")); assert.equal(f.calls.find((c) => c.name === "harne_fail_chat_turn").params.p_actual_microusd, 165);
  });
}
test("lost completed reply returns immutable completed result", async () => {
  const f = routeFixture({ lostComplete: true }); const response = await f.run(); assert.equal(response.status, 200); assert.deepEqual(await response.json(), replyBody());
});
test("malformed cached success is rejected", async () => {
  const f = routeFixture({ reserve: { kind: "cached", response_code: 200, response_body: {} } }); assert.equal((await f.run()).status, 503); assert(!f.calls.some((c) => c.name === "generate"));
});
test("reserve transport exception has sanitized response and no provider", async () => {
  const f = routeFixture({ rpc: async (name) => { if (name === "harne_reserve_chat_turn") throw new Error("do-not-reflect-test-marker"); } });
  const response = await f.run(); assert.equal(response.status, 503); assert(!(await response.text()).includes("do-not-reflect-test-marker")); assert(!f.calls.some((c) => c.name === "generate"));
});

function clientFixture() {
  const state = { user: "user-a", signoutError: null }; const calls = []; let responder = async () => new Response(JSON.stringify(replyBody()));
  const client = load("lib/harne/client.ts", { "../supabase/client": { createClient: () => ({ auth: { getSession: async () => ({ data: { session: state.user ? { user: { id: state.user } } : null }, error: null }), signOut: async () => { if (!state.signoutError) state.user = null; return { error: state.signoutError }; } } }) } }, {
    fetch: async (url, init) => { calls.push({ url, init }); return responder(url, init); }
  });
  return { client, state, calls, respond(fn) { responder = fn; } };
}
const turn = () => new Promise((done) => setImmediate(done));
test("identical overlapping sends make one POST", async () => {
  const f = clientFixture(); let deliver; f.respond(() => new Promise((done) => { deliver = done; }));
  const first = f.client.sendHarneMessage("M01", "hello", { expectedUserId: f.state.user }); const second = f.client.sendHarneMessage("M01", " hello ", { expectedUserId: f.state.user });
  await turn(); assert.equal(f.calls.length, 1); deliver(new Response(JSON.stringify(replyBody()))); await Promise.all([first, second]);
});
for (const failure of ["network", "malformed", 409, 502]) {
  test(`explicit retry retains key after ${failure}`, async () => {
    const f = clientFixture(); f.respond(async () => { if (failure === "network") throw new Error("synthetic disconnect"); return new Response(failure === "malformed" ? "not-json" : JSON.stringify(errorBody()), { status: typeof failure === "number" ? failure : 200 }); });
    await assert.rejects(f.client.sendHarneMessage("M01", "hello", { expectedUserId: f.state.user })); assert.equal(f.calls.length, 1);
    f.respond(async () => Response.json(replyBody())); await f.client.sendHarneMessage("M01", "hello", { expectedUserId: f.state.user });
    assert.equal(f.calls[0].init.headers["Idempotency-Key"], f.calls[1].init.headers["Idempotency-Key"]);
  });
}
test("failed signout preserves ambiguous request key", async () => {
  const f = clientFixture(); f.respond(async () => { throw new Error("synthetic disconnect"); }); await assert.rejects(f.client.sendHarneMessage("M01", "hello", { expectedUserId: f.state.user }));
  f.state.signoutError = new Error("synthetic signout failure"); await assert.rejects(f.client.signOutHarne());
  f.respond(async () => Response.json(replyBody())); await f.client.sendHarneMessage("M01", "hello", { expectedUserId: f.state.user }); assert.equal(f.calls[0].init.headers["Idempotency-Key"], f.calls[1].init.headers["Idempotency-Key"]);
});
test("changed account cannot consume previous user's pending reply", async () => {
  const f = clientFixture(); let deliver; f.respond(() => new Promise((done) => { deliver = done; }));
  const pending = f.client.sendHarneMessage("M01", "hello", { expectedUserId: f.state.user }); const rejected = assert.rejects(pending, /account changed/); await turn(); f.state.user = "user-b"; deliver(Response.json(replyBody())); await rejected;
  f.respond(async () => Response.json(replyBody())); await f.client.sendHarneMessage("M01", "hello", { expectedUserId: f.state.user }); assert.notEqual(f.calls[0].init.headers["Idempotency-Key"], f.calls[1].init.headers["Idempotency-Key"]);
});
test("bounded retry map never evicts an ambiguous attempt", async () => {
  const f = clientFixture(); f.respond(async () => { throw new Error("synthetic disconnect"); });
  for (let n = 0; n < 32; n++) await assert.rejects(f.client.sendHarneMessage("M01", `message-${n}`, { expectedUserId: f.state.user }));
  await assert.rejects(f.client.sendHarneMessage("M01", "extra", { expectedUserId: f.state.user })); assert.equal(f.calls.length, 32);
  f.respond(async () => Response.json(replyBody())); await f.client.sendHarneMessage("M01", "message-0", { expectedUserId: f.state.user }); assert.equal(f.calls[0].init.headers["Idempotency-Key"], f.calls.at(-1).init.headers["Idempotency-Key"]);
});
let failures = 0;
for (const { name, run } of tests) {
  try { await run(); } catch (error) { failures++; console.error(`FAIL ${name}: ${error.stack}`); }
}
console.log(`Harne chat offline security: ${tests.length - failures}/${tests.length} passed; no live API or DB calls.`);
process.exitCode = failures ? 1 : 0;
