"use client";

import { createClient } from "../supabase/client";
import { HARNE_EXPECTED_USER_HEADER, type HarneChatMessage, type HarneRequestIntent, type HarneVoteSnapshot } from "./contracts";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class HarneClientError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "HarneClientError";
    this.status = status;
    this.code = code;
  }
}

function expectedHarneUser(intent: HarneRequestIntent) {
  const expectedUserId = intent?.expectedUserId;
  if (typeof expectedUserId !== "string" || !expectedUserId || expectedUserId.length > 128) {
    throw new HarneClientError("Harne request requires an authenticated session.", 401);
  }
  return expectedUserId;
}

function createIdempotencyKey() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    },
    cache: "no-store"
  });
  const body = (await response.json().catch(() => null)) as T & ApiErrorBody;

  if (!response.ok) {
    throw new HarneClientError(
      body?.error?.message ?? "Harne request failed.",
      response.status,
      body?.error?.code
    );
  }

  return body as T;
}

const HARNE_SEND_ATTEMPT_LIMIT = 32;
const HARNE_VOTE_ATTEMPT_LIMIT = 32;

type HarneSendMessageResult = {
  ok: true;
  threadId: string;
  memberCode: string;
  reply: string;
  usage: { inputTokens: number; outputTokens: number; actualMicrousd: number };
};

type HarneVoteReceipt = {
  ballotId: number;
  questionId: number;
  optionId: number;
  updatedAt: string;
};

type HarneVoteResult = {
  ok: true;
  receipt: HarneVoteReceipt;
  snapshot: HarneVoteSnapshot;
};

type HarneSendAttempt = {
  userId: string;
  idempotencyKey: string;
  inFlight: Promise<HarneSendMessageResult> | null;
};

type HarneVoteAttempt = {
  userId: string;
  idempotencyKey: string;
  inFlight: Promise<HarneVoteResult> | null;
};

const harneSendAttempts = new Map<string, HarneSendAttempt>();
let harneSendAttemptsUserId: string | null = null;

const harneVoteAttempts = new Map<string, HarneVoteAttempt>();
let harneVoteAttemptsUserId: string | null = null;

function harneSendAttemptKey(userId: string, memberCode: string, trimmedText: string) {
  return JSON.stringify([userId, memberCode, trimmedText]);
}

function normalizeHarneVoteBrief(brief?: string) {
  return typeof brief === "string" ? brief.trim() : "";
}

function harneVoteAttemptKey(
  userId: string,
  questionId: number,
  optionId: number,
  normalizedBrief: string
) {
  return JSON.stringify([userId, questionId, optionId, normalizedBrief]);
}

function clearHarneSendAttempts() {
  harneSendAttempts.clear();
  harneSendAttemptsUserId = null;
}

function clearHarneVoteAttempts() {
  harneVoteAttempts.clear();
  harneVoteAttemptsUserId = null;
}

function clearHarneClientAttempts() {
  clearHarneSendAttempts();
  clearHarneVoteAttempts();
}

function bindHarneAttemptsUser(userId: string) {
  if (harneSendAttemptsUserId !== userId) {
    harneSendAttempts.clear();
    harneSendAttemptsUserId = userId;
  }
  if (harneVoteAttemptsUserId !== userId) {
    harneVoteAttempts.clear();
    harneVoteAttemptsUserId = userId;
  }
}

function clearHarneAttemptsIfUnauthenticated() {
  if (harneSendAttemptsUserId !== null) {
    clearHarneSendAttempts();
  }
  if (harneVoteAttemptsUserId !== null) {
    clearHarneVoteAttempts();
  }
}

function shouldRetainHarneSendAttempt(error: unknown) {
  if (!(error instanceof HarneClientError)) {
    return true;
  }
  return error.status === 409 || error.status >= 500;
}

function isHarneVoteSnapshot(value: unknown): value is HarneVoteSnapshot {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const snapshot = value as HarneVoteSnapshot;
  const round = snapshot.round;
  if (round === null || typeof round !== "object") {
    return false;
  }
  if (!Number.isSafeInteger(round.id) || typeof round.slug !== "string") {
    return false;
  }
  if (
    round.resultVisibility !== "hidden" &&
    round.resultVisibility !== "after_vote" &&
    round.resultVisibility !== "after_close"
  ) {
    return false;
  }
  if (typeof snapshot.ready !== "boolean" || !Array.isArray(snapshot.questions)) {
    return false;
  }
  return snapshot.questions.every((question) => {
    if (question === null || typeof question !== "object") {
      return false;
    }
    if (
      !Number.isSafeInteger(question.id) ||
      (question.kind !== "member_identity" && question.kind !== "next_track") ||
      typeof question.subjectKey !== "string" ||
      typeof question.prompt !== "string" ||
      !Number.isSafeInteger(question.sortOrder) ||
      (question.selectedOptionId !== null && !Number.isSafeInteger(question.selectedOptionId)) ||
      (question.selectedBrief !== null && typeof question.selectedBrief !== "string") ||
      !Array.isArray(question.options)
    ) {
      return false;
    }
    return question.options.every((option) => {
      if (option === null || typeof option !== "object") {
        return false;
      }
      return (
        Number.isSafeInteger(option.id) &&
        typeof option.optionKey === "string" &&
        typeof option.label === "string" &&
        typeof option.dimension === "string" &&
        typeof option.detail === "string" &&
        typeof option.signal === "string" &&
        Number.isSafeInteger(option.sortOrder)
      );
    });
  });
}

