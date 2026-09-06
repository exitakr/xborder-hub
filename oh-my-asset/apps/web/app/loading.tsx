/**
 * Skeleton shown while a server page streams. Shapes mirror the portfolio
 * layout so the transition does not jump.
 */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-line/60" />
      <div className="h-32 animate-pulse rounded-xl bg-line/60" />
      <div className="h-20 animate-pulse rounded-xl bg-line/60" />
      <div className="h-14 animate-pulse rounded-xl bg-line/60" />
    </div>
  );
}
