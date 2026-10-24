import { NextResponse } from "next/server";
import { getMarketingMode } from "../../../../lib/marketing/config";
import { marketingErrorResponse } from "../../../../lib/marketing/http";
import { getMarketingServerContext } from "../../../../lib/marketing/server";
import { parseFanProfileInput } from "../../../../lib/marketing/validation";

export const runtime = "nodejs";

export async function GET() {
  const mode = getMarketingMode();
  if (mode === "off") return marketingErrorResponse("MARKETING_DISABLED", "Fan profile sync is disabled.", 403);
  if (mode === "preview") return NextResponse.json({ mode, persisted: false, profile: null, follows: [], consents: {} });

  const { supabase, user } = await getMarketingServerContext();
  if (!supabase) return marketingErrorResponse("MARKETING_NOT_CONFIGURED", "Fan profile storage is not configured.", 503);
  if (!user) return marketingErrorResponse("MARKETING_AUTH_REQUIRED", "A user session is required.", 401);

  const [profileResult, followsResult, consentResult] = await Promise.all([
    supabase
      .from("loom_fan_profiles")
      .select("favorite_member_code, favorite_track_id, locale, cross_device_enabled, profile_version, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("loom_follows")
      .select("subject_type, subject_key, notifications_enabled, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("loom_marketing_consents")
      .select("purpose, state, policy_version, occurred_at")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
  ]);

  if (profileResult.error || followsResult.error || consentResult.error) {
    return marketingErrorResponse("MARKETING_DEPENDENCY_UNAVAILABLE", "The fan profile could not be loaded.", 503);
  }

  const latestConsents: Record<string, { state: string; policyVersion: string; occurredAt: string }> = {};
  for (const consent of consentResult.data ?? []) {
    if (!latestConsents[consent.purpose]) {
      latestConsents[consent.purpose] = {
        state: consent.state,
        policyVersion: consent.policy_version,
        occurredAt: consent.occurred_at
      };
    }
  }

  return NextResponse.json({
    mode,
    persisted: true,
    profile: profileResult.data,
    follows: followsResult.data ?? [],
    consents: latestConsents
  });
}

export async function PUT(request: Request) {
  const mode = getMarketingMode();
  if (mode === "off") return marketingErrorResponse("MARKETING_DISABLED", "Fan profile sync is disabled.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return marketingErrorResponse("MARKETING_INVALID_INPUT", "Invalid profile body.", 400);
  }

  const parsed = parseFanProfileInput(body);
  if (!parsed.ok) return marketingErrorResponse("MARKETING_INVALID_INPUT", parsed.message, 400);
  if (mode === "preview") return NextResponse.json({ ok: true, mode, persisted: false }, { status: 202 });

  const { supabase, user } = await getMarketingServerContext();
  if (!supabase) return marketingErrorResponse("MARKETING_NOT_CONFIGURED", "Fan profile storage is not configured.", 503);
  if (!user) return marketingErrorResponse("MARKETING_AUTH_REQUIRED", "A user session is required.", 401);

  const input = parsed.value;
  const { data, error } = await supabase.rpc("loom_save_fan_profile", {
    p_favorite_member_code: input.favoriteMemberCode,
    p_favorite_track_id: input.favoriteTrackId,
    p_locale: input.locale,
    p_cross_device_enabled: input.crossDeviceEnabled,
    p_follows: input.follows,
    p_analytics_consent: input.consents.analytics ?? null,
    p_profile_sync_consent: input.consents.profileSync ?? null,
    p_notifications_consent: input.consents.notifications ?? null,
    p_policy_version: input.policyVersion
  });

  if (error) return marketingErrorResponse("MARKETING_DEPENDENCY_UNAVAILABLE", "The fan profile could not be saved.", 503);
  return NextResponse.json({ ok: true, mode, persisted: true, receipt: data });
}
