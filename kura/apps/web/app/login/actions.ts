"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Why an auth attempt failed, in terms the form can act on.
 *
 * One opaque "error" used to cover every case, and the form rendered it as
 * "could not save, try again shortly". That message is wrong for almost every
 * real cause: a rate-limited confirmation email does not resolve by retrying
 * immediately, and a rejected password never resolves by waiting. Signup
 * failures are the most expensive failures this product has — they are the
 * users it never gets — so each cause the user can actually do something about
 * gets its own message.
 */
export type AuthError =
  | "invalid"
  | "rate"
  | "weak_password"
  | "email"
  | "credentials"
  | "unconfirmed";

export interface AuthState {
  error?: AuthError;
  notice?: string;
  /** Echoed back so the confirmation screen can name the address it went to. */
  email?: string;
}

/**
 * Map a Supabase auth failure onto something actionable.
 *
 * Matched on both `code` and message text: the codes are stable in recent
 * versions of GoTrue but were not always present, and a mis-classified error
 * degrades to the generic message rather than to a wrong one.
 */
function classify(error: { code?: string; status?: number; message?: string }): AuthError {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  // 429: the built-in SMTP allows only a few messages an hour. This is the most
  // common reason a second signup on the same project fails, and it is
  // invisible without saying so.
  if (error.status === 429 || code === "over_email_send_rate_limit" || message.includes("rate limit")) {
    return "rate";
  }
  if (code === "weak_password" || message.includes("password")) return "weak_password";
  if (code === "email_address_invalid" || code === "email_address_not_authorized") return "email";
  if (code === "email_not_confirmed") return "unconfirmed";
  if (code === "invalid_credentials") return "credentials";
  return "invalid";
}

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

/** Safe internal redirect target — never trust `next` from the query string. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/portfolio";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const kind = classify(error);
    // "Not confirmed yet" is safe to say and is the difference between a user
    // who gives up and one who goes and opens the email. Everything else stays
    // one generic credentials message, so the form cannot be used to enumerate
    // which addresses are registered.
    return { error: kind === "unconfirmed" ? "unconfirmed" : "credentials", email: parsed.data.email };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials
    .extend({ displayName: z.string().trim().min(1).max(60) })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      displayName: formData.get("displayName"),
    });
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  });

  if (error) {
    // Logged because the user is shown a deliberately non-technical message,
    // and without this the operator has no way to tell a rate limit from a
    // misconfigured SMTP sender.
    console.error("[auth] signUp failed:", error.message);
    return { error: classify(error), email: parsed.data.email };
  }

  // When the project has email confirmation switched off, signUp returns a live
  // session. Telling that user to go and check their email would strand them
  // waiting for a message that is never sent, so send them straight in.
  if (data.session) redirect("/portfolio");

  return { notice: "confirm", email: parsed.data.email };
}

export async function sendMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback` },
  });

  if (error) {
    console.error("[auth] magic link failed:", error.message);
    return { error: classify(error), email: email.data };
  }
  return { notice: "magic", email: email.data };
}

/**
 * Send the confirmation email again.
 *
 * `resend` rather than a second `signUp`: signing up again with an existing
 * address either errors or silently does nothing depending on project
 * settings, which is exactly the dead end this exists to fix.
 *
 * The response is identical whether or not the address has an account, so this
 * cannot be used to test which addresses are registered.
 */
export async function resendConfirmation(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback` },
  });

  if (error) {
    console.error("[auth] resend failed:", error.message);
    // A rate limit is worth saying out loud — it tells the user to wait rather
    // than to keep pressing. Anything else reports success regardless, so the
    // form cannot reveal whether the address exists.
    const kind = classify(error);
    if (kind === "rate") return { error: "rate", email: email.data };
  }

  return { notice: "resent", email: email.data };
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const next = safeNext(formData.get("next"));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

/** Request origin, so redirects work in preview deployments too. */
async function origin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
