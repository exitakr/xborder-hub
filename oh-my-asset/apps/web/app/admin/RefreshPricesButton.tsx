"use client";

import { useActionState } from "react";
import type { getDict } from "@oma/core";
import { refreshPricesNow, type RefreshState } from "./actions";

/**
 * Trigger the price refresh without a terminal.
 *
 * The run can take most of a minute, so the pending label says what is
 * happening rather than just disabling the button, and the raw response is
 * kept visible: when a refresh returns nothing useful, the per-source
 * breakdown in that JSON is the only thing that says why.
 */
export function RefreshPricesButton({ t }: { t: ReturnType<typeof getDict> }) {
  const [state, action, pending] = useActionState<RefreshState, FormData>(
    refreshPricesNow,
    {},
  );

  return (
    <div className="space-y-2">
      <form action={action}>
        <button type="submit" disabled={pending} className="btn-secondary">
          {pending ? t.adRefreshRunning : t.adRefreshNow}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-xs text-loss">
          {state.error}
        </p>
      )}

      {state.ok && state.summary && (
        <pre className="overflow-x-auto rounded-lg bg-canvas px-3 py-2 text-[11px] leading-relaxed text-muted">
          {state.summary}
        </pre>
      )}
    </div>
  );
}
