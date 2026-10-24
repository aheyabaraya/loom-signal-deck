import { NextResponse } from "next/server";
import { getHarneConfig } from "../../../../../lib/harne/config";
import { errorResponse } from "../../../../../lib/harne/http";
import { getHarneServerContext } from "../../../../../lib/harne/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const config = getHarneConfig();
  if (config.resultVisibility === "hidden") {
    return errorResponse("HARNE_FEATURE_DISABLED", "Vote results are hidden for this round.", 403);
  }

  const { user, supabase } = await getHarneServerContext();
  if (!supabase) return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  if (!user) return errorResponse("HARNE_AUTH_REQUIRED", "Sign in before loading results.", 401);

  const roundSlug = new URL(request.url).searchParams.get("round");
  const { data: round, error: roundError } = await supabase
    .from("harne_vote_rounds")
    .select("id, slug, status, result_visibility")
    .eq("slug", roundSlug || "harne-demo-2026")
    .maybeSingle();

  if (roundError || !round) return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Vote round not found.", 404);
  if (config.resultVisibility === "after_close" && round.status !== "closed") {
    return errorResponse("HARNE_FEATURE_DISABLED", "Vote results are not visible yet.", 403);
  }

  const { data: questions, error: questionsError } = await supabase
    .from("harne_vote_questions")
    .select("id, kind, subject_key")
    .eq("round_id", round.id)
    .order("sort_order", { ascending: true });
  if (questionsError) return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Vote questions could not be loaded.", 503);

  const results = [];
  for (const question of questions ?? []) {
    const { data, error } = await supabase.rpc("harne_vote_summary", { p_question_id: question.id });
    if (error) return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Vote results could not be loaded.", 503);
    results.push({
      questionId: Number(question.id),
      kind: question.kind,
      subjectKey: question.subject_key,
      options: (data ?? []).map((row: { option_id: number; vote_count: number }) => ({
        optionId: Number(row.option_id),
        count: Number(row.vote_count)
      }))
    });
  }

  return NextResponse.json({ round: round.slug, results });
}
