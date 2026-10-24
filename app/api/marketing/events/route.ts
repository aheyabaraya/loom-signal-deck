import { NextResponse } from "next/server";
import { getMarketingMode } from "../../../../lib/marketing/config";
import { marketingErrorResponse } from "../../../../lib/marketing/http";
import { getMarketingServerContext } from "../../../../lib/marketing/server";
import { parseMarketingEventInput } from "../../../../lib/marketing/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const mode = getMarketingMode();
  if (mode === "off") return marketingErrorResponse("MARKETING_DISABLED", "Marketing signals are disabled.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return marketingErrorResponse("MARKETING_INVALID_INPUT", "Invalid event body.", 400);
  }

  const parsed = parseMarketingEventInput(body);
  if (!parsed.ok) return marketingErrorResponse("MARKETING_INVALID_INPUT", parsed.message, 400);

  if (mode === "preview") {
    return NextResponse.json({ ok: true, mode, persisted: false }, { status: 202 });
  }

  const { supabase, user } = await getMarketingServerContext();
  if (!supabase) return marketingErrorResponse("MARKETING_NOT_CONFIGURED", "Marketing storage is not configured.", 503);
  if (!user) return marketingErrorResponse("MARKETING_AUTH_REQUIRED", "A user session is required.", 401);

  const input = parsed.value;
  const { data, error } = await supabase.rpc("loom_record_marketing_event", {
    p_session_id: input.sessionId,
    p_idempotency_key: input.idempotencyKey,
    p_event_name: input.eventName,
    p_campaign_id: input.campaignId ?? null,
    p_touchpoint_id: input.touchpointId ?? null,
    p_content_type: input.contentType ?? null,
    p_content_key: input.contentKey ?? null,
    p_path: input.path,
    p_source: input.source,
    p_properties: input.properties ?? {},
    p_occurred_at: input.occurredAt
  });

  if (error || !data?.[0]) {
    return marketingErrorResponse("MARKETING_DEPENDENCY_UNAVAILABLE", "The event could not be stored.", 503);
  }

  return NextResponse.json({
    ok: true,
    mode,
    persisted: true,
    receipt: {
      eventId: Number(data[0].event_id),
      created: Boolean(data[0].persisted),
      receivedAt: data[0].received_at
    }
  });
}
