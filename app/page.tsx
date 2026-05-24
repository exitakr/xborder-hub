import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "X Border Hub",
};

/**
 * Root landing. Kept intentionally minimal — a static HTML page that
 * cannot fail to prerender, plus links into the app. Once Vercel
 * confirms this serves correctly, app/page.tsx can be restored to
 * render the full HomeClient.
 */
export default function RootPage() {
  return (
    <main className="container-app py-10 lg:py-16 relative z-10">
      <h1 className="display font-bold text-[32px] lg:text-[44px] leading-tight text-ink">
        X Border Hub
      </h1>
      <p className="text-[14px] text-ink-soft mt-3 leading-relaxed">
        Global Career Path · crossing borders, one career at a time.
      </p>

      <div className="mt-8 flex flex-col gap-3 max-w-sm">
        <Link href="/home" className="btn-primary">
          ホームへ
        </Link>
        <Link href="/search" className="btn-secondary">
          キャリアを検索する
        </Link>
        <Link href="/threads" className="btn-secondary">
          コミュニティを見る
        </Link>
        <Link href="/login" className="btn-secondary">
          ログイン / 新規登録
        </Link>
      </div>

      <p className="serif-it text-[14px] text-ink-faint mt-12">
        crossing borders, one career at a time.
      </p>
    </main>
  );
}
