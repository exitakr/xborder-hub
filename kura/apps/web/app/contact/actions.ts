"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@oma/core";

export interface ContactState {
  error?: "email" | "subject" | "body" | "generic";
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
 * detached from the account it is about. `user_id` is taken from the session
 * and never from the form — the RLS policy checks the same thing, so a
 * client-supplied id could not be used to attribute a message to someone else
 * even if this layer forgot.
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    user_id: user?.id ?? null,
    email: parsed.data.email,
    subject: parsed.data.subject,
    body: parsed.data.body,
    locale,
  });

  if (error) return { error: "generic" };
  return { ok: true };
}
