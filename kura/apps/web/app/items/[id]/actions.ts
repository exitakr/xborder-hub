"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { priceReportSchema, selfReportedPriceSchema, transactionSchema } from "@oma/core";
import { netQuantity } from "@oma/core";

export interface TxState {
  error?: "future_date" | "quantity" | "price" | "oversell" | "generic";
  ok?: boolean;
}

/**
 * Create or update a transaction.
 *
 * Every rule the client enforces is re-checked here, because the client form is
 * not a security boundary. The oversell check in particular has to happen
 * server-side: it depends on rows the client cannot be trusted to report.
 */
export async function saveTransaction(_prev: TxState, formData: FormData): Promise<TxState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "generic" };

  const parsed = transactionSchema.safeParse({
    holdingId: formData.get("holdingId"),
    type: formData.get("type"),
    tradedOn: formData.get("tradedOn"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "future_date") return { error: "future_date" };
    if (issue?.path.includes("quantity")) return { error: "quantity" };
    if (issue?.path.includes("unitPrice")) return { error: "price" };
    return { error: "generic" };
  }

  const input = parsed.data;
  const editingId = z.string().uuid().safeParse(formData.get("transactionId"));

  // Confirm the holding belongs to the caller before touching anything.
  const { data: holding } = await supabase
    .from("holdings")
    .select("id, market_item_id")
    .eq("id", input.holdingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!holding) return { error: "generic" };

  // Selling more than is held would make quantity negative (SPEC §6.4).
  if (input.type === "sell") {
    const { data: existing } = await supabase
      .from("transactions")
      .select("id, type, traded_on, quantity, unit_price")
      .eq("holding_id", input.holdingId)
      .eq("user_id", user.id);

    const others = (existing ?? [])
      .filter((tx) => !(editingId.success && tx.id === editingId.data))
      .map((tx) => ({
        id: tx.id as string,
        type: tx.type as "buy" | "sell",
        tradedOn: tx.traded_on as string,
        quantity: tx.quantity as number,
        unitPrice: Number(tx.unit_price),
      }));

    if (input.quantity > netQuantity(others)) return { error: "oversell" };
  }

  const row = {
    holding_id: input.holdingId,
    user_id: user.id,
    type: input.type,
    traded_on: input.tradedOn,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    currency: input.currency,
  };

  const { error } = editingId.success
    ? await supabase
        .from("transactions")
        .update(row)
        .eq("id", editingId.data)
        .eq("user_id", user.id)
    : await supabase.from("transactions").insert(row);

  if (error) return { error: "generic" };

  revalidatePath(`/items/${holding.market_item_id}`);
  revalidatePath("/portfolio");
  return { ok: true };
}

export async function deleteTransaction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("transactionId"));
  const itemId = z.string().uuid().safeParse(formData.get("marketItemId"));
  if (!id.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // The user_id filter is redundant given RLS, and kept deliberately: it means
  // a policy regression cannot turn into cross-user deletion.
  await supabase.from("transactions").delete().eq("id", id.data).eq("user_id", user.id);

  if (itemId.success) revalidatePath(`/items/${itemId.data}`);
  revalidatePath("/portfolio");
}

export interface ReportState {
  error?: "future_date" | "price" | "generic";
  ok?: boolean;
}

/**
 * File a realised trade as evidence for the community price.
 *
 * Deliberately not derived from the user's transactions: those are private
 * bookkeeping, and turning them into a public signal without being asked would
 * publish something the user never offered. This is the explicit act instead.
 */
export async function submitPriceReport(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "generic" };

  const parsed = priceReportSchema.safeParse({
    marketItemId: formData.get("marketItemId"),
    kind: formData.get("kind"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    tradedOn: formData.get("tradedOn"),
    venue: formData.get("venue"),
    condition: formData.get("condition"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "future_date") return { error: "future_date" };
    if (issue?.path.includes("price")) return { error: "price" };
    return { error: "generic" };
  }

  const input = parsed.data;

  const { error } = await supabase.from("price_reports").insert({
    market_item_id: input.marketItemId,
    user_id: user.id,
    kind: input.kind,
    price: input.price,
    currency: input.currency,
    traded_on: input.tradedOn,
    venue: input.venue,
    condition: input.condition,
  });

  if (error) return { error: "generic" };

  revalidatePath(`/items/${input.marketItemId}`);
  return { ok: true };
}

export async function deletePriceReport(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("reportId"));
  const itemId = z.string().uuid().safeParse(formData.get("marketItemId"));
  if (!id.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("price_reports").delete().eq("id", id.data).eq("user_id", user.id);

  if (itemId.success) revalidatePath(`/items/${itemId.data}`);
}

export interface ValuationState {
  error?: "future_date" | "price" | "source" | "generic";
  ok?: boolean;
}

/**
 * Save the user's own valuation for an item nothing prices automatically.
 *
 * Upserted on (user, item): this is a standing figure that gets revised, not a
 * log of what someone used to think it was worth.
 */
export async function saveSelfReportedPrice(
  _prev: ValuationState,
  formData: FormData,
): Promise<ValuationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "generic" };

  const parsed = selfReportedPriceSchema.safeParse({
    marketItemId: formData.get("marketItemId"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    source: formData.get("source"),
    asOf: formData.get("asOf"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "future_date") return { error: "future_date" };
    if (issue?.path.includes("price")) return { error: "price" };
    if (issue?.path.includes("source")) return { error: "source" };
    return { error: "generic" };
  }

  const input = parsed.data;

  const { error } = await supabase.from("self_reported_prices").upsert(
    {
      user_id: user.id,
      market_item_id: input.marketItemId,
      price: input.price,
      currency: input.currency,
      source: input.source,
      as_of: input.asOf,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,market_item_id" },
  );

  if (error) return { error: "generic" };

  revalidatePath(`/items/${input.marketItemId}`);
  revalidatePath("/portfolio");
  return { ok: true };
}

export async function deleteSelfReportedPrice(formData: FormData) {
  const itemId = z.string().uuid().safeParse(formData.get("marketItemId"));
  if (!itemId.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("self_reported_prices")
    .delete()
    .eq("user_id", user.id)
    .eq("market_item_id", itemId.data);

  revalidatePath(`/items/${itemId.data}`);
  revalidatePath("/portfolio");
}

/** Record the storage path of a photo the browser has already uploaded. */
export async function savePhotoPath(formData: FormData) {
  const holdingId = z.string().uuid().safeParse(formData.get("holdingId"));
  const path = z.string().max(300).safeParse(formData.get("photoPath"));
  const itemId = z.string().uuid().safeParse(formData.get("marketItemId"));
  if (!holdingId.success || !path.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // The path must live under the caller's own folder, matching the storage
  // policy. Without this a user could point their row at someone else's object.
  if (!path.data.startsWith(`${user.id}/`)) return;

  await supabase
    .from("holdings")
    .update({ photo_path: path.data })
    .eq("id", holdingId.data)
    .eq("user_id", user.id);

  if (itemId.success) revalidatePath(`/items/${itemId.data}`);
  revalidatePath("/portfolio");
}
