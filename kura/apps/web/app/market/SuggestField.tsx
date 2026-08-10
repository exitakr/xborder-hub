"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Suggestion {
  id: string;
  name: string;
  detail: string | null;
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
 */
export function SuggestField({
  name,
  label,
  defaultValue = "",
  category,
  hint,
  pickLabel,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  category: string;
  hint: string;
  pickLabel: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [matches, setMatches] = useState<Suggestion[]>([]);
  const listId = useId();

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setMatches([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const safe = term.replace(/[,()]/g, " ");
      const { data } = await supabase
        .from("market_items")
        .select("id, name, detail")
        .eq("category", category)
        .or(`name.ilike.%${safe}%,aliases.ilike.%${safe}%`)
        .limit(6);

      if (active) setMatches((data ?? []) as Suggestion[]);
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
                  className="block truncate rounded px-1 py-1 text-sm hover:bg-surface hover:underline"
                >
                  {m.name}
                  {m.detail && <span className="ml-1.5 text-xs text-muted">{m.detail}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
