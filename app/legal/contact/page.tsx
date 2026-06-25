import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { getCurrentProfile } from "@/lib/profiles/getProfile";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "X Border Hub への問い合わせ",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [user, profile] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
  ]);

  return (
    <>
      <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
        Contact
      </p>
      <h1 className="display font-bold text-[28px] lg:text-[36px] leading-tight text-ink mt-1 mb-3">
        お問い合わせ
      </h1>
      <div className="bg-paper border border-ink/10 rounded-2xl p-5 lg:p-7 my-6 shadow-pop-sm">
        <ContactForm
          initialEmail={user?.email ?? ""}
          initialName={profile?.display_name ?? ""}
        />
      </div>

      <h2 className="display font-bold text-[18px] text-ink mt-10 mb-3">
        よくあるご質問
      </h2>
      <ul className="list-disc pl-6 space-y-2 my-3 text-[13px]">
        <li>
          <strong>アカウント削除</strong>:
          種別「アカウント削除・データ修正」を選び、登録メールアドレスを
          記載してください。投稿・コメント・プロフィールを含めて完全に
          削除します(復元不可)。
        </li>
        <li>
          <strong>プロフィール情報の修正</strong>:
          マイページから自分で編集できます。それでも問題が解消しない場合のみ
          こちらへ。
        </li>
        <li>
          <strong>不適切な投稿の通報</strong>:
          種別「不適切な投稿の通報」を選び、該当スレッド / コメントの URL を
          記載してください。
        </li>
        <li>
          <strong>取材・協業のご相談</strong>:
          種別「取材・協業」を選び、媒体名・記事公開予定日もご記載ください。
        </li>
      </ul>

      <p className="text-[11px] text-ink-faint mt-10 border-t border-ink/10 pt-4 leading-relaxed">
        本サイトのお問い合わせ内容は Supabase 上の暗号化されたデータベースに
        保存され、運営者のみが閲覧します。返信は登録いただいたメールアドレス宛
        にお送りします。詳細は{" "}
        <a className="text-blue underline" href="/legal/privacy">
          プライバシーポリシー
        </a>
        {" "}をご確認ください。
      </p>
    </>
  );
}
