import type { Metadata } from "next";
import { getDict } from "@kura/core";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { MarketItem } from "@kura/core";
import { CurationRow } from "./CurationRow";

export const metadata: Metadata = { title: "Price curation" };

export default async function AdminPricesPage() {
  const profile = await requireProfile();
  const t = getDict(profile.locale);

  // Authorisation is enforced again inside admin_set_price(); this check only
  // decides what to render.
  if (!profile.isAdmin) {
    return <p className="py-16 text-center text-sm text-muted">{t.adForbidden}</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("market_items")
    .select(
      "id, category, name, detail, identifier, source_type, source_url, current_price, currency, price_updated_at, data_confidence",
    )
    .eq("source_type", "curated")
    .order("price_updated_at", { ascending: true, nullsFirst: true })
    .limit(100);

  const items = (data ?? []) as MarketItem[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.adTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.adBody}</p>
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">{t.mkNoResults}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <CurationRow key={item.id} t={t} locale={profile.locale} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
