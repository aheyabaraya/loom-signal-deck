import { NextResponse } from "next/server";
import { getHarneConfig } from "../../../../lib/harne/config";
import { getHarneServerContext } from "../../../../lib/harne/server";
import { errorResponse } from "../../../../lib/harne/http";

export const runtime = "nodejs";

export async function GET() {
  const config = getHarneConfig();
  const { user, supabase } = await getHarneServerContext();

  if (!supabase) {
    return errorResponse("HARNE_NOT_CONFIGURED", "Supabase is not configured for this demo.", 503);
  }

  if (!user) {
    return NextResponse.json({
      ready: false,
      authenticated: false,
      anonymous: false,
      features: { vote: config.voteMode, chat: config.chatMode }
    });
  }

  return NextResponse.json({
    ready: true,
    authenticated: true,
    anonymous: Boolean((user as { is_anonymous?: boolean }).is_anonymous),
    userId: user.id,
    features: { vote: config.voteMode, chat: config.chatMode },
    resultVisibility: config.resultVisibility
  });
}