function isHarneVoteResult(
  value: unknown,
  questionId: number,
  optionId: number
): value is HarneVoteResult {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const result = value as HarneVoteResult;
  const receipt = result.receipt;
  return (
    result.ok === true &&
    receipt !== null &&
    typeof receipt === "object" &&
    Number.isSafeInteger(receipt.ballotId) && receipt.ballotId > 0 &&
    receipt.questionId === questionId &&
    receipt.optionId === optionId &&
    typeof receipt.updatedAt === "string" &&
    receipt.updatedAt.length > 0 && Number.isFinite(Date.parse(receipt.updatedAt)) &&
    isHarneVoteSnapshot(result.snapshot)
  );
}

export async function getHarneSession() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function ensureHarneSession() {
  const existingSession = await getHarneSession();
  if (existingSession) return existingSession;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInAnonymously({
    options: { data: { harne_demo: true } }
  });
  if (error || !data.session) {
    throw error ?? new Error("Anonymous demo sign-in is not enabled in Supabase.");
  }

  return data.session;
}

export function observeHarneSessionUser(callback: (userId: string | null) => void) {
  const { data } = createClient().auth.onAuthStateChange((_event: string, session: { user?: { id?: string } } | null) => {
    // Invalidate UI only; this event never authorizes another user's request.
    callback(session?.user?.id ?? null);
  });
  return () => data.subscription.unsubscribe();
}

async function readHarneJson<T>(url: string, intent: HarneRequestIntent) {
  const expectedUserId = expectedHarneUser(intent);
  const session = await getHarneSession();
  if (session?.user?.id !== expectedUserId) {
    throw new HarneClientError("The signed-in account changed during this request.", 401);
  }
  const result = await requestJson<T>(url, { headers: { [HARNE_EXPECTED_USER_HEADER]: expectedUserId } });
  const current = await getHarneSession();
  if (current?.user?.id !== expectedUserId) {
    throw new HarneClientError("The signed-in account changed during this request.", 401);
  }
  return result;
}

export async function getHarneSnapshot(intent: HarneRequestIntent) {
  const result = await readHarneJson<HarneVoteSnapshot & { featureMode?: string }>("/api/harne/votes", intent);
  if (!isHarneVoteSnapshot(result)) throw new HarneClientError("Vote data could not be confirmed. Reload Harne to continue.", 502);
  return result;
}

export async function submitHarneVote(args: {
  questionId: number;
  optionId: number;
  brief?: string;
}, intent: HarneRequestIntent) {
  const expectedUserId = expectedHarneUser(intent);
  const session = await getHarneSession();
  const userId = session?.user?.id;
  if (!userId) {
    clearHarneAttemptsIfUnauthenticated();
    throw new HarneClientError("Harne request requires an authenticated session.", 401);
  }

  if (userId !== expectedUserId) throw new HarneClientError("The signed-in account changed during this request.", 401);
  bindHarneAttemptsUser(userId);

  const questionId = args.questionId;
  const optionId = args.optionId;
  const normalizedBrief = normalizeHarneVoteBrief(args.brief);
  const cacheKey = harneVoteAttemptKey(userId, questionId, optionId, normalizedBrief);
  const existing = harneVoteAttempts.get(cacheKey);
  if (existing?.inFlight) {
    return existing.inFlight;
  }

  if (!existing && harneVoteAttempts.size >= HARNE_VOTE_ATTEMPT_LIMIT) {
    throw new HarneClientError("Harne vote is at capacity. Try again shortly.", 429);
  }

  const attempt: HarneVoteAttempt = existing ?? {
    userId,
    idempotencyKey: createIdempotencyKey(),
    inFlight: null
  };

  const payload: { questionId: number; optionId: number; brief?: string } = {
    questionId,
    optionId
  };
  if (normalizedBrief) {
    payload.brief = normalizedBrief;
  }

  const inFlight = requestJson<HarneVoteResult>("/api/harne/votes", {
    method: "PUT",
    headers: { "Idempotency-Key": attempt.idempotencyKey, [HARNE_EXPECTED_USER_HEADER]: expectedUserId },
    body: JSON.stringify(payload)
  }).then(async (result) => {
    const current = await getHarneSession();
    if (current?.user?.id !== userId) {
      throw new HarneClientError("The signed-in account changed during this request.", 401);
    }
    if (!isHarneVoteResult(result, questionId, optionId)) {
      throw new HarneClientError("The vote response was incomplete. Retry this vote.", 502);
    }
    return result;
  }).then(
    (result) => {
      if (harneVoteAttempts.get(cacheKey) === attempt) {
        harneVoteAttempts.delete(cacheKey);
      }
      return result;
    },
    (error: unknown) => {
      if (harneVoteAttempts.get(cacheKey) === attempt) {
        if (shouldRetainHarneSendAttempt(error)) {
          attempt.inFlight = null;
        } else {
          harneVoteAttempts.delete(cacheKey);
        }
      }
      throw error;
    }
  );

  attempt.inFlight = inFlight;
  harneVoteAttempts.set(cacheKey, attempt);
  return inFlight;
}

