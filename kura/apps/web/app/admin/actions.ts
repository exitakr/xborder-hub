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
