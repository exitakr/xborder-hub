"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Mark a support message dealt with.
 *
 * Authorisation lives in `admin_mark_contact_handled` (migration 0011), which
 * re-checks `is_admin()` itself — the page-level check only decides what to
 * render, and a Server Action is reachable without ever rendering the page.
 */
export async function markContactHandled(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const handled = formData.get("handled") === "true";
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.rpc("admin_mark_contact_handled", { p_id: id.data, p_handled: handled });

  revalidatePath("/admin");
}

export interface RefreshState {
  ok?: boolean;
  error?: string;
  summary?: string;
}

/**
 * Run the daily price refresh now, from the browser.
 *
 * The cron endpoint authenticates with CRON_SECRET, which cannot be handed to
 * a client — so this action calls it server-side, where the secret already
 * lives, after checking the caller is an admin. Before this, triggering a
 * refresh meant a terminal and a copy-pasted bearer token, which is not
 * something that can be done from a phone.
 */
export async function refreshPricesNow(
  _prev: RefreshState,
  _formData: FormData,
): Promise<RefreshState> {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { error: "forbidden" };

  const secret = process.env.CRON_SECRET;
  if (!secret) return { error: "CRON_SECRET is not configured" };

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return { error: "NEXT_PUBLIC_SITE_URL is not configured" };

  try {
    const res = await fetch(`${base}/api/cron/refresh-prices`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const json = (await res.json()) as Record<string, unknown>;

    revalidatePath("/admin");
    revalidatePath("/portfolio");

    if (!res.ok) return { error: String(json.error ?? res.status) };
    return { ok: true, summary: JSON.stringify(json) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "request failed" };
  }
}

export interface TestEmailState {
  ok?: boolean;
  error?: string;
}

/**
 * Prove the SMTP configuration end to end, without creating a junk account.
 *
 * `shouldCreateUser: false` is the whole trick: this sends a magic link to an
 * address that ALREADY has an account, so it exercises the exact path a
 * confirmation email takes — Supabase's own mailer, with whatever SMTP the
 * project is configured for — and leaves no new user behind. Point it at your
 * own address: if the mail arrives, delivery works; if it does not, the error
 * below says why.
 *
 * The raw provider error is returned rather than a friendly message. This is an
 * admin-only diagnostic, and "Error sending confirmation email" versus a 429 is
 * exactly the distinction that decides what to go and fix.
 */
export async function sendTestEmail(
  _prev: TestEmailState,
  formData: FormData,
): Promise<TestEmailState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "invalid email address" };

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { error: "forbidden" };

  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false },
  });

  if (error) {
    console.error("[admin] test email failed:", error.message);
    return { error: error.message };
  }
  return { ok: true };
}
