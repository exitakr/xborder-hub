"use client";

import { useEffect, useId, useState } from "react";
import { formatMoney, type Currency, type Locale } from "@oma/core";
import { createClient } from "@/lib/supabase/client";

export interface Suggestion {
  id: string;
  name: string;
  detail: string | null;
  /** Absent on a database that has not run migration 0014 yet. */
  image_url?: string | null;
  current_price: number | null;
  currency: string | null;
}

/**
 * A model this app knows how to price, offered when the catalogue has no row
 * for it yet.
 *
 * The catalogue can only suggest what somebody has already added. `brand_models`
 * (migration 0026) knows the canonical name, the marketplace query and the price
 * band for models nobody here owns yet — so typing "シャネル" can offer the
 * actual Chanel models instead of nothing, which is the difference between
 * being refused for naming a brand and being shown the way out of it.
 */
export interface ModelSuggestion {
  id: string;
  brand: string;
  model: string;
}

/**
 * A name field that offers the catalogue first.
 *
 * Typing a free-text name is how items end up with a query no source can
 * answer — "Bottega Veneta" prices that brand's whole product line, not a bag.
 * An existing catalogue row already has a query someone tightened, so steering
 * the user onto one is worth more than any amount of parsing what they typed.
 * The field stays free text: an item genuinely not in the catalogue must still
 * be addable, which is the entire point of this form.
 *
 * Each suggestion carries its artwork and its current price. That is the whole
 * trick behind the input flow in the Japanese TCG portfolio apps, and it is not
 * decoration: the picture is what makes the right printing obvious among
 * same-named rows, and the price is what tells you the row is actually priced
 * before you commit to it — rather than after, on an item screen showing
 * "データ不足". Cards carry images; other categories fall back to the initial,
 * because marketplace listing photos are not ours to republish.
 */
export function SuggestField({
  name,
  label,
  defaultValue = "",
  category,
  hint,
  pickLabel,
  locale,
  noPriceLabel,
  modelLabel,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  category: string;
  hint: string;
  pickLabel: string;
  locale: Locale;
  noPriceLabel: string;
  modelLabel: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [matches, setMatches] = useState<Suggestion[]>([]);
  const [modelMatches, setModelMatches] = useState<ModelSuggestion[]>([]);
  const listId = useId();

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setMatches([]);
      setModelMatches([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const safe = term.replace(/[,()]/g, " ");

      const search = (columns: string) =>
        supabase
          .from("market_items")
          .select(columns)
          .eq("category", category)
          .or(`name.ilike.%${safe}%,aliases.ilike.%${safe}%`)
          .limit(6);

      // `image_url` arrives with migration 0014. Asking for it on a database
      // that has not run yet fails the whole query, and a picker that silently
      // returns nothing is far worse than one without pictures — so the
      // artwork is what gets dropped, never the suggestions.
      let { data, error } = await search(
        "id, name, detail, image_url, current_price, currency",
      );
      if (error) {
        ({ data } = await search("id, name, detail, current_price, currency"));
      }

      if (active) setMatches((data ?? []) as unknown as Suggestion[]);

      // Reference models, in parallel with the catalogue rather than instead of
      // it: an existing row is always the better answer because it already
      // carries price history, so the models are a fallback shown underneath.
      const { data: models } = await supabase
        .from("brand_models")
        .select("id, brand, model")
        .eq("category", category)
        .or(`model.ilike.%${safe}%,brand.ilike.%${safe}%,aliases.ilike.%${safe}%`)
        .limit(6);

      if (active) setModelMatches((models ?? []) as unknown as ModelSuggestion[]);
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, category]);

  return (
    <div>
      <label className="label" htmlFor={`${listId}-input`}>
        {label}
      </label>
      <input
        id={`${listId}-input`}
        name={name}
        type="text"
        required
        maxLength={120}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        className="field"
      />
      <p className="mt-1 text-xs text-muted">{hint}</p>

      {matches.length > 0 && (
        <div className="mt-2 rounded-lg border border-line bg-canvas p-2">
          <p className="px-1 pb-1.5 text-xs text-muted">{pickLabel}</p>
          <ul className="space-y-0.5">
            {matches.map((m) => (
              <li key={m.id}>
                <a
                  href={`/items/${m.id}`}
                  className="flex items-center gap-2.5 rounded px-1 py-1.5 hover:bg-surface"
                >
                  <Art name={m.name} url={m.image_url ?? null} />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{m.name}</span>
                    {m.detail && (
                      <span className="block truncate text-xs text-muted">{m.detail}</span>
                    )}
                  </span>

                  {/* Right-aligned and tabular so a column of candidates can be
                      compared down the edge rather than read one by one. */}
                  <span
                    className={`tnum shrink-0 text-xs ${
                      m.current_price === null ? "text-muted" : "font-medium"
                    }`}
                  >
                    {m.current_price === null
                      ? noPriceLabel
                      : formatMoney(
                          Number(m.current_price),
                          (m.currency ?? "USD") as Currency,
                          locale,
                        )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Only when the catalogue had nothing. Two lists of near-identical names
          is worse than one, and an existing row always wins — it already has
          price history behind it. */}
      {matches.length === 0 && modelMatches.length > 0 && (
        <div className="mt-2 rounded-lg border border-line bg-canvas p-2">
          <p className="px-1 pb-1.5 text-xs text-muted">{modelLabel}</p>
          <ul className="flex flex-wrap gap-1.5 px-1">
            {modelMatches.map((m) => (
              <li key={m.id}>
                {/* Fills the field rather than navigating: this model has no
                    catalogue row to navigate TO. Clicking it produces the exact
                    text create_market_item will recognise, which is what turns
                    "brand only" from a rejection into one tap. */}
                <button
                  type="button"
                  onClick={() => setValue(`${m.brand} ${m.model}`)}
                  className="chip hover:border-accent hover:text-accent"
                >
                  {m.brand} {m.model}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Card artwork, or the item's initial.
 *
 * A plain `<img>` rather than next/image: these are remote hosts that would
 * each need whitelisting in the Next config, and the optimiser earns nothing on
 * an image already served at thumbnail size. `loading="lazy"` keeps a list of
 * six from firing six requests before the user has finished typing.
 */
function Art({ name, url }: { name: string; url: string | null }) {
  if (!url) {
    return (
      <span
        aria-hidden="true"
        className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-line/60 text-xs font-semibold text-muted"
      >
        {name.slice(0, 1)}
      </span>
    );
  }

  return (
    // Empty alt: the name sits next to it as text, so announcing the picture
    // too would read the same item twice.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      className="h-10 w-8 shrink-0 rounded object-cover"
    />
  );
}
