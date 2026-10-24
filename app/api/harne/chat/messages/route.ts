import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getMember, memberByCode, type MemberCode } from "../../../../../data/members";
import { getHarneAdminClient } from "../../../../../lib/harne/admin";
import { getHarneConfig, isHarneStaffUser, isModeEnabled, parseMemberCode } from "../../../../../lib/harne/config";
import { getMemberChatThread, getOpenVoteSnapshot } from "../../../../../lib/harne/data";
import { errorResponse } from "../../../../../lib/harne/http";
import { readIdempotencyKey } from "../../../../../lib/harne/idempotency";
import {
  calculateActualMicrousd,
  estimateReservedMicrousd,
  generateMemberReply,
  GenerationUsageError,
  moderateText,
  prepareMemberReply
} from "../../../../../lib/harne/openai";
import { getHarneMutationContext } from "../../../../../lib/harne/server";

export const runtime = "nodejs";

const maxInputCharacters = 240;
const maxPreviousMessages = 9;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Usage = { inputTokens: number; outputTokens: number; actualMicrousd: number };
type Cached = { status: number; body: Record<string, unknown> };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function asBoundedInt(value: unknown, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
}

function readCached(value: unknown): Cached | null {
  if (!isObject(value) || !["cached", "completed", "released", "uncertain", "failed"].includes(String(value.kind))) return null;
  const status = value.response_code;
  const body = value.response_body;
  if (typeof status !== "number" || !Number.isInteger(status) || !isObject(body) ||
      Buffer.byteLength(JSON.stringify(body), "utf8") > 65536) return null;
  if (status === 200) {
    if (!["cached", "completed"].includes(String(value.kind)) || body.ok !== true || !isUuid(body.threadId) ||
        !parseMemberCode(body.memberCode) || typeof body.reply !== "string" || !body.reply || body.reply.length > 1000 ||
        !isObject(body.usage) || asBoundedInt(body.usage.inputTokens, 1_000_000) === null ||
        asBoundedInt(body.usage.outputTokens, 1_000_000) === null ||
        asBoundedInt(body.usage.actualMicrousd, 1_000_000_000) === null) return null;
  } else if (status < 400 || status > 599 || !isObject(body.error) ||
             typeof body.error.code !== "string" || typeof body.error.message !== "string") return null;
  return { status, body };
}

function mapQuotaCode(code: string) {
  if (code === "CHAT_VOTE_REQUIRED") return errorResponse("CHAT_VOTE_REQUIRED", "Vote for this member before starting chat.", 403);
  if (code === "CHAT_MEMBER_DAILY_LIMIT") return errorResponse("CHAT_MEMBER_DAILY_LIMIT", "This member's daily chat limit is reached.", 429);
  if (code === "CHAT_USER_DAILY_LIMIT") return errorResponse("CHAT_USER_DAILY_LIMIT", "Your daily chat limit is reached.", 429);
  if (code === "CHAT_GLOBAL_BUDGET_EXHAUSTED") return errorResponse("CHAT_GLOBAL_BUDGET_EXHAUSTED", "The demo chat budget is exhausted for today.", 429);
  return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Chat quota could not be reserved.", 503);
}

function parseReserve(value: unknown) {
  if (!isObject(value) || typeof value.kind !== "string") return null;
  if (value.kind === "new") {
    if (!isUuid(value.reservation_id) || !isUuid(value.thread_id)) return null;
    return { kind: "new" as const, reservationId: value.reservation_id, threadId: value.thread_id };
  }
  if (value.kind === "cached") {
    const cached = readCached(value);
    return cached ? { kind: "cached" as const, cached } : null;
  }
  if (value.kind === "conflict") return { kind: "conflict" as const };
  if (value.kind === "busy") return { kind: "busy" as const };
  if (value.kind === "denied" && typeof value.code === "string") return { kind: "denied" as const, code: value.code };
  return null;
}

function sendCached(cached: Cached | null) {
  return cached
    ? NextResponse.json(cached.body, { status: cached.status })
    : errorResponse("CHAT_MODEL_FAILED", "The member response could not be completed.", 502);
}

