import { createHash } from "node:crypto";

const MAX_MESSAGES = 10;
const MAX_MESSAGE_CONTENT = 1000;
const MAX_BODY_BYTES = 64_000;
const OUTPUT_TOKENS = 160;
const FRAMING_MARGIN = 512;

export type PreparedMemberReply = {
  body: {
    model: string;
    instructions: string;
    input: Array<{ role: "user" | "assistant"; content: string }>;
    max_output_tokens: number;
    safety_identifier: string;
    store: false;
    text: { verbosity: "low" };
  };
  inputCostPerMillion: number;
  outputCostPerMillion: number;
};

function requireOpenAiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI is not configured.");
  return key;
}

function requireCostRate(raw: string | undefined, fallback: string) {
  const rate = Number(raw || fallback);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("OpenAI cost rates are invalid.");
  }
  return rate;
}

function utf8Bytes(value: string) {
  return Buffer.byteLength(value, "utf8");
}

function microusd(
  inputTokens: number,
  outputTokens: number,
  inputCostPerMillion: number,
  outputCostPerMillion: number,
  minimum: number
) {
  if (![inputTokens, outputTokens].every((value) => Number.isSafeInteger(value) && value >= 0) ||
      ![inputCostPerMillion, outputCostPerMillion].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("OpenAI cost inputs are invalid.");
  }
  const result = Math.max(minimum, Math.ceil(inputTokens * inputCostPerMillion + outputTokens * outputCostPerMillion));
  if (!Number.isSafeInteger(result) || result > 1_000_000_000) throw new Error("OpenAI cost is out of range.");
  return result;
}

async function openAiRequest(path: string, body: object) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireOpenAiKey()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`OpenAI ${path} failed with ${response.status}.`);
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error(`OpenAI ${path} returned a malformed response.`);
    }

    return data as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function moderateText(text: string) {
  const data = await openAiRequest("moderations", {
    model: process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest",
    input: text
  });

  const results = data.results;
  if (!Array.isArray(results) || results.length !== 1 || !results[0] || typeof results[0] !== "object") {
    throw new Error("OpenAI moderations returned a malformed response.");
  }

  const flagged = (results[0] as { flagged?: unknown }).flagged;
  if (typeof flagged !== "boolean") {
    throw new Error("OpenAI moderations returned a malformed response.");
  }

  return flagged;
}

function extractOutput(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") return data.output_text.trim();

  const output = Array.isArray(data.output) ? data.output : [];
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object" || !Array.isArray((item as { content?: unknown }).content)) {
        return [];
      }

      return ((item as { content: unknown[] }).content ?? []).flatMap((content) => {
        if (!content || typeof content !== "object") return [];
        const text = (content as { text?: unknown }).text;
        return typeof text === "string" ? [text] : [];
      });
    })
    .join("\n")
    .trim();
}

export function safetyIdentifier(userId: string) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 64);
}

export function prepareMemberReply(args: {
  userId: string;
  member: {
    code: string;
    name: string;
    identity: string;
    role: string;
  };
  voteOption: { label: string; dimension: string; signal: string };
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): PreparedMemberReply {
  if (!Array.isArray(args.messages) || args.messages.length > MAX_MESSAGES) {
    throw new Error("Chat history is invalid.");
  }

  const input = args.messages.map((message): PreparedMemberReply["body"]["input"][number] => {
    if (
      !message ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string" ||
      message.content.length > MAX_MESSAGE_CONTENT
    ) {
      throw new Error("Chat history is invalid.");
    }

    return {
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content
    };
  });

  const instructions = [
    `You are ${args.member.name}, a fictional Loom member in a private Harne demo chat.`,
    "Reply in the user's dominant language.",
    "Keep the response warm, specific, and short: 2 to 4 compact sentences.",
    "Never claim to be a real person, know the user personally, or offer private contact.",
    "Do not make medical, legal, financial, or real-world promises.",
    "The response is fictional, AI-generated, and non-canonical.",
    `Member code: ${args.member.code}`,
    `Member identity: ${args.member.identity}`,
    `Member role: ${args.member.role}`,
    `Harne thread: ${args.voteOption.label} / ${args.voteOption.dimension}: ${args.voteOption.signal}`
  ].join("\n");

  const body: PreparedMemberReply["body"] = {
    model: process.env.OPENAI_CHAT_MODEL || "gpt-5.4-nano",
    instructions,
    input,
    max_output_tokens: OUTPUT_TOKENS,
    safety_identifier: safetyIdentifier(args.userId),
    store: false,
    text: { verbosity: "low" }
  };

  if (utf8Bytes(JSON.stringify(body)) > MAX_BODY_BYTES) {
    throw new Error("Chat history is invalid.");
  }

  return {
    body,
    inputCostPerMillion: requireCostRate(process.env.OPENAI_INPUT_COST_PER_1M, "0.75"),
    outputCostPerMillion: requireCostRate(process.env.OPENAI_OUTPUT_COST_PER_1M, "4.5")
  };
}

export function estimateReservedMicrousd(prepared: PreparedMemberReply) {
  const inputTokens =
    utf8Bytes(prepared.body.instructions) +
    prepared.body.input.reduce(
      (total, message) => total + utf8Bytes(message.role) + utf8Bytes(message.content),
      0
    ) +
    FRAMING_MARGIN;

  return microusd(
    inputTokens,
    OUTPUT_TOKENS,
    prepared.inputCostPerMillion,
    prepared.outputCostPerMillion,
    1
  );
}

export class GenerationUsageError extends Error {
  constructor(message: string, readonly inputTokens: number, readonly outputTokens: number) {
    super(message);
    this.name = "GenerationUsageError";
  }
}

export async function generateMemberReply(prepared: PreparedMemberReply) {
  const data = await openAiRequest("responses", prepared.body);
  const reply = extractOutput(data);
  const usage = data.usage;
  const inputTokens =
    usage && typeof usage === "object" && !Array.isArray(usage)
      ? (usage as { input_tokens?: unknown }).input_tokens
      : null;
  const outputTokens =
    usage && typeof usage === "object" && !Array.isArray(usage)
      ? (usage as { output_tokens?: unknown }).output_tokens
      : null;

  if (
    typeof inputTokens !== "number" ||
    !Number.isSafeInteger(inputTokens) ||
    inputTokens < 0 ||
    typeof outputTokens !== "number" ||
    !Number.isSafeInteger(outputTokens) ||
    outputTokens < 0
  ) {
    throw new Error("OpenAI returned unsupported usage.");
  }

  if (!reply) throw new GenerationUsageError("OpenAI returned an empty response.", inputTokens, outputTokens);
  return { reply, inputTokens, outputTokens };
}

export function calculateActualMicrousd(
  inputTokens: number,
  outputTokens: number,
  prepared: PreparedMemberReply
) {
  return microusd(
    inputTokens,
    outputTokens,
    prepared.inputCostPerMillion,
    prepared.outputCostPerMillion,
    0
  );
}
