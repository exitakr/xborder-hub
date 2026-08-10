import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@oma/core";
import { optionalProfile } from "@/lib/profile";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { convert, formatMoney, heldItemIds, loadFxRates, searchItems } from "@oma/core";
import { CATEGORIES, CATEGORY_LABEL_KEY, isCategory } from "@oma/core";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { AddItemForm } from "./AddItemForm";
import { SubmitButton } from "@/components/SubmitButton";
import { addHolding } from "./actions";

export const metadata: Metadata = { title: "Browse" };

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; c?: string }>;
}) {
  const profile = await optionalProfile();
  const locale = profile?.locale ?? (await getLocale());
  const currency = profile?.currency ?? "JPY";
  const t = getDict(locale);
  const { q, c } = await searchParams;

  const category = isCategory(c) ? c : null;
  const term = (q ?? "").trim().slice(0, 80);

  const supabase = await createClient();

  const [items, held, fx] = await Promise.all([
    searchItems(supabase, { term, category }),
    profile ? heldItemIds(supabase, profile.userId) : Promise.resolve(new Set<string>()),
    loadFxRates(supabase),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">{t.mkTitle}</h1>

      <form method="get" role="search" className="flex gap-2">
        {category && <input type="hidden" name="c" value={category} />}
        <input
          type="search"
          name="q"
          defaultValue={term}
          placeholder={t.mkSearch}
          aria-label={t.mkSearch}
          className="field"
        />
        <button type="submit" className="btn-secondary shrink-0">
          {t.mkTitle}
        </button>
      </form>

      {/* Above the search box: someone who already knows they own something
          Browse does not have should not have to search for it first, find
          nothing, and only then discover this is where to add it. Adding
          writes to an account, so a visitor is offered one instead. */}
      {profile ? (
        <AddItemForm t={t} defaultCategory={category ?? undefined} />
      ) : (
        <Link href="/signup" className="btn-secondary w-full">
          {t.mkAddOwn}
        </Link>
      )}

      <nav aria-label={t.mkAll} className="flex flex-wrap gap-2">
        <FilterChip href={term ? `/market?q=${encodeURIComponent(term)}` : "/market"} active={!category}>
          {t.mkAll}
        </FilterChip>
        {CATEGORIES.map((cat) => (
          <FilterChip
            key={cat}
            href={`/market?c=${cat}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
            active={category === cat}
          >
            <CategoryGlyph category={cat} className="mr-1.5 h-3.5 w-3.5" />
            {t[CATEGORY_LABEL_KEY[cat]]}
          </FilterChip>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="space-y-4 py-8 text-center">
          <p className="text-sm text-muted">{t.mkNoResults}</p>
          {term && profile && (
            <div className="mx-auto max-w-sm text-left">
              <AddItemForm
                t={t}
                defaultName={term}
                defaultCategory={category ?? undefined}
                open
              />
            </div>
          )}
          {term && !profile && (
            <Link href="/signup" className="btn-primary">
              {t.mkAddOwn}
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => {
            const price = convert(item.current_price, item.currency, currency, fx);
            const owned = held.has(item.id);

            return (
              <li key={item.id} className="card flex items-center gap-3 p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-muted">
                  <CategoryGlyph category={item.category} className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/items/${item.id}`}
                    className="block truncate rounded text-sm font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="truncate text-xs text-muted">{item.detail ?? item.identifier}</p>
                  <p className="tnum mt-0.5 text-sm">
                    {price === null ? (
                      <span className="text-muted">{t.mkNoPrice}</span>
                    ) : (
                      formatMoney(price, currency, locale)
                    )}
                  </p>
                </div>

                {owned ? (
                  <span className="chip shrink-0">{t.mkAdded}</span>
                ) : profile ? (
                  <form action={addHolding} className="shrink-0">
                    <input type="hidden" name="marketItemId" value={item.id} />
                    <SubmitButton
                      pendingLabel={t.loading}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      {t.mkAdd}
                    </SubmitButton>
                  </form>
                ) : (
                  <Link
                    href="/signup"
                    className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
                  >
                    {t.mkAdd}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`chip ${active ? "chip-active" : "hover:border-ink hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}
