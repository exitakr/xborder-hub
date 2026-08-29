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
    p_aliases: text("aliases"),
    // Null when blank, so clearing the box does not write 0 and suppress every
    // future price for the item.
    p_min_price: (() => {
      const raw = text("min_price");
      const n = raw === null ? NaN : Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    })(),
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

/**
 * Fold one catalogue row into another.
 *
 * Authorisation and every foreign key that has to move live in
 * `merge_market_items` (migration 0026) — a Server Action is reachable without
 * ever rendering the page that offers it, and repointing holdings from here
 * would need write access this client deliberately does not have.
 *
 * Irreversible, which is why the UI offers one button per row rather than a
 * single "merge all": a group of three is sometimes two duplicates and one
 * genuinely different item.
 */
export async function mergeItems(formData: FormData) {
  const from = z.string().uuid().safeParse(formData.get("from"));
  const into = z.string().uuid().safeParse(formData.get("into"));
  if (!from.success || !into.success || from.data === into.data) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("merge_market_items", {
    p_from: from.data,
    p_into: into.data,
  });
  if (error) console.error("[admin] merge failed:", error.message);

  revalidatePath("/admin");
  revalidatePath("/market");
  revalidatePath("/portfolio");
}

/** Settle on one spelling. The old name survives as an alias — see 0026. */
export async function renameItem(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!id.success || name.length === 0 || name.length > 120) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_rename_item", {
    p_id: id.data,
    p_name: name,
  });
  if (error) console.error("[admin] rename failed:", error.message);

  revalidatePath("/admin");
  revalidatePath("/market");
}
