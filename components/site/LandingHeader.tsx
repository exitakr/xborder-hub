import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-ink/10">
      <div className="container-app py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <div>
            <div className="display font-bold text-[15px] leading-none tracking-tight text-ink">
              X Border Hub
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint mt-0.5">
              crossing borders
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-[12px] font-bold text-ink-soft px-3 py-2"
          >
            ログイン
          </Link>
          <Link
            href="/login"
            className="bg-ink text-cream text-[12px] font-bold px-3.5 py-2 rounded-full shadow-pop-sm"
          >
            始める
          </Link>
        </div>
      </div>
    </header>
  );
}
