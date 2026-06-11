"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Initializes PostHog once on mount (no-op without NEXT_PUBLIC_POSTHOG_KEY)
 * and captures a $pageview on every route change. The pageview tracker
 * reads useSearchParams, so it must live under <Suspense> or the static
 * build fails.
 */
export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!KEY || posthog.__loaded) return;
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: false, // captured manually on route change below
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  );
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!KEY || !posthog.__loaded || !pathname) return;
    const qs = searchParams.toString();
    posthog.capture("$pageview", {
      $current_url:
        window.location.origin + pathname + (qs ? `?${qs}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}
