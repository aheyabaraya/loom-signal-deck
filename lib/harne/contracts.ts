export const HARNE_EXPECTED_USER_HEADER = "X-Harne-Expected-User";

export type HarneRequestIntent = { expectedUserId: string | null };

export type HarneVoteKind = "member_identity" | "next_track";

export type HarneVoteOption = {
  id: number;
  optionKey: string;
  label: string;
  dimension: string;
  detail: string;
  signal: string;
  sortOrder: number;
};

export type HarneVoteQuestion = {
  id: number;
  kind: HarneVoteKind;
  subjectKey: string;
  prompt: string;
  sortOrder: number;
  selectedOptionId: number | null;
  selectedBrief: string | null;
  options: HarneVoteOption[];
};

export type HarneVoteSnapshot = {
  round: {
    id: number;
    slug: string;
    resultVisibility: "hidden" | "after_vote" | "after_close";
  };
  questions: HarneVoteQuestion[];
  ready: boolean;
};

export type HarneChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type HarneErrorCode =
  | "HARNE_NOT_CONFIGURED"
  | "HARNE_FEATURE_DISABLED"
  | "HARNE_AUTH_REQUIRED"
  | "HARNE_INVALID_INPUT"
  | "HARNE_QUESTION_CLOSED"
  | "HARNE_OPTION_INVALID"
  | "HARNE_BRIEF_TOO_LONG"
  | "CHAT_VOTE_REQUIRED"
  | "CHAT_MEMBER_DAILY_LIMIT"
  | "CHAT_USER_DAILY_LIMIT"
  | "CHAT_GLOBAL_BUDGET_EXHAUSTED"
  | "CHAT_MODERATION_REJECTED"
  | "CHAT_MODEL_FAILED"
  | "HARNE_EXPIRED"
  | "HARNE_IDEMPOTENCY_CONFLICT"
  | "HARNE_DEPENDENCY_UNAVAILABLE";
