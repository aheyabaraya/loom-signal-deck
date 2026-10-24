import { NextResponse } from "next/server";
import { parseMemberCode } from "../../../../../../lib/harne/config";
import { errorResponse } from "../../../../../../lib/harne/http";
import { getMemberChatThread } from "../../../../../../lib/harne/data";
import { getHarneMutationContext, getHarneReadContext } from "../../../../../../lib/harne/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ memberCode: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { memberCode: rawMemberCode } = await context.params;
  const memberCode = parseMemberCode(rawMemberCode);
  if (!memberCode) return errorResponse("HARNE_INVALID_INPUT", "Member code is invalid.", 400);

  const { user, supabase } = await getHarneReadContext(_request);
  if (!supabase) return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  if (!user) return errorResponse("HARNE_AUTH_REQUIRED", "Sign in before loading chat.", 401);

  try {
    return NextResponse.json({ thread: await getMemberChatThread(supabase, user.id, memberCode) });
  } catch {
    return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Chat history could not be loaded.", 503);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { memberCode: rawMemberCode } = await context.params;
  const memberCode = parseMemberCode(rawMemberCode);
  if (!memberCode) return errorResponse("HARNE_INVALID_INPUT", "Member code is invalid.", 400);

  const { user, supabase } = await getHarneMutationContext(_request);
  if (!supabase) return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  if (!user) return errorResponse("HARNE_AUTH_REQUIRED", "Sign in before clearing chat.", 401);

  const { error } = await supabase
    .from("harne_chat_threads")
    .delete()
    .eq("user_id", user.id)
    .eq("member_code", memberCode);
  if (error) return errorResponse("HARNE_DEPENDENCY_UNAVAILABLE", "Chat history could not be deleted.", 503);

  return NextResponse.json({ ok: true, memberCode });
}
