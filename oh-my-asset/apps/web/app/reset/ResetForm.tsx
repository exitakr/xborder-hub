"use client";

import { useActionState } from "react";
import type { getDict } from "@oma/core";
import { authErrorMessage } from "@/lib/auth-messages";
import { updatePassword, type AuthState } from "../login/actions";

export function ResetForm({ t }: { t: ReturnType<typeof getDict> }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {authErrorMessage(t, state.error)}
        </p>
      )}

      <div>
        <label className="label" htmlFor="new-password">
          {t.authNewPassword}
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="new-password-hint"
          className="field"
        />
        <p id="new-password-hint" className="mt-1 text-xs text-muted">
          {t.authPasswordHint}
        </p>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? t.loading : t.authNewPasswordSave}
      </button>
    </form>
  );
}
