import type { Category } from "@oma/core";
import { CategoryGlyph } from "./CategoryGlyph";

/**
 * A catalogue item's picture: its card artwork, or the category glyph.
 *
 * Cards get real artwork because the pricing sources publish it for exactly
 * this purpose, and because a card's picture is how you recognise it — a list
 * of six same-named printings is unreadable without one. Watches, bags,
 * sneakers and cars get the glyph: their prices come from marketplaces whose
 * images are sellers' own photographs, which are neither ours to republish nor
 * dependably the item in question.
 *
 * The glyph is a fallback rather than an absence, so a row never collapses to
 * a differently-sized box depending on whether an image happened to load.
 */
export function ItemArt({
  category,
  name,
  url,
  className = "h-11 w-11",
}: {
  category: Category;
  name: string;
  url: string | null;
  className?: string;
}) {
  if (url) {
    return (
      // Empty alt: every use of this sits directly beside the item's name as
      // text, and announcing the picture as well reads the item out twice.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        title={name}
        className={`${className} shrink-0 rounded-lg border border-line object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-muted`}
    >
      <CategoryGlyph category={category} className="h-5 w-5" />
    </div>
  );
}
