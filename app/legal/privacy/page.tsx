import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "X Border Hub のプライバシーポリシー",
};

const LAST_UPDATED = "2026 年 6 月 16 日";

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
        最終更新日: {LAST_UPDATED}
      </p>

      <p className="leading-relaxed">
        X Border Hub(以下「本サービス」)の運営者(以下「運営者」)は、
        利用者の個人情報を、個人情報の保護に関する法律(個人情報保護法)
        その他の関連法令を遵守し、本ポリシーに従って適切に取り扱います。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        1. 取得する情報
      </h2>
      <p>本サービスは、利用者の登録および利用に伴い、以下の情報を取得します:</p>

      <h3 className="font-bold text-[14px] text-ink mt-4 mb-1">
        (1) 利用者が直接入力する情報
      </h3>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>メールアドレス・パスワード(パスワードはハッシュ化して保存)</li>
        <li>
          プロフィール情報(表示名、年齢、自己紹介、出身国/都市、現在の
          国/都市、業界、職種、滞在年数、VISA 種別、年収レンジ、保有スキル、
          志望キャリア、Coffee Chat 受付可否、相談可能トピック)
        </li>
        <li>キャリア履歴(国 / 会社名 / 業界 / 職種 / 在籍期間 / 実績 / 年収)</li>
        <li>年収・生活データ(基本給・賞与・家賃・貯蓄率・労働時間・満足度等)</li>
        <li>
          投稿・コメント・リアクション・スレッドの本文、Coffee Chat 申請文・
          トークルームのメッセージ、運営者へのお問い合わせ内容
        </li>
        <li>プライバシー設定(各項目の他者への公開可否)</li>
      </ul>

      <h3 className="font-bold text-[14px] text-ink mt-4 mb-1">
        (2) 自動的に取得する情報
      </h3>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>IP アドレス、ブラウザの種類・バージョン、OS、画面サイズ</li>
        <li>アクセス日時、滞在時間、参照元 URL</li>
        <li>Cookie・ローカルストレージに保存される認証セッション情報</li>
        <li>
          匿名化されたページ閲覧履歴・操作ログ(PostHog を利用する場合。
          オプトアウトはブラウザの Do Not Track 設定で可能)
        </li>
        <li>エラーログ(Sentry を利用する場合。スタックトレース・URL のみ)</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        2. 利用目的
      </h2>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>本サービスの提供および運営、本人認証、利用料金の請求(有償機能)</li>
        <li>
          検索結果・マッチング候補・Coffee Chat 候補者の表示(プライバシー設定に
          従った範囲のみ)
        </li>
        <li>
          匿名統計データの集計および公開(個人を特定できない形式に加工し、
          国別・業界別・職種別の年収中央値、職種別の英語使用率等として表示)
        </li>
        <li>サービス改善・新機能開発のための行動分析</li>
        <li>運営からの重要なお知らせ・メンテナンス情報の通知</li>
        <li>不正利用・規約違反の検出および対応</li>
        <li>お問い合わせへの返信</li>
        <li>法令に基づく場合の対応</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        3. 個人情報の管理体制
      </h2>
      <p>
        本サービスは、取得した個人情報を、漏洩・滅失・改ざん・不正アクセスから
        保護するため、以下の技術的・組織的安全管理措置を講じています:
      </p>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>
          通信の暗号化(全ページで TLS 1.2 以上を強制、HSTS を有効化)
        </li>
        <li>
          データベースの保存時暗号化(Supabase / AWS RDS の暗号化機能を利用)
        </li>
        <li>
          行レベルセキュリティ(Row Level Security)による細粒度のアクセス
          制御。利用者は原則として自身のデータのみ閲覧・編集が可能
        </li>
        <li>
          年収データ等の機微情報は、利用者 ID を返さない専用関数を介して
          月単位に丸めた匿名形式でのみ他の利用者に表示
        </li>
        <li>パスワードのソルト付きハッシュ化保存(平文では保存しない)</li>
        <li>運営者の管理者権限へのアクセスを最小限の人員に限定</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        4. 個人情報の第三者提供
      </h2>
      <p>
        運営者は、以下の場合を除き、利用者の同意を得ずに個人情報を第三者に
        提供しません:
      </p>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>法令に基づく場合</li>
        <li>人の生命・身体・財産の保護のために必要があり、本人の同意取得が困難な場合</li>
        <li>公衆衛生・児童の健全な育成の推進のために特に必要がある場合</li>
        <li>
          国の機関・地方公共団体・その委託を受けた者が法令の定める事務を
          遂行することに対して協力する必要がある場合
        </li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        5. 業務委託先(外部サービス)
      </h2>
      <p>
        本サービスの提供にあたり、以下の外部サービスに必要最小限の範囲で
        個人情報の取扱いを委託しています。各社の情報取扱方針は各社の公式
        プライバシーポリシーに従います:
      </p>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>
          <strong>Vercel Inc.</strong>(米国):ホスティング・コンテンツ配信
        </li>
        <li>
          <strong>Supabase Inc.</strong>(米国 / 利用リージョン APAC):
          認証・データベース・ファイルストレージ・Realtime 配信
        </li>
        <li>
          <strong>Resend / SMTP プロバイダー</strong>:認証メール・通知メールの送信
        </li>
        <li>
          <strong>PostHog</strong>(任意・有効時のみ):匿名化された利用状況分析
        </li>
        <li>
          <strong>Sentry</strong>(任意・有効時のみ):エラー監視
        </li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        6. 越境移転(海外への第三者提供)
      </h2>
      <p>
        上記の業務委託先のうち、Vercel および Supabase は米国に本社を置く
        事業者です。利用者の個人情報は、サービス提供のため米国その他の国を
        含む海外サーバに保存・処理される可能性があります。本サービスを
        利用することにより、利用者はこの越境移転に同意したものとみなされます。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        7. プライバシー設定と表示制御
      </h2>
      <p>
        会社名、年収、保有スキル、VISA 種別は、利用者がマイページのプライバシー
        設定で個別に公開可否を選択できます。非公開に設定した項目は、検索画面・
        プロフィール詳細画面のいずれにおいても他の利用者からは閲覧できません
        (運営者は管理目的でのみ閲覧する場合があります)。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        8. 利用者の権利
      </h2>
      <p>利用者は、運営者に対し以下を請求することができます:</p>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>保有個人データの開示</li>
        <li>保有個人データの訂正・追加・削除</li>
        <li>保有個人データの利用停止・第三者提供の停止</li>
        <li>アカウントの削除(本サービス上のプロフィール・投稿・年収データ・Coffee Chat 履歴を含めて削除)</li>
      </ul>
      <p>
        マイページから直接編集できる項目はご自身で更新ください。アカウント削除
        その他の請求は{" "}
        <a className="text-blue underline" href="/legal/contact">
          お問い合わせフォーム
        </a>
        {" "}よりご連絡ください。通常 1〜2 週間以内に対応します。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        9. Cookie の利用
      </h2>
      <p>
        本サービスは、認証セッションの維持および利用者の選好(ログイン状態、
        フィルタ設定等)を保持するため Cookie および localStorage を使用します。
        広告 ID・トラッキングピクセル等の第三者広告目的の Cookie は使用していません。
        ブラウザの設定で Cookie の無効化が可能ですが、その場合一部機能が利用
        できなくなります。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        10. 未成年の利用
      </h2>
      <p>
        本サービスは満 18 歳未満の利用を想定していません。未成年が利用する場合は
        保護者の同意を得たうえでご利用ください。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        11. ポリシーの変更
      </h2>
      <p>
        運営者は、法令の変更またはサービスの仕様変更等に伴い、本ポリシーを
        改定することがあります。重要な変更は本サービス上で告知します。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        12. お問い合わせ窓口
      </h2>
      <p>
        本ポリシーに関するお問い合わせ・開示請求等は{" "}
        <a className="text-blue underline" href="/legal/contact">
          お問い合わせフォーム
        </a>
        {" "}よりご連絡ください。
      </p>
    </>
  );
}
