import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "X Border Hub のプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <>
      <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
        Legal
      </p>
      <h1 className="display font-bold text-[28px] lg:text-[36px] leading-tight text-ink mt-1 mb-3">
        プライバシーポリシー
      </h1>
      <p className="text-[12px] text-ink-faint mb-8">
        最終更新日: 2026 年 5 月 (β 版)
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        1. 取得する情報
      </h2>
      <p>
        本サービスは、利用者の登録および利用に伴い、以下の情報を
        取得します:
      </p>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>メールアドレス・パスワード (Supabase Auth で暗号化保存)</li>
        <li>表示名、年齢、所在地、業界、職種、語学スコア、スキル、年収レンジ等のプロフィール情報 (利用者が任意で入力)</li>
        <li>キャリア履歴 (国 / 会社 / 期間 / 実績)</li>
        <li>Coffee Chat 履歴、スレッド投稿、コメント、リアクション</li>
        <li>アクセスログ、IP アドレス、ブラウザ情報、Cookie</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        2. 利用目的
      </h2>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>本サービスの提供および運営</li>
        <li>マッチング / 検索結果の表示</li>
        <li>統計データの集計 (個人を特定できない形式)</li>
        <li>サービス改善および新機能開発</li>
        <li>運営からのお知らせ送信</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        3. 第三者提供
      </h2>
      <p>
        運営者は、法令に基づく場合を除き、利用者本人の同意なく個人情報を
        第三者に提供しません。
        ただし以下の場合、必要最小限の範囲で外部サービスを利用します:
      </p>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>ホスティング: Vercel Inc.</li>
        <li>認証・データベース: Supabase Inc.</li>
        <li>メール配信: Supabase / SMTP プロバイダー</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        4. 匿名化と公開範囲
      </h2>
      <p>
        会社名や正確な年収など個人を特定しうる情報は、自動匿名化
        (例:「外資系 Big Tech」「日系総合商社」) を施したうえで
        他の利用者に表示されます。詳細はマイページ →
        プライバシー設定で個別に管理できます。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        5. 利用者の権利
      </h2>
      <p>
        利用者はいつでも自身の登録情報を閲覧、修正、削除することが
        できます。アカウント削除をご希望の場合は、お問い合わせより
        ご連絡ください。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        6. Cookie の利用
      </h2>
      <p>
        本サービスは認証セッションの維持のため Cookie を使用します。
        広告・トラッキング目的の Cookie は利用していません。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        7. お問い合わせ窓口
      </h2>
      <p>
        本ポリシーに関するお問い合わせは{" "}
        <a className="text-blue underline" href="/legal/contact">
          お問い合わせ
        </a>{" "}
        からご連絡ください。
      </p>

      <p className="text-[11px] text-ink-faint mt-12 border-t border-ink/10 pt-4">
        本ポリシーは β 版のテンプレートです。正式版の公開時に詳細を
        差し替えます。
      </p>
    </>
  );
}
