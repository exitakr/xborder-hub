"use client";

/**
 * Thin event-tracking facade. No-ops unless PostHog has been initialized
 * by AnalyticsProvider (i.e. NEXT_PUBLIC_POSTHOG_KEY is set). Import this
 * from client components only.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  try {
    // posthog-js attaches itself to the module singleton; require lazily so
    // pages that never track don't pay the import cost.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const posthog = require("posthog-js").default as {
      __loaded?: boolean;
      capture: (e: string, p?: Record<string, unknown>) => void;
    };
    if (posthog.__loaded) posthog.capture(event, properties);
  } catch {
    // posthog-js not installed / not initialized — silently skip.
  }
}
