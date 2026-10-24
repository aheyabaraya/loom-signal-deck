import type { HarneVoteOption, HarneVoteQuestion, HarneVoteSnapshot } from "./contracts";

type Row = Record<string, unknown>;

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function mapOption(row: Row): HarneVoteOption {
  return {
    id: asNumber(row.id),
    optionKey: asString(row.option_key),
    label: asString(row.label),
    dimension: asString(row.dimension),
    detail: asString(row.detail),
    signal: asString(row.signal),
    sortOrder: asNumber(row.sort_order)
  };
}

export async function getOpenVoteSnapshot(supabase: any, userId: string): Promise<HarneVoteSnapshot> {
  const { data: round, error: roundError } = await supabase
    .from("harne_vote_rounds")
    .select("id, slug, result_visibility")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundError) {
    throw roundError;
  }

  if (!round) {
    return { round: { id: 0, slug: "", resultVisibility: "hidden" }, questions: [], ready: false };
  }

  const [questionsResult, optionsResult, ballotsResult] = await Promise.all([
    supabase
      .from("harne_vote_questions")
      .select("id, kind, subject_key, prompt, sort_order")
      .eq("round_id", round.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("harne_vote_options")
      .select("id, question_id, option_key, label, dimension, detail, signal, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("harne_vote_ballots")
      .select("question_id, option_id, brief")
      .eq("user_id", userId)
  ]);

  if (questionsResult.error) throw questionsResult.error;
  if (optionsResult.error) throw optionsResult.error;
  if (ballotsResult.error) throw ballotsResult.error;

  const ballotByQuestion = new Map<number, { optionId: number; brief: string | null }>();
  (ballotsResult.data ?? []).forEach((row: Row) => {
    ballotByQuestion.set(asNumber(row.question_id), {
      optionId: asNumber(row.option_id),
      brief: typeof row.brief === "string" ? row.brief : null
    });
  });

  const optionsByQuestion = new Map<number, HarneVoteOption[]>();
  (optionsResult.data ?? []).forEach((row: Row) => {
    const questionId = asNumber(row.question_id);
    const options = optionsByQuestion.get(questionId) ?? [];
    options.push(mapOption(row));
    optionsByQuestion.set(questionId, options);
  });

  const questions: HarneVoteQuestion[] = (questionsResult.data ?? []).map((row: Row) => {
    const id = asNumber(row.id);
    const ballot = ballotByQuestion.get(id);
    return {
      id,
      kind: row.kind === "next_track" ? "next_track" : "member_identity",
      subjectKey: asString(row.subject_key),
      prompt: asString(row.prompt),
      sortOrder: asNumber(row.sort_order),
      selectedOptionId: ballot?.optionId ?? null,
      selectedBrief: ballot?.brief ?? null,
      options: optionsByQuestion.get(id) ?? []
    };
  });

  return {
    round: {
      id: asNumber(round.id),
      slug: asString(round.slug),
      resultVisibility:
        round.result_visibility === "after_vote" || round.result_visibility === "after_close"
          ? round.result_visibility
          : "hidden"
    },
    questions,
    ready: questions.length > 0
  };
}

export async function getMemberChatThread(supabase: any, userId: string, memberCode: string) {
  const { data: thread, error: threadError } = await supabase
    .from("harne_chat_threads")
    .select("id, member_code, last_message_at")
    .eq("user_id", userId)
    .eq("member_code", memberCode)
    .maybeSingle();

  if (threadError) throw threadError;
  if (!thread) return null;

  const { data: messages, error: messageError } = await supabase
    .from("harne_chat_messages")
    .select("id, role, content, created_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (messageError) throw messageError;

  return {
    id: String(thread.id),
    memberCode: String(thread.member_code),
    messages: (messages ?? []).reverse().map((message: Row) => ({
      id: String(message.id),
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content),
      createdAt: String(message.created_at)
    }))
  };
}
