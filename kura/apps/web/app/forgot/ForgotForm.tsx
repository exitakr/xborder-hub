"use client";

import { useActionState } from "react";
import type { getDict } from "@oma/core";
import { authErrorMessage } from "@/lib/auth-messages";
import { requestPasswordReset, type AuthState } from "../login/actions";

export function ForgotForm({ t }: { t: ReturnType<typeof getDict> }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  // Deliberately the same screen whether or not the address exists — the
  // wording says "if that address has an account", so the form cannot be used
  // to find out who is registered.
  if (state.notice === "reset_sent") {
    return (
      <p role="status" className="text-sm leading-relaxed text-gain">
        {t.authResetSent}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {authErrorMessage(t, state.error)}
        </p>
      )}

      <div>
        <label className="label" htmlFor="reset-email">
          {t.authEmail}
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
        />
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? t.loading : t.authResetSend}
      </button>
    </form>
  );
}
