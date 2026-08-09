"use client";

import { useActionState } from "react";
import type { getDict, Locale } from "@oma/core";
import { sendContactMessage, type ContactState } from "./actions";

export function ContactForm({
  t,
  locale,
  defaultEmail = "",
}: {
  t: ReturnType<typeof getDict>;
  locale: Locale;
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    {},
  );

  if (state.ok) {
    return (
      <p role="status" className="rounded-lg bg-gain/5 px-4 py-4 text-sm text-gain">
        {t.ctSent}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {state.error === "email" ? t.ctErrEmail : t.txErrGeneric}
        </p>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        <div>
          <label className="label" htmlFor="contact-email">
            {t.authEmail}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            defaultValue={defaultEmail}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="contact-subject">
            {t.ctSubject}
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            required
            maxLength={120}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="contact-body">
            {t.ctBody}
          </label>
          <textarea
            id="contact-body"
            name="body"
            required
            maxLength={4000}
            rows={7}
            className="field resize-y"
          />
        </div>

        <p className="text-xs text-muted">{t.ctPrivacy}</p>

        <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
          {pending ? t.loading : t.ctSubmit}
        </button>
      </form>
    </div>
  );
}
