import { NextResponse } from "next/server";
import { getMarketingMode } from "../../../../lib/marketing/config";
import { marketingErrorResponse } from "../../../../lib/marketing/http";
import { getMarketingServerContext } from "../../../../lib/marketing/server";
import { parseMembershipInterestInput } from "../../../../lib/marketing/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const mode = getMarketingMode();
  if (mode === "off") return marketingErrorResponse("MARKETING_DISABLED", "Membership interest is disabled.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return marketingErrorResponse("MARKETING_INVALID_INPUT", "Invalid membership interest body.", 400);
  }

  const parsed = parseMembershipInterestInput(body);
  if (!parsed.ok) return marketingErrorResponse("MARKETING_INVALID_INPUT", parsed.message, 400);
  if (mode === "preview") return NextResponse.json({ ok: true, mode, persisted: false }, { status: 202 });

  const { supabase, user } = await getMarketingServerContext();
  if (!supabase) return marketingErrorResponse("MARKETING_NOT_CONFIGURED", "Membership storage is not configured.", 503);
  if (!user) return marketingErrorResponse("MARKETING_AUTH_REQUIRED", "A user session is required.", 401);

  const input = parsed.value;
  const { data, error } = await supabase
    .from("loom_membership_interests")
    .upsert(
      { user_id: user.id, plan_key: input.planKey, state: input.state },
      { onConflict: "user_id,plan_key" }
    )
    .select("plan_key, state, updated_at")
    .single();

  if (error || !data) {
    return marketingErrorResponse("MARKETING_DEPENDENCY_UNAVAILABLE", "Membership interest could not be saved.", 503);
  }

  return NextResponse.json({ ok: true, mode, persisted: true, receipt: data });
}
