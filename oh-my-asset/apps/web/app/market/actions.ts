"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { newItemSchema } from "@oma/core";

/**
 * Did this write fail because the free plan is full?
 *
 * The trigger in migration 0015 raises P0001 with a fixed message. Matching on
 * the message rather than only the code because P0001 is Postgres's generic
 * `raise exception` code — other checks could use it, and silently routing an
 * unrelated failure to the upgrade screen would be worse than showing nothing.
 */
function isLimitReached(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error?.message?.includes("holding_limit_reached"));
}

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

  // The free-plan ceiling, raised by the trigger in migration 0015. Sending the
  // user to the plan screen is the only useful response: the item was not added
  // and no amount of retrying this form will add it.
  if (isLimitReached(error)) redirect("/plan?full=1");

  // 23505 = already held. Landing on the item page is the right outcome either way.
  if (error && error.code !== "23505") return;

  revalidatePath("/market");
  revalidatePath("/portfolio");
  redirect(`/items/${parsed.data}`);
}

export interface NewItemState {
  error?: "name" | "needsModel" | "generic";
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

  /*
   * Told apart because they ask for opposite things.
   *
   * `item_needs_model` (migration 0026) means the entry named a brand and
   * nothing else. That is not a failure to save — it is the one input this
   * product cannot price, because the search succeeds and returns the brand's
   * entire product line. "Try again later" would be a lie; what the person
   * needs is to be told to add the model name.
   */
  if (error?.message?.includes("item_needs_model")) return { error: "needsModel" };

  if (error || !itemId) return { error: "generic" };

  // Best-effort: the item exists either way, and 23505 (already held — not
  // reachable here since the row is brand new, but kept for symmetry with
  // addHolding) is not worth failing the whole action over.
  const { error: holdError } = await supabase
    .from("holdings")
    .insert({ user_id: user.id, market_item_id: itemId });

  // The catalogue row was still created and is now available to everyone, so
  // this is not rolled back — only the holding is refused.
  if (isLimitReached(holdError)) redirect("/plan?full=1");

  revalidatePath("/market");
  revalidatePath("/portfolio");
  redirect(`/items/${itemId}`);
}

/**
 * Stop holding an item, and clean up behind it.
 *
 * There was no way to do this at all: a holding could be emptied of trades but
 * the row stayed, so Browse went on reporting the item as held and the item
 * screen went on offering to record trades against it. Deleting the holding is
 * what the user means by "remove", and the transactions under it go with it —
 * they describe a position that no longer exists.
 *
 * A catalogue row the user created themselves is deleted too, but only when
 * nobody else holds it. Once a second person is tracking it, it has stopped
 * being that user's private entry and become shared reference data.
 */
export async function removeHolding(formData: FormData) {
  const parsed = z.string().uuid().safeParse(formData.get("marketItemId"));
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: holding } = await supabase
    .from("holdings")
    .select("id")
    .eq("user_id", user.id)
    .eq("market_item_id", parsed.data)
    .maybeSingle();

  if (holding) {
    // Explicit rather than relying on the FK cascade: the intent to discard the
    // trades belongs here, where someone reading it can see it.
    await supabase.from("transactions").delete().eq("holding_id", holding.id).eq("user_id", user.id);
    await supabase.from("holdings").delete().eq("id", holding.id).eq("user_id", user.id);
  }

  // The user's own private valuation for it is theirs and goes too.
  await supabase
    .from("self_reported_prices")
    .delete()
    .eq("user_id", user.id)
    .eq("market_item_id", parsed.data);

  await supabase.rpc("delete_my_market_item", { p_item_id: parsed.data });

  revalidatePath("/market");
  revalidatePath("/portfolio");
  redirect("/portfolio");
}
