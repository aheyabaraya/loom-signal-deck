import { NextResponse } from "next/server";
import { getStudioMode } from "../../../../lib/marketing/config";
import type { MarketingSummary } from "../../../../lib/marketing/contracts";
import { marketingErrorResponse } from "../../../../lib/marketing/http";
import { getMarketingServerContext } from "../../../../lib/marketing/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (getStudioMode() !== "database") {
    return marketingErrorResponse("MARKETING_DISABLED", "The database studio summary is not active.", 403);
  }

  const daysValue = new URL(request.url).searchParams.get("days") ?? "30";
  const days = Number(daysValue);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return marketingErrorResponse("MARKETING_INVALID_INPUT", "Summary days must be between 1 and 365.", 400);
  }

  const { supabase, user } = await getMarketingServerContext();
  if (!supabase) return marketingErrorResponse("MARKETING_NOT_CONFIGURED", "Studio storage is not configured.", 503);
  if (!user) return marketingErrorResponse("MARKETING_AUTH_REQUIRED", "Sign in with a staff account.", 401);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("loom_marketing_summary", { p_since: since });
  if (error || !data) return marketingErrorResponse("MARKETING_FORBIDDEN", "A staff account is required.", 403);

  return NextResponse.json({ ok: true, summary: data as MarketingSummary });
}
