import { NextResponse } from "next/server";
import { getHarneAdminClient } from "../../../../lib/harne/admin";
import { getHarneConfig, isHarneStaffUser, isModeEnabled } from "../../../../lib/harne/config";
import { getOpenVoteSnapshot } from "../../../../lib/harne/data";
import { errorResponse } from "../../../../lib/harne/http";
import { readIdempotencyKey } from "../../../../lib/harne/idempotency";
import { getHarneMutationContext, getHarneReadContext } from "../../../../lib/harne/server";

export const runtime = "nodejs";

type VoteRpcKind = "completed" | "cached" | "conflict" | "denied";

type VoteReceipt = {
  ballotId: number;
  questionId: number;
  optionId: number;
  updatedAt: string;
};

type VoteRpcResult = {
  kind: VoteRpcKind;
  response_code: number;
  code?: string;
  receipt?: unknown;
};

function isSafePositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isSafeInteger(value) && value > 0;
}

function asSafePositiveInteger(value: unknown) {
  if (isSafePositiveInteger(value)) {
    return value;
  }
  if (typeof value === "string" && /^[1-9][0-9]*$/.test(value)) {
    const parsed = Number(value);
    return isSafePositiveInteger(parsed) ? parsed : null;
  }
  return null;
}

function isValidUpdatedAt(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function unavailable(message = "Vote persistence is temporarily unavailable.") {
  return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", message, 503);
}

function readVoteWriteBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false as const };
  }

  const record = body as Record<string, unknown>;
  if (!isSafePositiveInteger(record.questionId) || !isSafePositiveInteger(record.optionId)) {
    return { ok: false as const };
  }

  if ("brief" in record && record.brief !== null && record.brief !== undefined) {
    if (typeof record.brief !== "string") {
      return { ok: false as const };
    }
    const brief = record.brief.trim();
    if (brief.length > 240) {
      return { ok: false as const, briefTooLong: true as const };
    }
    return {
      ok: true as const,
      questionId: record.questionId,
      optionId: record.optionId,
      brief
    };
  }

  return {
    ok: true as const,
    questionId: record.questionId,
    optionId: record.optionId,
    brief: null
  };
}

function readVoteRpcResult(data: unknown): VoteRpcResult | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (
    record.kind !== "completed" &&
    record.kind !== "cached" &&
    record.kind !== "conflict" &&
    record.kind !== "denied"
  ) {
    return null;
  }
  if (typeof record.response_code !== "number" || !Number.isInteger(record.response_code)) {
    return null;
  }

  return {
    kind: record.kind,
    response_code: record.response_code,
    code: typeof record.code === "string" ? record.code : undefined,
    receipt: record.receipt
  };
}

function readImmutableReceipt(receipt: unknown, questionId: number, optionId: number): VoteReceipt | null {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return null;
  }

  const record = receipt as Record<string, unknown>;
  const ballotId = asSafePositiveInteger(record.ballotId);
  const receiptQuestionId = asSafePositiveInteger(record.questionId);
  const receiptOptionId = asSafePositiveInteger(record.optionId);

  if (
    ballotId === null ||
    receiptQuestionId !== questionId ||
    receiptOptionId !== optionId ||
    !isValidUpdatedAt(record.updatedAt)
  ) {
    return null;
  }

  return {
    ballotId,
    questionId: receiptQuestionId,
    optionId: receiptOptionId,
    updatedAt: record.updatedAt
  };
}

