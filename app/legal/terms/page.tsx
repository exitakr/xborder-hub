import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
  description: "X Border Hub の利用規約",
};

const LAST_UPDATED = "2026 年 6 月 16 日";

export default function TermsPage() {
  return (
    <>
      <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
        Legal
      </p>
      <h1 className="display font-bold text-[28px] lg:text-[36px] leading-tight text-ink mt-1 mb-3">
        利用規約
      </h1>
      <p className="text-[12px] text-ink-faint mb-8">
        最終更新日: {LAST_UPDATED}
      </p>

      <p className="leading-relaxed">
        本利用規約(以下「本規約」)は、X Border Hub(以下「本サービス」)の
        提供条件および本サービスの利用に関わる本サービス運営者(以下「運営者」)と
        利用者との間の権利義務関係を定めるものです。本サービスをご利用いただく
        にあたっては、本規約の全文をご確認のうえ、同意いただいたものとみなします。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 1 条(適用)
      </h2>
      <ol className="list-decimal pl-6 space-y-1 my-3">
        <li>本規約は本サービスの提供条件および利用に関する一切の関係に適用されます。</li>
        <li>
          運営者が本サービス上で随時掲載する利用上のルール・ガイドライン等
          (以下総称して「個別規定」)は、本規約の一部を構成するものとします。
        </li>
        <li>
          本規約と個別規定の内容が異なる場合は、個別規定が優先して適用されます。
        </li>
      </ol>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 2 条(利用登録)
      </h2>
      <ol className="list-decimal pl-6 space-y-1 my-3">
        <li>
          登録希望者が運営者の定める方法により利用登録を申請し、運営者がこれを
          承認することで利用契約が成立するものとします。
        </li>
        <li>
          運営者は、登録希望者に以下の事由があると判断した場合、登録申請を
          承認しないことがあり、その理由については一切の開示義務を負いません:
        </li>
      </ol>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>虚偽の事項を届け出た場合</li>
        <li>本規約違反により過去に利用停止処分を受けた者からの申請である場合</li>
        <li>その他、運営者が利用登録を相当でないと判断した場合</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 3 条(アカウント管理)
      </h2>
      <ol className="list-decimal pl-6 space-y-1 my-3">
        <li>
          利用者は、自己の責任において本サービスのメールアドレス・パスワードを
          管理するものとし、第三者に譲渡・貸与・共有することはできません。
        </li>
        <li>
          メールアドレス・パスワードの不正使用、第三者使用によって生じた損害は、
          運営者に故意または重過失がない限り、利用者が負担するものとします。
        </li>
      </ol>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 4 条(投稿コンテンツ)
      </h2>
      <ol className="list-decimal pl-6 space-y-1 my-3">
        <li>
          利用者が本サービス上に投稿したコンテンツ(プロフィール、職歴、年収
          データ、スレッド、コメント、リアクション等。以下「投稿コンテンツ」)
          の著作権その他の権利は、当該利用者に帰属します。
        </li>
        <li>
          利用者は、運営者に対し、投稿コンテンツを本サービスの提供・改善・
          マーケティング・統計分析に必要な範囲で無償・非独占的に利用(複製・
          公開・翻訳・要約・統計化を含む)することを許諾します。
        </li>
        <li>
          利用者は、投稿コンテンツについて自らが正当な権利を有していること、
          および投稿コンテンツが第三者の権利を侵害しないことを表明・保証します。
        </li>
      </ol>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 5 条(禁止事項)
      </h2>
      <p>利用者は、本サービスの利用にあたり、以下の行為をしてはなりません:</p>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>法令または公序良俗に違反する行為</li>
        <li>犯罪行為に関連する行為</li>
        <li>
          運営者・他の利用者・第三者の知的財産権・肖像権・プライバシー権・
          名誉その他の権利または利益を侵害する行為
        </li>
        <li>
          差別、誹謗中傷、脅迫、ハラスメント、ストーキング等、他者に精神的・
          肉体的苦痛を与える行為
        </li>
        <li>
          スパム投稿、無差別な勧誘、宗教・政治団体の勧誘、MLM 等の連鎖販売の
          勧誘を行う行為
        </li>
        <li>
          所属企業の秘密情報、未公開の人事情報、他者のオファー条件など、
          第三者の機密情報を本サービス上に投稿する行為
        </li>
        <li>
          他の利用者になりすます行為、または虚偽のプロフィール・経歴を
          掲載する行為
        </li>
        <li>
          本サービスのスクレイピング、リバースエンジニアリング、不正アクセス、
          ボットによる大量アクセス等、本サービスの運営を妨害する行為
        </li>
        <li>
          本サービスを通じて取得した他の利用者の個人情報を、当該利用者の同意なく
          本サービス外で利用または転載する行為
        </li>
        <li>その他、運営者が不適切と判断する行為</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 6 条(利用者間のやり取り)
      </h2>
      <ol className="list-decimal pl-6 space-y-1 my-3">
        <li>
          Coffee Chat その他、本サービスを通じた利用者間のメッセージ・面談・
          金銭授受等は、すべて当事者間の責任で行うものとします。
        </li>
        <li>
          運営者は、当事者間のトラブル(キャンセル、約束不履行、不適切な言動、
          金銭トラブル等)について、原則として一切関与せず、当事者間で解決
          いただくものとします。
        </li>
        <li>
          ただし、本規約違反が認められる場合、運営者は当該利用者のアカウント
          停止・コンテンツ削除等の措置をとることがあります。
        </li>
      </ol>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 7 条(投稿の削除・アカウント停止)
      </h2>
      <p>
        運営者は、利用者が本規約に違反したと判断した場合、事前の通知なく
        投稿コンテンツの削除、アカウントの一時停止、利用契約の解除等の措置を
        とることができます。これにより利用者または第三者に生じた損害について、
        運営者は責任を負いません。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 8 条(本サービスの提供の停止・中断)
      </h2>
      <ol className="list-decimal pl-6 space-y-1 my-3">
        <li>
          運営者は、以下の場合に事前の通知なく本サービスの全部または一部の
          提供を停止・中断することができます:
        </li>
      </ol>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>本サービスにかかるシステムの保守・更新を行う場合</li>
        <li>地震・落雷・火災・停電・天災等の不可抗力により提供が困難な場合</li>
        <li>システム・通信回線等の障害・誤動作・不正アクセスがあった場合</li>
        <li>その他、運営者が停止・中断を必要と判断した場合</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 9 条(免責事項)
      </h2>
      <ol className="list-decimal pl-6 space-y-1 my-3">
        <li>
          本サービスに掲載されているキャリア情報、年収レンジ、コミュニティ
          投稿等は、利用者からの自己申告に基づくものであり、運営者はその
          正確性・完全性・有用性・最新性を一切保証しません。
        </li>
        <li>
          本サービスは「現状有姿」で提供され、商品性・特定目的への適合性・
          第三者の権利を侵害しないことについて明示・黙示を問わずいかなる
          保証も行いません。
        </li>
        <li>
          運営者は、本サービスに関して利用者に生じた損害について、運営者の
          故意または重過失による場合を除き、一切の責任を負いません。
        </li>
        <li>
          消費者契約法に基づき運営者の責任が完全に免責されない場合、運営者の
          責任は、当該損害が生じた直近 1 ヶ月間に利用者が運営者に対して
          支払った金額を上限とします。
        </li>
      </ol>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 10 条(プライバシー)
      </h2>
      <p>
        運営者は、利用者の個人情報を別途定める
        {" "}
        <a className="text-blue underline" href="/legal/privacy">
          プライバシーポリシー
        </a>
        {" "}
        に従って取り扱うものとし、利用者は本サービス利用にあたり当該ポリシー
        にも同意したものとみなされます。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 11 条(規約の変更)
      </h2>
      <p>
        運営者は、必要と判断した場合、利用者への事前通知なく本規約を変更
        することができます。重要な変更については、本サービス上での告知または
        登録メールアドレス宛の通知により周知します。変更後の規約は、本サービス
        上に表示した時点から効力を生じるものとし、利用者が変更後に本サービスを
        利用した場合、変更後の規約に同意したものとみなします。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 12 条(連絡方法)
      </h2>
      <p>
        本サービスに関する利用者からの問い合わせ・連絡は{" "}
        <a className="text-blue underline" href="/legal/contact">
          お問い合わせフォーム
        </a>
        {" "}より受け付けます。運営者から利用者への連絡は、本サービス上の通知
        または登録メールアドレス宛のメール送信により行います。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 13 条(準拠法・裁判管轄)
      </h2>
      <ol className="list-decimal pl-6 space-y-1 my-3">
        <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
        <li>
          本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の
          専属的合意管轄裁判所とします。
        </li>
      </ol>

      <p className="text-[11px] text-ink-faint mt-12 border-t border-ink/10 pt-4 leading-relaxed">
        本規約は β 版です。本サービスは現時点では会員登録のみで全ての機能
        (スレッド投稿・コメント・Coffee Chat・年収データ閲覧)を無料で
        ご利用いただけます。将来的に求人広告等の B2B 機能を提供する場合、
        本規約に有償サービス条項・特定商取引法に基づく表記を追加し、
        既存利用者には事前に通知します。ご質問は{" "}
        <a className="text-blue underline" href="/legal/contact">
          お問い合わせ
        </a>
        {" "}よりご連絡ください。
      </p>
    </>
  );
}
