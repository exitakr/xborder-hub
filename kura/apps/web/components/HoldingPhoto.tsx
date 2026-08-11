import { CategoryGlyph } from "./CategoryGlyph";
import type { Category } from "@oma/core";

/**
 * Thumbnail for a holding, in order of preference: the user's own photo, the
 * card's artwork, then the category glyph.
 *
 * SPEC §1.2 says never a brand's product image, and that still holds — a
 * marketplace listing photo is a seller's photograph of their own goods, and a
 * manufacturer's press shot is theirs. Card artwork is a different thing: it is
 * published by Scryfall and pokemontcg.io specifically so collection software
 * can display it, both are credited on this screen as their licences require,
 * and the picture IS the card's identity. So cards show art and everything else
 * keeps the glyph — see migration 0014.
 *
 * `signedUrl` is short-lived and produced server-side; the storage bucket is
 * private, so there is no public URL to leak. `artUrl` is the opposite: a
 * stable public URL on the source's CDN.
 */
export function HoldingPhoto({
  signedUrl,
  artUrl = null,
  category,
  alt,
  size = "md",
}: {
  signedUrl: string | null;
  artUrl?: string | null;
  category: Category;
  alt: string;
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "h-24 w-24" : "h-11 w-11";

  if (!signedUrl && artUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={artUrl}
        alt={alt}
        className={`${box} shrink-0 rounded-lg border border-line object-cover`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  if (signedUrl) {
    return (
      // Signed Supabase URLs expire, so next/image's optimiser would cache a
      // URL that later 400s. A plain <img> re-requests with a fresh signature.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={signedUrl}
        alt={alt}
        className={`${box} shrink-0 rounded-lg border border-line object-cover`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`${box} flex shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-muted`}
    >
      <CategoryGlyph category={category} className={size === "lg" ? "h-9 w-9" : "h-5 w-5"} />
    </div>
  );
}
