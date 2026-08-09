import type { Metadata } from "next";
import { getDict } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

/**
 * Open to signed-out visitors as well: someone who cannot sign in is exactly
 * the person most likely to need support, and a contact page behind the login
 * wall would be unreachable to them.
 */
export default async function ContactPage() {
  const locale = await getLocale();
  const t = getDict(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.ctTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.ctLead}</p>
      </div>

      <ContactForm t={t} locale={locale} defaultEmail={user?.email ?? ""} />
    </div>
  );
}
