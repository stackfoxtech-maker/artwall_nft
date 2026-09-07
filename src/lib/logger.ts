/**
 * Minimal structured logger. Emits one JSON line per event so a log drain
 * (Axiom / Better Stack / Datadog) can parse it.
 *
 * Error reporting to Sentry is intentionally NOT wired here — importing the
 * Sentry SDK into a module that every route uses pulls the whole OpenTelemetry
 * graph into every server bundle. Add Sentry via `npx @sentry/wizard` when
 * ready; it configures capture through instrumentation + withSentryConfig
 * without touching app code. (docs/production-readiness.md §09)
 */
type Level = "debug" | "info" | "warn" | "error";

interface Fields {
  [key: string]: unknown;
}

function emit(level: Level, msg: string, fields: Fields = {}) {
  const line = JSON.stringify({
    level,
    msg,
    time: new Date().toISOString(),
    ...fields,
  });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, f?: Fields) => emit("debug", msg, f),
  info: (msg: string, f?: Fields) => emit("info", msg, f),
  warn: (msg: string, f?: Fields) => emit("warn", msg, f),
  error: (msg: string, f?: Fields) => emit("error", msg, f),
};

/** Generates a short correlation id for a request. */
export function requestId(): string {
  return crypto.randomUUID().slice(0, 8);
}
