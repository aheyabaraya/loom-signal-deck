import { NextResponse } from "next/server";
import { getMember, memberByCode, type MemberCode } from "../../../data/members";

export const runtime = "nodejs";

type ChatRole = "user" | "assistant";

type ClientChatMessage = {
  role: ChatRole;
  text: string;
};

type BudgetState = {
  day: string;
  reservedUsd: number;
  actualUsd: number;
  requests: number;
};

type OpenAIUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

const maxInputChars = 420;
const maxContextMessages = 10;
const maxOutputTokens = 160;
const defaultModel = "gpt-5.4-nano";
const defaultDailyLimitUsd = 0.1;
const defaultInputCostPerMillion = 0.75;
const defaultOutputCostPerMillion = 4.5;

function getTodayKey() {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric"
  }).formatToParts(new Date());
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`;
}

function getBudgetState() {
  const globalBudget = globalThis as typeof globalThis & {
    __loomMemberChatBudget?: BudgetState;
  };
  const day = getTodayKey();

  if (!globalBudget.__loomMemberChatBudget || globalBudget.__loomMemberChatBudget.day !== day) {
    globalBudget.__loomMemberChatBudget = {
      actualUsd: 0,
      day,
      requests: 0,
      reservedUsd: 0
    };
  }

  return globalBudget.__loomMemberChatBudget;
}

function readNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function estimateTokens(text: string) {
  return Math.ceil(text.length * 1.1) + 48;
}

function calculateCost(inputTokens: number, outputTokens: number) {
  const inputCostPerMillion = readNumber(
    process.env.OPENAI_INPUT_COST_PER_1M,
    defaultInputCostPerMillion
  );
  const outputCostPerMillion = readNumber(
    process.env.OPENAI_OUTPUT_COST_PER_1M,
    defaultOutputCostPerMillion
  );

  return (
    (inputTokens * inputCostPerMillion + outputTokens * outputCostPerMillion) / 1_000_000
  );
}

function reserveBudget(estimatedInputTokens: number) {
  const budget = getBudgetState();
  const dailyLimitUsd = readNumber(process.env.OPENAI_DAILY_COST_LIMIT_USD, defaultDailyLimitUsd);
  const reservedCost = calculateCost(estimatedInputTokens, maxOutputTokens);

  if (budget.reservedUsd + reservedCost > dailyLimitUsd) {
    return {
      ok: false,
      budget,
      dailyLimitUsd,
      reservedCost
    };
  }

  budget.reservedUsd += reservedCost;
  budget.requests += 1;

  return {
    ok: true,
    budget,
    dailyLimitUsd,
    reservedCost
  };
}

function settleBudget(reservedCost: number, usage: OpenAIUsage | null, failed = false) {
  const budget = getBudgetState();

  if (failed) {
    budget.reservedUsd = Math.max(0, budget.reservedUsd - reservedCost);
    return;
  }

  const actualCost = usage
    ? calculateCost(usage.input_tokens ?? 0, usage.output_tokens ?? 0)
    : reservedCost;

  budget.actualUsd += actualCost;
  budget.reservedUsd = Math.max(0, budget.reservedUsd - reservedCost + actualCost);
}

function sanitizeMessages(value: unknown): ClientChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const role = "role" in item ? item.role : null;
      const text = "text" in item ? item.text : null;

      if ((role !== "user" && role !== "assistant") || typeof text !== "string") {
        return [];
      }

      const trimmed = text.trim().slice(0, maxInputChars);

      return trimmed ? [{ role, text: trimmed }] : [];
    })
    .slice(-maxContextMessages);
}

function findVoteOption(memberCode: MemberCode, voteOptionId: unknown) {
  if (typeof voteOptionId !== "string") {
    return null;
  }

  return getMember(memberCode).voteOptions.find((option) => option.id === voteOptionId) ?? null;
}

function buildInstructions(memberCode: MemberCode, voteOptionId: string) {
  const member = getMember(memberCode);
  const voteOption = findVoteOption(memberCode, voteOptionId);
  const voteLine = voteOption
    ? `${voteOption.label} / ${voteOption.dimension}: ${voteOption.signal}`
    : "No Harne vote was found.";

  return [
    `You are ${member.name}, a fictional Loom member in a private Harne prototype chat.`,
    "Stay in a light character voice, but never claim to be a real person or to know the user personally.",
    "Reply in the user's dominant language. Korean is fine when the user writes Korean.",
    "Keep replies warm, specific, and short: 2 to 4 compact sentences.",
    "Use the selected Harne vote as the emotional thread for this chat.",
    "Avoid sexual content, real-world promises, private contact requests, medical/legal/financial advice, and anything that sounds like official canon.",
    `Member code: ${member.code}`,
    `Member name: ${member.name}`,
    `Member identity: ${member.identity}`,
    `Member role: ${member.role}`,
    `Harne vote: ${voteLine}`
  ].join("\n");
}

function buildConversationPrompt(messages: ClientChatMessage[]) {
  const recentMessages = messages
    .map((message) => `${message.role === "user" ? "Harne" : "Member"}: ${message.text}`)
    .join("\n");

  return [
    "Continue this member chat from the transcript below.",
    "Answer only with the next member message. Do not add labels.",
    "",
    recentMessages
  ].join("\n");
}

function extractReply(data: unknown) {
  if (!data || typeof data !== "object") {
    return "";
  }

  if ("output_text" in data && typeof data.output_text === "string") {
    return data.output_text.trim();
  }

  if (!("output" in data) || !Array.isArray(data.output)) {
    return "";
  }

  return data.output
    .flatMap((item: unknown) => {
      if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) {
        return [];
      }

      return item.content.flatMap((contentItem: unknown) => {
        if (!contentItem || typeof contentItem !== "object") {
          return [];
        }

        if ("text" in contentItem && typeof contentItem.text === "string") {
          return [contentItem.text];
        }

        if ("output_text" in contentItem && typeof contentItem.output_text === "string") {
          return [contentItem.output_text];
        }

        return [];
      });
    })
    .join("\n")
    .trim();
}

function extractUsage(data: unknown): OpenAIUsage | null {
  if (!data || typeof data !== "object" || !("usage" in data)) {
    return null;
  }

  const usage = data.usage;

  if (!usage || typeof usage !== "object") {
    return null;
  }

  const inputTokens = "input_tokens" in usage && typeof usage.input_tokens === "number"
    ? usage.input_tokens
    : 0;
  const outputTokens = "output_tokens" in usage && typeof usage.output_tokens === "number"
    ? usage.output_tokens
    : 0;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens:
      "total_tokens" in usage && typeof usage.total_tokens === "number"
        ? usage.total_tokens
        : inputTokens + outputTokens
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const memberCode = "memberCode" in body ? body.memberCode : null;

  if (typeof memberCode !== "string" || !memberByCode.has(memberCode as MemberCode)) {
    return NextResponse.json({ error: "Unknown member." }, { status: 400 });
  }

  const voteOptionId = "voteOptionId" in body ? body.voteOptionId : null;
  const voteOption = findVoteOption(memberCode as MemberCode, voteOptionId);

  if (!voteOption) {
    return NextResponse.json({ error: "Vote signal is required before chat." }, { status: 403 });
  }

  const messages = sanitizeMessages("messages" in body ? body.messages : []);
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

  if (!latestUserMessage) {
    return NextResponse.json({ error: "A user message is required." }, { status: 400 });
  }

  const instructions = buildInstructions(memberCode as MemberCode, voteOption.id);
  const input = buildConversationPrompt(messages);
  const estimatedInputTokens = estimateTokens(`${instructions}\n${input}`);
  const reservation = reserveBudget(estimatedInputTokens);

  if (!reservation.ok) {
    return NextResponse.json(
      {
        budget: {
          dailyLimitUsd: reservation.dailyLimitUsd,
          usedUsd: Number(reservation.budget.reservedUsd.toFixed(6))
        },
        error: "Daily chat budget is exhausted."
      },
      { status: 429 }
    );
  }

  try {
    const model = process.env.OPENAI_CHAT_MODEL || defaultModel;
    const response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify({
        input,
        instructions,
        max_output_tokens: maxOutputTokens,
        model,
        store: false,
        text: {
          verbosity: "low"
        }
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    const data = await response.json().catch(() => null);
    const usage = extractUsage(data);

    if (!response.ok) {
      settleBudget(reservation.reservedCost, usage, true);
      return NextResponse.json(
        {
          error:
            data && typeof data === "object" && "error" in data
              ? "OpenAI request failed."
              : "OpenAI request failed."
        },
        { status: response.status }
      );
    }

    const reply = extractReply(data);

    if (!reply) {
      settleBudget(reservation.reservedCost, usage, true);
      return NextResponse.json({ error: "Empty model response." }, { status: 502 });
    }

    settleBudget(reservation.reservedCost, usage);

    const budget = getBudgetState();

    return NextResponse.json({
      budget: {
        dailyLimitUsd: reservation.dailyLimitUsd,
        usedUsd: Number(budget.reservedUsd.toFixed(6))
      },
      reply,
      usage
    });
  } catch {
    settleBudget(reservation.reservedCost, null, true);
    return NextResponse.json({ error: "Chat request could not be completed." }, { status: 502 });
  }
}
