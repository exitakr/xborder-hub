"use client";

import { useActionState } from "react";
import { fill, type getDict } from "@oma/core";
import { authErrorMessage } from "@/lib/auth-messages";
import { resendConfirmation, signInWithGoogle, signUp, type AuthState } from "../login/actions";
import { ResendConfirmation } from "@/components/ResendConfirmation";

export function SignupForm({ t }: { t: ReturnType<typeof getDict> }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});

  /*
   * The confirmation step is a screen, not a one-line notice.
   *
   * This is the single highest-drop-off moment in the product: the account
   * exists but is unusable until the person finds an email and clicks it. So
   * it names the address the message went to (the commonest failure is a typo,
   * and only the user can spot it), says what happens when they click, points
   * at the spam folder, and offers a resend — because "nothing arrived" with
   * no way forward is where a new user is simply lost.
   */
  if (state.notice === "confirm") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gain">{t.authConfirmTitle}</p>
        <p className="text-sm leading-relaxed">
          {fill(t.authConfirmBody, { email: state.email ?? "" })}
        </p>
        <p className="text-xs text-muted">{t.authConfirmSpam}</p>
        <ResendConfirmation
          t={t}
          email={state.email ?? ""}
          action={resendConfirmation}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {authErrorMessage(t, state.error)}
        </p>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="label" htmlFor="displayName">
            {t.authDisplayName}
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            required
            maxLength={60}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            {t.authEmail}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            {t.authPassword}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            className="field"
          />
          <p id="password-hint" className="mt-1 text-xs text-muted">
            {t.authPasswordHint}
          </p>
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? t.loading : t.authSignUp}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogle}>
        <button type="submit" className="btn-secondary w-full">
          {t.authGoogle}
        </button>
      </form>
    </div>
  );
}
