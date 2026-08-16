"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Publish a user-added item to the shared catalogue, correcting it on the way.
 *
 * Authorisation lives in `admin_approve_item`, which re-checks `is_admin()` in
 * the database — a Server Action is reachable without ever rendering the page
 * that offers it.
 */
export async function approveItem(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const text = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const supabase = await createClient();
  await supabase.rpc("admin_approve_item", {
    p_id: id.data,
    p_name: text("name"),
    p_detail: text("detail"),
    p_identifier: text("identifier"),
    p_search_query: text("search_query"),
    p_category: text("category"),
  });

  revalidatePath("/admin");
  revalidatePath("/market");
}

/** Leave it private to its creator. Never deletes — somebody is holding it. */
export async function rejectItem(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.rpc("admin_reject_item", { p_id: id.data, p_note: null });
  revalidatePath("/admin");
}