export async function getHarneThread(memberCode: string, intent: HarneRequestIntent) {
  const result = await readHarneJson<{
    thread: { id: string; memberCode: string; messages: HarneChatMessage[] } | null;
  }>(`/api/harne/chat/threads/${encodeURIComponent(memberCode)}`, intent);
  const thread = result?.thread;
  if (!result || typeof result !== "object" || Array.isArray(result) || !("thread" in result) || (thread !== null && (!thread ||
      typeof thread.id !== "string" || thread.memberCode !== memberCode || !Array.isArray(thread.messages) ||
      !thread.messages.every((message) => message && typeof message.id === "string" &&
        (message.role === "user" || message.role === "assistant") && typeof message.content === "string" &&
        typeof message.createdAt === "string")))) {
    throw new HarneClientError("Chat history could not be confirmed. Reload Harne to continue.", 502);
  }
  return result;
}

export async function clearHarneThread(memberCode: string, intent: HarneRequestIntent) {
  const expectedUserId = expectedHarneUser(intent);
  const session = await getHarneSession();
  if (session?.user?.id !== expectedUserId) {
    throw new HarneClientError("The signed-in account changed during this request.", 401);
  }
  const result = await requestJson<{ ok: true }>(`/api/harne/chat/threads/${encodeURIComponent(memberCode)}`, {
    method: "DELETE",
    headers: { [HARNE_EXPECTED_USER_HEADER]: expectedUserId }
  });
  if (!result || result.ok !== true) {
    throw new HarneClientError("Chat deletion could not be confirmed. Retry clearing this chat.", 502);
  }
  const current = await getHarneSession();
  if (current?.user?.id !== expectedUserId) {
    throw new HarneClientError("The signed-in account changed during this request.", 401);
  }
}

export async function sendHarneMessage(memberCode: string, text: string, intent: HarneRequestIntent) {
  const expectedUserId = expectedHarneUser(intent);
  const session = await getHarneSession();
  const userId = session?.user?.id;
  if (!userId) {
    clearHarneAttemptsIfUnauthenticated();
    throw new HarneClientError("Harne request requires an authenticated session.", 401);
  }

  if (userId !== expectedUserId) throw new HarneClientError("The signed-in account changed during this request.", 401);
  bindHarneAttemptsUser(userId);

  const cacheKey = harneSendAttemptKey(userId, memberCode, text.trim());
  const existing = harneSendAttempts.get(cacheKey);
  if (existing?.inFlight) {
    return existing.inFlight;
  }

  if (!existing && harneSendAttempts.size >= HARNE_SEND_ATTEMPT_LIMIT) {
    throw new HarneClientError("Harne chat is at capacity. Try again shortly.", 429);
  }

  const attempt: HarneSendAttempt = existing ?? {
    userId,
    idempotencyKey: createIdempotencyKey(),
    inFlight: null
  };

  const inFlight = requestJson<HarneSendMessageResult>("/api/harne/chat/messages", {
    method: "POST",
    headers: { "Idempotency-Key": attempt.idempotencyKey, [HARNE_EXPECTED_USER_HEADER]: expectedUserId },
    body: JSON.stringify({ memberCode, text })
  }).then(async (result) => {
    const current = await getHarneSession();
    if (current?.user?.id !== userId) {
      throw new HarneClientError("The signed-in account changed during this request.", 401);
    }
    if (!result || result.ok !== true || typeof result.threadId !== "string" ||
        result.memberCode !== memberCode || typeof result.reply !== "string" || !result.reply ||
        !result.usage || ![result.usage.inputTokens, result.usage.outputTokens, result.usage.actualMicrousd]
          .every((value) => Number.isSafeInteger(value) && value >= 0)) {
      throw new HarneClientError("The chat response was incomplete. Retry this message.", 502);
    }
    return result;
  }).then(
    (result) => {
      if (harneSendAttempts.get(cacheKey) === attempt) {
        harneSendAttempts.delete(cacheKey);
      }
      return result;
    },
    (error: unknown) => {
      if (harneSendAttempts.get(cacheKey) === attempt) {
        if (shouldRetainHarneSendAttempt(error)) {
          attempt.inFlight = null;
        } else {
          harneSendAttempts.delete(cacheKey);
        }
      }
      throw error;
    }
  );

  attempt.inFlight = inFlight;
  harneSendAttempts.set(cacheKey, attempt);
  return inFlight;
}

export async function signInWithOAuth(provider: "google" | "github", next = "/vote") {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo }
  });
  if (error) throw error;
}

export async function sendMagicLink(email: string, next = "/vote") {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });
  if (error) throw error;
}

export async function signOutHarne() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  clearHarneClientAttempts();
}
