"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { newItemSchema } from "@oma/core";

/**
 * Add a catalogue item to the signed-in user's holdings.
 *
 * user_id is taken from the session, never from the form — a client-supplied
 * owner id is the classic way this kind of action gets abused. RLS enforces the
 * same rule again at the database level.
 */
export async function addHolding(formData: FormData) {
  const parsed = z.string().uuid().safeParse(formData.get("marketItemId"));
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("holdings")
    .insert({ user_id: user.id, market_item_id: parsed.data });

  // 23505 = already held. Landing on the item page is the right outcome either way.
  if (error && error.code !== "23505") return;

  revalidatePath("/market");
  revalidatePath("/portfolio");
  redirect(`/items/${parsed.data}`);
}

export interface NewItemState {
  error?: "name" | "generic";
  ok?: boolean;
}

/**
 * Add a catalogue row the seed catalogue does not have, then hold it — one
 * action, because a user who bothered to type a name into "add my own item"
 * is adding it in order to track it, not to leave it sitting unheld in Browse.
 *
 * The insert itself runs through `create_market_item` (migration 0008), a
 * SECURITY DEFINER function: market_items carries no authenticated-write RLS
 * policy on purpose, so a bare `.insert()` here would fail, and that failure
 * is the point — it is what stops this form from being a second way to write
 * `current_price` directly.
 */
export async function createAndHoldItem(
  _prev: NewItemState,
  formData: FormData,
): Promise<NewItemState> {
  const parsed = newItemSchema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    detail: formData.get("detail") || undefined,
    identifier: formData.get("identifier") || undefined,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path.includes("name")) return { error: "name" };
    return { error: "generic" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: itemId, error } = await supabase.rpc("create_market_item", {
    p_category: parsed.data.category,
    p_name: parsed.data.name,
    p_detail: parsed.data.detail ?? null,
    p_identifier: parsed.data.identifier ?? null,
  });

  if (error || !itemId) return { error: "generic" };

  // Best-effort: the item exists either way, and 23505 (already held — not
  // reachable here since the row is brand new, but kept for symmetry with
  // addHolding) is not worth failing the whole action over.
  await supabase.from("holdings").insert({ user_id: user.id, market_item_id: itemId });

  revalidatePath("/market");
  revalidatePath("/portfolio");
  redirect(`/items/${itemId}`);
}
