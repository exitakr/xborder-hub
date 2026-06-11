"use client";

import posthog from "posthog-js";

/**
 * Thin event-tracking facade. No-ops unless PostHog has been initialized
 * by AnalyticsProvider (i.e. NEXT_PUBLIC_POSTHOG_KEY is set). Import from
 * client components only.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  try {
    if (posthog.__loaded) posthog.capture(event, properties);
  } catch {
    // never let analytics break the product
  }
}
