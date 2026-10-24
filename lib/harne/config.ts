import type { HarneVoteKind } from "./contracts";

export type HarneFeatureMode = "off" | "shadow" | "staff" | "public";
export type HarneResultVisibility = "hidden" | "after_vote" | "after_close";

function readMode(value: string | undefined, fallback: HarneFeatureMode): HarneFeatureMode {
  return value === "off" || value === "shadow" || value === "staff" || value === "public"
    ? value
    : fallback;
}

export function getHarneConfig() {
  return {
    dataMode: process.env.HARNE_DATA_MODE === "mock" ? "mock" : "supabase",
    voteMode: readMode(process.env.HARNE_VOTE_MODE, "off"),
    chatMode: readMode(process.env.HARNE_CHAT_MODE, "off"),
    resultVisibility: (process.env.HARNE_RESULT_VISIBILITY === "after_vote" ||
    process.env.HARNE_RESULT_VISIBILITY === "after_close"
      ? process.env.HARNE_RESULT_VISIBILITY
      : "hidden") as HarneResultVisibility,
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ),
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY)
  };
}

export function isModeEnabled(mode: HarneFeatureMode, kind: HarneVoteKind | "chat") {
  if (mode === "off") {
    return false;
  }

  if (mode === "shadow") {
    return kind !== "chat";
  }

  return true;
}

export function parseMemberCode(value: unknown) {
  return typeof value === "string" && /^M(?:0[1-9]|1[0-3])$/.test(value) ? value : null;
}

export function isHarneStaffUser(userId: string) {
  const raw = process.env.HARNE_STAFF_USER_IDS;
  if (!userId || !raw) {
    return false;
  }

  const allowlist = new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  return allowlist.size > 0 && allowlist.has(userId);
}
