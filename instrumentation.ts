import * as Sentry from "@sentry/nextjs";

/** Server-side Sentry init (nodejs + edge). No-op without SENTRY_DSN. */
export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    enableLogs: false,
  });
}

export const onRequestError = Sentry.captureRequestError;
