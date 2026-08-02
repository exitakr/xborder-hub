import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * Resolve private Storage paths into short-lived signed URLs.
 *
 * The holding-photos bucket is private, so there is no public URL to render.
 * Signing is batched in one request rather than one per row, and the result is
 * position-aligned with the input so callers can index straight into it.
 */
export function usePhotoUrls(paths: readonly (string | null)[]): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const key = paths.join("|");

  useEffect(() => {
    let active = true;
    const present = paths.filter((p): p is string => Boolean(p));

    if (present.length === 0) {
      setUrls(paths.map(() => null));
      return;
    }

    supabase.storage
      .from("holding-photos")
      .createSignedUrls(present, 60 * 10)
      .then(({ data }) => {
        if (!active) return;

        const byPath = new Map<string, string>();
        for (const row of data ?? []) {
          if (row.path && row.signedUrl) byPath.set(row.path, row.signedUrl);
        }
        setUrls(paths.map((p) => (p ? (byPath.get(p) ?? null) : null)));
      })
      .catch(() => {
        // A missing signature degrades to the category glyph, not an error state.
        if (active) setUrls(paths.map(() => null));
      });

    return () => {
      active = false;
    };
    // `key` collapses the array into a stable dependency; paths is a new array
    // on every render and would otherwise re-sign on every pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}
