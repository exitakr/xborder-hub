import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function LandingFooter() {
  return (
    <footer className="px-5 py-10 border-t border-ink/10">
      <div className="container-app">
        <div className="flex items-center gap-2.5 mb-5">
          <LogoMark />
          <div>
            <div className="display font-bold text-[14px] text-ink">
              X Border Hub
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint">
              Global Career Path
            </div>
          </div>
        </div>
        <p className="serif-it text-[15px] text-ink-soft mb-6">
          crossing borders,
          <br />
          one career at a time.
        </p>
        <div className="grid grid-cols-2 gap-4 text-[12px] text-ink-soft">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold mb-2">
              Service
            </p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/home" className="font-semibold hover:text-ink">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/search" className="font-semibold hover:text-ink">
                  フロー検索
                </Link>
              </li>
              <li>
                <Link href="/profile" className="font-semibold hover:text-ink">
                  プロフィール例
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold mb-2">
              About
            </p>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/legal/terms"
                  className="font-semibold hover:text-ink"
                >
                  利用規約
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="font-semibold hover:text-ink"
                >
                  プライバシー
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/contact"
                  className="font-semibold hover:text-ink"
                >
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-[10px] text-ink-faint mt-7 font-semibold">
          © 2026 X Border Hub. Made in Singapore.
        </p>
      </div>
    </footer>
  );
}