function deniedVoteResponse(code: string | undefined, responseCode: number) {
  if (responseCode === 422 || code === "invalid" || code === "missing") {
    return errorResponse("HARNE_INVALID_INPUT", "Question, option, and brief values are invalid.", 400);
  }
  if (code === "HARNE_IDEMPOTENCY_CONFLICT" || responseCode === 409) {
    return errorResponse("HARNE_IDEMPOTENCY_CONFLICT", "This vote request is already being processed.", 409);
  }
  if (
    code === "HARNE_EXPIRED" ||
    code === "HARNE_IDEMPOTENCY_EXPIRED" ||
    code === "HARNE_QUESTION_EXPIRED" ||
    code === "HARNE_ROUND_EXPIRED" ||
    responseCode === 410
  ) {
    return errorResponse("HARNE_EXPIRED", "This vote request has expired.", 410);
  }
  if (code === "HARNE_QUESTION_CLOSED" || code === "HARNE_ROUND_CLOSED") {
    return errorResponse("HARNE_QUESTION_CLOSED", "This vote round is closed.", 403);
  }
  if (code === "HARNE_OPTION_INVALID") {
    return errorResponse("HARNE_OPTION_INVALID", "That option does not belong to this question.", 400);
  }
  if (code === "HARNE_BRIEF_TOO_LONG") {
    return errorResponse("HARNE_BRIEF_TOO_LONG", "The track cue is limited to 240 characters.", 400);
  }
  if (code === "HARNE_AUTH_REQUIRED" || responseCode === 401) {
    return errorResponse("HARNE_AUTH_REQUIRED", "Sign in before voting.", 401);
  }
  if (code === "HARNE_INVALID_INPUT" || responseCode === 400) {
    return errorResponse("HARNE_INVALID_INPUT", "Question, option, and brief values are invalid.", 400);
  }
  if (code === "HARNE_FEATURE_DISABLED") {
    return errorResponse("HARNE_FEATURE_DISABLED", "Voting is not enabled yet.", 403);
  }
  if (code === "HARNE_NOT_CONFIGURED") {
    return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  }
  if (responseCode === 403) {
    return errorResponse("HARNE_QUESTION_CLOSED", "This vote round is closed.", 403);
  }
  return unavailable();
}

export async function GET(request: Request) {
  const config = getHarneConfig();
  const { user, supabase } = await getHarneReadContext(request);

  if (!supabase || !config.supabaseConfigured) {
    return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  }

  if (!user) {
    return errorResponse("HARNE_AUTH_REQUIRED", "Sign in before loading votes.", 401);
  }

  try {
    const snapshot = await getOpenVoteSnapshot(supabase, user.id);
    return NextResponse.json({ ...snapshot, featureMode: config.voteMode });
  } catch {
    return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Vote data could not be loaded.", 503);
  }
}

export async function PUT(request: Request) {
  const config = getHarneConfig();
  if (!isModeEnabled(config.voteMode, "member_identity")) {
    return errorResponse("HARNE_FEATURE_DISABLED", "Voting is not enabled yet.", 403);
  }

  const idempotencyKey = readIdempotencyKey(request);
  if (!idempotencyKey) {
    return errorResponse("HARNE_INVALID_INPUT", "Idempotency-Key is required.", 400);
  }

  const { user, supabase } = await getHarneMutationContext(request);
  if (!supabase || !config.supabaseConfigured) {
    return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  }
  if (!user) {
    return errorResponse("HARNE_AUTH_REQUIRED", "Sign in before voting.", 401);
  }
  if (config.voteMode === "staff" && !isHarneStaffUser(user.id)) {
    return errorResponse("HARNE_FEATURE_DISABLED", "Voting is not enabled yet.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("HARNE_INVALID_INPUT", "Invalid request body.", 400);
  }

  const parsedBody = readVoteWriteBody(body);
  if (!parsedBody.ok) {
    if ("briefTooLong" in parsedBody && parsedBody.briefTooLong) {
      return errorResponse("HARNE_BRIEF_TOO_LONG", "The track cue is limited to 240 characters.", 400);
    }
    return errorResponse("HARNE_INVALID_INPUT", "Question, option, and brief values are invalid.", 400);
  }

  let admin;
  try {
    admin = getHarneAdminClient();
  } catch {
    return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  }
  if (!admin) {
    return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  }

  try {
    const { data, error } = await admin.rpc("harne_submit_vote_request", {
      p_user_id: user.id,
      p_request_key: idempotencyKey,
      p_question_id: parsedBody.questionId,
      p_option_id: parsedBody.optionId,
      p_brief: parsedBody.brief
    });

    if (error) {
      return unavailable();
    }

    const result = readVoteRpcResult(data);
    if (!result) {
      return unavailable();
    }

    if (result.kind === "conflict") {
      return errorResponse("HARNE_IDEMPOTENCY_CONFLICT", "This vote request is already being processed.", 409);
    }

    if (result.kind === "denied") {
      return deniedVoteResponse(result.code, result.response_code);
    }

    if (result.response_code !== 200) return unavailable();

    const receipt = readImmutableReceipt(result.receipt, parsedBody.questionId, parsedBody.optionId);
    if (!receipt) {
      return unavailable();
    }

    try {
      const snapshot = await getOpenVoteSnapshot(supabase, user.id);
      return NextResponse.json({ ok: true, receipt, snapshot });
    } catch {
      return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Vote data could not be loaded.", 503);
    }
  } catch {
    return unavailable();
  }
}
