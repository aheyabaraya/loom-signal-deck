import { NextResponse } from "next/server";

export type MarketingErrorCode =
  | "MARKETING_DISABLED"
  | "MARKETING_NOT_CONFIGURED"
  | "MARKETING_AUTH_REQUIRED"
  | "MARKETING_INVALID_INPUT"
  | "MARKETING_FORBIDDEN"
  | "MARKETING_DEPENDENCY_UNAVAILABLE"
  | "PAYMENTS_DISABLED";

export function marketingErrorResponse(code: MarketingErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
