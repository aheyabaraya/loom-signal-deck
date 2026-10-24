import { marketingErrorResponse } from "../../../../lib/marketing/http";

export const runtime = "nodejs";

export async function POST() {
  return marketingErrorResponse(
    "PAYMENTS_DISABLED",
    "Payments are intentionally disabled. No card or checkout data was accepted.",
    409
  );
}
