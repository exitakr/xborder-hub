import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "X Border Hub への問い合わせ",
};

export default function ContactPage() {
  return (
    <>
      <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
        Contact
      </p>
      <h1 className="display font-bold text-[28px] lg:text-[36px] leading-tight text-ink mt-1 mb-3">
        お問い合わせ
      </h1>
      <p className="text-[12px] text-ink-faint mb-8">
        ご質問・ご要望・取材依頼など、お気軽にどうぞ。
      </p>

      <div className="bg-paper border border-ink/10 rounded-2xl p-5 lg:p-7 my-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold mb-2">
          Email
        </p>
        <a
          href="mailto:hello@xborder-hub.example.com"
          className="display font-bold text-[18px] lg:text-[22px] text-blue underline underline-offset-2 break-all"
        >
          hello@xborder-hub.example.com
        </a>
        <p className="text-[12px] text-ink-soft mt-3 leading-relaxed">
          通常 1–3 営業日以内にご返信します。
        </p>
      </div>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        よくある問い合わせ
      </h2>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>
          <strong>アカウント削除</strong>
          : 件名「アカウント削除希望」+ 登録メールアドレスを記載
        </li>
        <li>
          <strong>プロフィール情報の修正</strong>
          : マイページから直接編集できます
        </li>
        <li>
          <strong>不適切な投稿の通報</strong>
          : 該当スレッドの URL とともにご連絡ください
        </li>
        <li>
          <strong>取材・ビジネスのご相談</strong>
          : 件名に「取材」「協業」等を含めていただけると優先対応します
        </li>
      </ul>

      <p className="text-[11px] text-ink-faint mt-12 border-t border-ink/10 pt-4">
        専用フォームは近日公開予定です。それまではメールでの受付と
        なります。
      </p>
    </>
  );
}
