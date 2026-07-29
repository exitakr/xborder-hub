"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
