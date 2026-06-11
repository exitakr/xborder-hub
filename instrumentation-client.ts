/**
 * Browser-side Sentry init. No-op without NEXT_PUBLIC_SENTRY_DSN.
 * Loaded via dynamic import so the ~80kB Sentry client lands in an async
 * chunk after hydration instead of every page's critical JS.
 */
type RouterTransitionHook = (href: string, navigationType: string) => void;

let routerHook: RouterTransitionHook | null = null;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      tracesSampleRate: 0,
    });
    routerHook = Sentry.captureRouterTransitionStart;
  });
}

export const onRouterTransitionStart: RouterTransitionHook = (
  href,
  navigationType,
) => {
  routerHook?.(href, navigationType);
};
