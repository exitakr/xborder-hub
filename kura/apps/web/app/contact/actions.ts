"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@oma/core";

export interface ContactState {
  error?: "email" | "subject" | "body" | "generic" | "rate";
  ok?: boolean;
}

const schema = z.object({
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
});

/**
 * Record a support message.
 *
 * Writes to a table rather than sending mail: a mailto: link needs a mailbox
 * on the domain and somebody watching it, and an emailed message arrives
 * detached from the account it is about.
 *
 * Goes through `submit_contact` rather than inserting directly. The function
 * takes `user_id` from the session inside the database, so this layer cannot
 * attribute a message to the wrong account even by mistake, and it throttles —
 * which matters because the anon key is public, so this action was never the
 * only way to reach the table. See migration 0022.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (path === "email") return { error: "email" };
    if (path === "subject") return { error: "subject" };
    if (path === "body") return { error: "body" };
    return { error: "generic" };
  }

  const localeRaw = formData.get("locale");
  const locale = typeof localeRaw === "string" && isLocale(localeRaw) ? localeRaw : "ja";

  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_contact", {
    p_email: parsed.data.email,
    p_subject: parsed.data.subject,
    p_body: parsed.data.body,
    p_locale: locale,
  });

  // Told apart from a failure, because they call for opposite reactions: one
  // asks the sender to wait, the other asks them to try again now.
  if (error?.message?.includes("contact_rate_limited")) return { error: "rate" };

  if (error) {
    // A support message that fails to store is lost with nothing to show for
    // it — the sender sees a generic failure and there is no mailbox holding a
    // copy. Logging the cause is the only way the operator learns that, say,
    // the contact table was never created.
    console.error("contact_messages insert failed", error.message);
    return { error: "generic" };
  }
  return { ok: true };
}
