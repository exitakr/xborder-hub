import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  backHref?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

/**
 * Reusable header for in-app pages: back arrow + centered title + optional
 * trailing button.
 */
export function AppHeader({ backHref, title, subtitle, trailing }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-ink/10">
      <div className="container-app py-3.5 flex items-center justify-between">
        {backHref ? (
          <Link href={backHref} className="flex items-center gap-2 text-ink">
            <span className="w-9 h-9 rounded-full border-[1.5px] border-ink/15 bg-cream flex items-center justify-center">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </span>
          </Link>
        ) : (
          <span className="w-9 h-9" />
        )}
        <div className="text-center">
          <div className="display font-bold text-[15px] tracking-tight text-ink">
            {title}
          </div>
          {subtitle && (
            <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        {trailing ?? <span className="w-9 h-9" />}
      </div>
    </header>
  );
}
