import { CategoryGlyph } from "./CategoryGlyph";
import type { Category } from "@oma/core";

/**
 * Thumbnail for a holding: the user's own photo if they uploaded one, otherwise
 * the category glyph. Never a product image from a brand (SPEC §1.2).
 *
 * `signedUrl` is short-lived and produced server-side; the storage bucket is
 * private, so there is no public URL to leak.
 */
export function HoldingPhoto({
  signedUrl,
  category,
  alt,
  size = "md",
}: {
  signedUrl: string | null;
  category: Category;
  alt: string;
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "h-24 w-24" : "h-11 w-11";

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
