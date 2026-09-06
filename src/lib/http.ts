import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { log } from "./logger";

/** Stable, client-safe error codes. Never leak internal messages. */
export type ApiErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "rate_limited"
  | "payload_too_large"
  | "unsupported_media_type"
  | "conflict"
  | "upstream_error"
  | "internal_error";

const STATUS: Record<ApiErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  validation_failed: 422,
  rate_limited: 429,
  payload_too_large: 413,
  unsupported_media_type: 415,
  conflict: 409,
  upstream_error: 502,
  internal_error: 500,
};

export function apiError(
  code: ApiErrorCode,
  opts: { details?: unknown; reqId?: string } = {},
) {
  return NextResponse.json(
    { error: { code, details: opts.details, reqId: opts.reqId } },
    { status: STATUS[code] },
  );
}

/** Wraps a route handler: logs, converts thrown errors to safe responses. */
export function handleRouteError(
  err: unknown,
  ctx: { route: string; reqId: string },
) {
  if (err instanceof ZodError) {
    return apiError("validation_failed", {
      details: err.flatten(),
      reqId: ctx.reqId,
    });
  }
  log.error("unhandled route error", {
    route: ctx.route,
    reqId: ctx.reqId,
    err: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  return apiError("internal_error", { reqId: ctx.reqId });
}