async function failChatTurn(
  admin: any,
  userId: string,
  reservationId: string,
  responseCode: number,
  responseBody: Record<string, unknown>,
  usage?: Usage
) {
  try {
    const { data, error } = await admin.rpc("harne_fail_chat_turn", {
      p_user_id: userId,
      p_reservation_id: reservationId,
      p_response_code: responseCode,
      p_response_body: responseBody,
      ...(usage
        ? {
            p_input_tokens: usage.inputTokens,
            p_output_tokens: usage.outputTokens,
            p_actual_microusd: usage.actualMicrousd
          }
        : {})
    });
    return error ? null : readCached(data);
  } catch {
    return null;
  }
}

async function rejectedByModeration(text: string) {
  const flagged = await moderateText(text);
  if (typeof flagged !== "boolean") throw new Error("moderation");
  return flagged;
}

export async function POST(request: Request) {
  const config = getHarneConfig();
  if (!isModeEnabled(config.chatMode, "chat")) {
    return errorResponse("HARNE_FEATURE_DISABLED", "Member chat is not enabled yet.", 403);
  }
  if (config.chatMode === "staff" && !process.env.HARNE_STAFF_USER_IDS) {
    return errorResponse("HARNE_FEATURE_DISABLED", "Staff chat allowlist is not configured.", 403);
  }

  const idempotencyKey = readIdempotencyKey(request);
  if (!idempotencyKey) return errorResponse("HARNE_INVALID_INPUT", "Idempotency-Key is required.", 400);

  const { user, supabase } = await getHarneMutationContext(request);
  if (!supabase || !config.supabaseConfigured) {
    return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  }
  if (!user) return errorResponse("HARNE_AUTH_REQUIRED", "Sign in before chatting.", 401);
  if (config.chatMode === "staff" && !isHarneStaffUser(user.id)) {
    return errorResponse("HARNE_FEATURE_DISABLED", "This chat demo is currently staff-only.", 403);
  }
  let admin;
  try { admin = getHarneAdminClient(); } catch { admin = null; }
  if (!admin) return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  if (!config.openAiConfigured) {
    return errorResponse("HARNE_NOT_CONFIGURED", "OpenAI is not configured for this demo.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("HARNE_INVALID_INPUT", "Invalid request body.", 400);
  }
  if (!body || typeof body !== "object") return errorResponse("HARNE_INVALID_INPUT", "Invalid request body.", 400);

  const memberCode = parseMemberCode("memberCode" in body ? body.memberCode : null);
  const text = "text" in body && typeof body.text === "string" ? body.text.trim() : "";
  if (!memberCode || !memberByCode.has(memberCode as MemberCode) || !text || text.length > maxInputCharacters) {
    return errorResponse("HARNE_INVALID_INPUT", "Member code or message is invalid.", 400);
  }

  let snapshot;
  let thread;
  try {
    [snapshot, thread] = await Promise.all([
      getOpenVoteSnapshot(supabase, user.id),
      getMemberChatThread(supabase, user.id, memberCode)
    ]);
  } catch {
    return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Chat quota could not be reserved.", 503);
  }

  const question = snapshot.questions.find(
    (entry) => entry.kind === "member_identity" && entry.subjectKey === memberCode
  );
  const option = question?.options.find((entry) => entry.id === question.selectedOptionId);
  if (!question || question.selectedOptionId == null || !option || !Number.isInteger(question.id) || !Number.isInteger(option.id)) {
    return errorResponse("CHAT_VOTE_REQUIRED", "Vote for this member before starting chat.", 403);
  }

  const member = getMember(memberCode as MemberCode);
  let prepared;
  let reservedMicrousd;
  try {
    prepared = prepareMemberReply({
      userId: user.id,
      member: { code: member.code, name: member.name, identity: member.identity, role: member.role },
      voteOption: {
        label: option.label,
        dimension: option.dimension,
        signal: option.signal || member.voteOptions.find((entry) => entry.id === option.optionKey)?.signal || ""
      },
      messages: [
        ...(thread?.messages ?? []).slice(-maxPreviousMessages).map((message: { role: "user" | "assistant"; content: string }) => ({
          role: message.role,
          content: message.content
        })),
        { role: "user" as const, content: text }
      ]
    });
    reservedMicrousd = estimateReservedMicrousd(prepared);
  } catch {
    return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Chat quota could not be reserved.", 503);
  }
  if (!Number.isInteger(reservedMicrousd) || reservedMicrousd < 1 || reservedMicrousd > 100000) {
    return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Chat quota could not be reserved.", 503);
  }

  const requestSha256 = createHash("sha256").update(JSON.stringify({ memberCode, text })).digest("hex");
  let reserved: unknown;
  let reserveError: unknown;
  try {
    const response = await admin.rpc("harne_reserve_chat_turn", {
    p_user_id: user.id,
    p_member_code: memberCode,
    p_request_key: idempotencyKey,
    p_request_sha256: requestSha256,
    p_reserved_microusd: reservedMicrousd,
    p_question_id: question.id,
      p_option_id: option.id
    });
    reserved = response.data;
    reserveError = response.error;
  } catch {
    return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Chat quota could not be reserved.", 503);
  }
  const reserve = parseReserve(reserved);
  if (reserveError || !reserve) {
    return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Chat quota could not be reserved.", 503);
  }
  if (reserve.kind === "cached") return NextResponse.json(reserve.cached.body, { status: reserve.cached.status });
  if (reserve.kind === "conflict" || reserve.kind === "busy") {
    return errorResponse("HARNE_IDEMPOTENCY_CONFLICT", "This chat request is already being processed.", 409);
  }
  if (reserve.kind === "denied") return mapQuotaCode(reserve.code);

  const reservationId = reserve.reservationId;
  const threadId = reserve.threadId;
  let usage: Usage | undefined;

  try {
    const { data: started, error: startError } = await admin.rpc("harne_start_chat_turn", {
      p_user_id: user.id,
      p_reservation_id: reservationId
    });
    if (started === false && !startError) {
      return errorResponse("HARNE_IDEMPOTENCY_CONFLICT", "This chat request is already being processed.", 409);
    }
    if (startError || started !== true) throw new Error("start");

    if (await rejectedByModeration(text)) {
      const rejected = errorResponse("CHAT_MODERATION_REJECTED", "This message cannot be sent in the demo chat.", 422);
      return sendCached(await failChatTurn(admin, user.id, reservationId, rejected.status, await rejected.json()));
    }

    const generated = await generateMemberReply(prepared);
    const inputTokens = asBoundedInt(generated.inputTokens, 1_000_000);
    const outputTokens = asBoundedInt(generated.outputTokens, 1_000_000);
    if (typeof generated.reply !== "string" || inputTokens === null || outputTokens === null) throw new Error("usage");
    const actualMicrousd = calculateActualMicrousd(inputTokens, outputTokens, prepared);
    if (!Number.isSafeInteger(actualMicrousd) || actualMicrousd < 0 || actualMicrousd > 1_000_000_000) throw new Error("usage");
    usage = { inputTokens, outputTokens, actualMicrousd };
    if (!generated.reply || generated.reply.length > 1000) throw new Error("reply");

    if (await rejectedByModeration(generated.reply)) {
      const rejected = errorResponse("CHAT_MODERATION_REJECTED", "The generated response was withheld by moderation.", 422);
      return sendCached(await failChatTurn(admin, user.id, reservationId, rejected.status, await rejected.json(), usage));
    }

    const responseBody = {
      ok: true,
      threadId,
      memberCode,
      reply: generated.reply,
      usage: { inputTokens, outputTokens, actualMicrousd }
    };
    const { data: completed, error: completeError } = await admin.rpc("harne_complete_chat_turn", {
      p_user_id: user.id,
      p_reservation_id: reservationId,
      p_user_content: text,
      p_assistant_content: generated.reply,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_actual_microusd: actualMicrousd,
      p_response_body: responseBody
    });
    const cached = readCached(completed);
    if (completeError || !cached) throw new Error("complete");
    return NextResponse.json(cached.body, { status: cached.status });
  } catch (error) {
    if (error instanceof GenerationUsageError &&
        asBoundedInt(error.inputTokens, 1_000_000) !== null && asBoundedInt(error.outputTokens, 1_000_000) !== null) {
      try {
        const actualMicrousd = calculateActualMicrousd(error.inputTokens, error.outputTokens, prepared);
        if (asBoundedInt(actualMicrousd, 1_000_000_000) !== null) {
          usage = { inputTokens: error.inputTokens, outputTokens: error.outputTokens, actualMicrousd };
        }
      } catch { /* Unknown cost keeps its existing reservation. */ }
    }
    return sendCached(
      await failChatTurn(admin, user.id, reservationId, 502, {
        error: { code: "CHAT_MODEL_FAILED", message: "The member response could not be completed." }
      }, usage)
    );
  }
}
