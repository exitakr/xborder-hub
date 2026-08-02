"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { curatedPriceSchema } from "@kura/core";

export interface CurationState {
  ok?: boolean;
  error?: boolean;
}

/**
 * Record a curated price. Authorisation lives in the `admin_set_price` function
 * (which re-checks is_admin() in the database), so a caller who reaches this
 * action without the role still cannot write.
 */
export async function setCuratedPrice(
  _prev: CurationState,
  formData: FormData,
): Promise<CurationState> {
  const parsed = curatedPriceSchema.safeParse({
    marketItemId: formData.get("marketItemId"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    sourceUrl: formData.get("sourceUrl"),
  });
  if (!parsed.success) return { error: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_price", {
    p_item_id: parsed.data.marketItemId,
    p_price: parsed.data.price,
    p_currency: parsed.data.currency,
    p_source_url: parsed.data.sourceUrl,
  });

  if (error) return { error: true };

  revalidatePath("/admin/prices");
  revalidatePath(`/items/${parsed.data.marketItemId}`);
  return { ok: true };
}
