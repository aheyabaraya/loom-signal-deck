import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const migration = await readFile(new URL("supabase/migrations/20260806052610_harne_vote_chat_demo.sql", root), "utf8");

const requiredTables = [
  "harne_vote_rounds",
  "harne_vote_questions",
  "harne_vote_options",
  "harne_vote_ballots",
  "harne_chat_threads",
  "harne_chat_messages",
  "harne_chat_daily_usage",
  "harne_chat_global_daily_usage",
  "harne_api_idempotency"
];
const requiredFunctions = [
  "harne_submit_vote",
  "harne_vote_summary",
  "harne_reserve_chat_quota",
  "harne_release_chat_quota",
  "harne_settle_chat_turn"
];

for (const table of requiredTables) {
  if (!migration.includes(`create table if not exists public.${table}`)) {
    throw new Error(`Missing Harne table: ${table}`);
  }
}

for (const functionName of requiredFunctions) {
  if (!migration.includes(`function public.${functionName}`)) {
    throw new Error(`Missing Harne function: ${functionName}`);
  }
}

if (!migration.includes("alter table public.harne_vote_ballots enable row level security")) {
  throw new Error("Vote ballot RLS is not enabled in the migration.");
}

if (!migration.includes("values ('harne-demo-2026', 'open'")) {
  throw new Error("The open Harne demo round seed is missing.");
}

await Promise.all([
  access(new URL("app/api/harne/votes/route.ts", root)),
  access(new URL("app/api/harne/chat/messages/route.ts", root)),
  access(new URL("app/auth/callback/route.ts", root))
]);

const memberSeedCount = (migration.match(/\{"subject_key":"M\d{2}"/g) ?? []).length;
if (memberSeedCount !== 13) {
  throw new Error(`Expected 13 member seed questions, found ${memberSeedCount}.`);
}

console.log(`Harne contract valid: ${requiredTables.length} tables, ${requiredFunctions.length} RPCs, ${memberSeedCount} member questions, Auth callback and API routes present.`);
