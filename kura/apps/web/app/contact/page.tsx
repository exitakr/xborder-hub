import type { Metadata } from "next";
import { getDict } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

/**
 * Open to signed-out visitors as well: someone who cannot sign in is exactly
 * the person most likely to need support, and a contact page behind the login
 * wall would be unreachable to them.
 *
 * The address field starts empty. It used to be prefilled from the session,
 * which meant an account holder's own address was on screen before they had
 * typed anything — on a shared or screen-shared machine that is a disclosure
 * nobody asked for, and it invites sending a reply to an address the person
 * did not choose for this. The message is still attributed to the account
 * server-side; the field is only about where the reply should go.
 */
export default async function ContactPage() {
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.ctTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.ctLead}</p>
      </div>

      <ContactForm t={t} locale={locale} />
    </div>
  );
}
