import { NextResponse } from "next/server";
import type { HarneErrorCode } from "./contracts";

export function errorResponse(
  code: HarneErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return NextResponse.json({ error: { code, message, ...details } }, { status });
}

export function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Harne request failed.";
}
