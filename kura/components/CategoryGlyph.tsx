import type { Category } from "@/lib/types";

/**
 * Self-drawn category glyphs used as the image fallback.
 *
 * SPEC §1.2: the app must never ship official product imagery. These abstract
 * shapes are original artwork, so they carry no third-party rights — the only
 * photographs in the product are ones the user took themselves.
 */
const PATHS: Record<Category, string> = {
  // rounded card outline
  pokemon: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 4h8M8 11h8M8 15h5",
  // two stacked cards
  tcg: "M9 4h9a2 2 0 0 1 2 2v11M6 7h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z",
  // watch case and lugs
  watch: "M12 8v4l2.5 1.5M9 3h6l-.5 3.2M9 21h6l-.5-3.2M12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
  // handbag with handle
  bag: "M4 8h16l-1.2 12H5.2L4 8Zm4 0V6a4 4 0 0 1 8 0v2",
  // sneaker profile
  sneaker: "M3 15h12l4-2.5a3 3 0 0 1 2 2.8V18H3v-3Zm0 0V9l3 1 2 3m2-1.6 2 1.2",
};

export function CategoryGlyph({
  category,
  className = "h-6 w-6",
}: {
  category: Category;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[category]} />
    </svg>
  );
}
