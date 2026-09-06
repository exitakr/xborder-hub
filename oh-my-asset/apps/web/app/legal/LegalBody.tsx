/**
 * Shared shell for legal pages. Typography is applied here rather than with a
 * prose plugin so the app keeps zero extra Tailwind dependencies.
 */
export function LegalBody({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl py-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      <div
        className="mt-6 space-y-4 text-sm leading-relaxed text-ink
                   [&_a]:text-accent [&_a]:underline
                   [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold
                   [&_li]:ml-5 [&_li]:list-disc
                   [&_p]:text-muted
                   [&_ul]:space-y-1.5 [&_ul]:text-muted"
      >
        {children}
      </div>
    </article>
  );
}
