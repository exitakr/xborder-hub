"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary. Deliberately shows no technical detail: a failed
 * price fetch or a database hiccup must not surface stack traces, and holdings
 * data must never reach an error screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is enough to correlate with server logs without echoing the
    // message, which can contain query values.
    console.error("render_error", error.digest);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">Please try again shortly.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Retry
      </button>
    </div>
  );
}
