"use client";

import { useActionState } from "react";
import type { getDict } from "@oma/core";
import { authErrorMessage } from "@/lib/auth-messages";
import type { AuthState } from "@/app/login/actions";

/**
 * "Send it again" for a confirmation email that did not arrive.
 *
 * Without this, a message lost to a spam filter or a rate limit ends the
 * signup permanently: the account exists, so signing up again fails, and
 * signing in fails too because the address is unconfirmed. That is a dead end
 * a user cannot get out of on their own, and it is invisible to us.
 *
 * Rate-limit errors are shown rather than hidden, since "wait a few minutes"
 * is the actual instruction and a silent no-op would just be pressed again.
 */
export function ResendConfirmation({
  t,
  email,
  action,
}: {
  t: ReturnType<typeof getDict>;
  email: string;
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, submit, pending] = useActionState<AuthState, FormData>(action, {});

  if (state.notice === "resent") {
    return <p className="text-xs text-gain">{t.authResent}</p>;
  }

  return (
    <form action={submit} className="space-y-2">
      <input type="hidden" name="email" value={email} />
      {state.error && (
        <p role="alert" className="text-xs text-loss">
          {authErrorMessage(t, state.error)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || email.length === 0}
        className="btn-secondary w-full text-sm"
      >
        {pending ? t.loading : t.authResend}
      </button>
    </form>
  );
}
