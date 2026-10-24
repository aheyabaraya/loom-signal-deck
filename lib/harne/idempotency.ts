const idempotencyTtlMs = 24 * 60 * 60 * 1000;

type IdempotencyRow = {
  status: "in_flight" | "completed";
  response_code: number | null;
  response_body: Record<string, unknown> | null;
};

export function readIdempotencyKey(request: Request) {
  const value = request.headers.get("Idempotency-Key")?.trim();
  return value && value.length >= 8 && value.length <= 120 ? value : null;
}

export async function beginIdempotency(
  supabase: any,
  userId: string,
  routeKey: string,
  idempotencyKey: string
) {
  const expiresAt = new Date(Date.now() + idempotencyTtlMs).toISOString();
  const { data, error } = await supabase
    .from("harne_api_idempotency")
    .insert({
      user_id: userId,
      route_key: routeKey,
      idempotency_key: idempotencyKey,
      expires_at: expiresAt
    })
    .select("status, response_code, response_body")
    .maybeSingle();

  if (!error && data) {
    return { kind: "new" as const };
  }

  const { data: existing, error: existingError } = await supabase
    .from("harne_api_idempotency")
    .select("status, response_code, response_body")
    .eq("user_id", userId)
    .eq("route_key", routeKey)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingError || !existing) {
    throw error ?? existingError ?? new Error("Unable to reserve idempotency key.");
  }

  const row = existing as IdempotencyRow;
  if (row.status === "completed" && row.response_body && row.response_code) {
    return { kind: "cached" as const, responseCode: row.response_code, body: row.response_body };
  }

  return { kind: "in_flight" as const };
}

export async function completeIdempotency(
  supabase: any,
  userId: string,
  routeKey: string,
  idempotencyKey: string,
  responseCode: number,
  body: Record<string, unknown>
) {
  await supabase
    .from("harne_api_idempotency")
    .update({ status: "completed", response_code: responseCode, response_body: body })
    .eq("user_id", userId)
    .eq("route_key", routeKey)
    .eq("idempotency_key", idempotencyKey);
}

export async function releaseIdempotency(
  supabase: any,
  userId: string,
  routeKey: string,
  idempotencyKey: string
) {
  await supabase
    .from("harne_api_idempotency")
    .delete()
    .eq("user_id", userId)
    .eq("route_key", routeKey)
    .eq("idempotency_key", idempotencyKey);
}
