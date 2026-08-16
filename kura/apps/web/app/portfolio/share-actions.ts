"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface ShareState {
  token?: string | null;
  error?: boolean;
}

/** Mint (or re-mint) a share token. See migration 0019 for what it exposes. */
export async function enableShare(): Promise<ShareState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("enable_portfolio_share");
  if (error) {
    console.error("[share] enable failed:", error.message);
    return { error: true };
  }
  revalidatePath("/portfolio");
  return { token: z.string().parse(data) };
}

export async function disableShare(): Promise<ShareState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("disable_portfolio_share");
  if (error) {
    console.error("[share] disable failed:", error.message);
    return { error: true };
  }
  revalidatePath("/portfolio");
  return { token: null };
}
