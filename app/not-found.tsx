import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/site/LogoMark";

export const metadata: Metadata = {
  title: "404",
};

export default function NotFound() {
  return (
    <main className="container-narrow px-5 min-h-screen flex flex-col justify-center relative z-10 py-12">
      <div className="rise text-center">
        <LogoMark size="lg" className="inline-flex" />
        <p className="display font-bold text-[120px] leading-none text-blue mt-6 tracking-tighter">
          404
        </p>
        <p className="serif-it text-[26px] u-blue text-ink mt-4">
          道に迷いましたか?
        </p>
        <p className="text-[14px] text-ink-soft mt-6 leading-relaxed">
          お探しのページは見つかりませんでした。
          <br />
          別の経路を試してみましょう。
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/" className="btn-primary">
            ホームに戻る
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/home" className="btn-secondary">
            サービスを見る
          </Link>
        </div>

        <p className="serif-it text-[14px] text-ink-faint mt-10">
          crossing borders, one career at a time.
        </p>
      </div>
    </main>
  );
}
