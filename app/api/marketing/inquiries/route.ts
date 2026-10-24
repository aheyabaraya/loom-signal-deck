import { NextResponse } from "next/server";
import { getMarketingMode } from "../../../../lib/marketing/config";
import { marketingErrorResponse } from "../../../../lib/marketing/http";
import { getMarketingServerContext } from "../../../../lib/marketing/server";
import { parseBusinessInquiryInput } from "../../../../lib/marketing/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const mode = getMarketingMode();
  if (mode !== "database") {
    return marketingErrorResponse(
      "MARKETING_DISABLED",
      "Secure inquiry delivery is not active in this environment.",
      403
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return marketingErrorResponse("MARKETING_INVALID_INPUT", "Invalid inquiry body.", 400);
  }

  const parsed = parseBusinessInquiryInput(body);
  if (!parsed.ok) return marketingErrorResponse("MARKETING_INVALID_INPUT", parsed.message, 400);

  const { supabase, user } = await getMarketingServerContext();
  if (!supabase) return marketingErrorResponse("MARKETING_NOT_CONFIGURED", "Inquiry storage is not configured.", 503);
  if (!user) return marketingErrorResponse("MARKETING_AUTH_REQUIRED", "A user session is required.", 401);

  const input = parsed.value;
  const { data, error } = await supabase.rpc("loom_submit_business_inquiry", {
    p_name: input.name,
    p_email: input.email,
    p_company: input.company ?? null,
    p_inquiry_type: input.inquiryType,
    p_goal: input.goal,
    p_timeline: input.timeline,
    p_budget_band: input.budgetBand,
    p_policy_version: input.policyVersion
  });

  if (error || !data?.[0]) {
    return marketingErrorResponse("MARKETING_DEPENDENCY_UNAVAILABLE", "The inquiry could not be stored.", 503);
  }

  return NextResponse.json({
    ok: true,
    mode,
    receipt: { inquiryId: data[0].inquiry_id, createdAt: data[0].created_at }
  });
}
