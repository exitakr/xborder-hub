import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
  description: "X Border Hub の利用規約",
};

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
        最終更新日: 2026 年 5 月 (β 版)
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 1 条 (はじめに)
      </h2>
      <p>
        本利用規約 (以下「本規約」) は、X Border Hub
        (以下「本サービス」) の提供条件、および本サービスの利用に関わる
        運営者と利用者との間の権利義務関係を定めるものです。
        本サービスをご利用いただくにあたっては、本規約に同意いただいた
        ものとみなします。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 2 条 (利用登録)
      </h2>
      <p>
        本サービスにおいて、登録希望者が運営者の定める方法によって
        利用登録を申請し、運営者がこれを承認することによって、
        利用登録が完了するものとします。
        虚偽の事項を届け出た場合、運営者は登録を取り消すことが
        あります。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 3 条 (禁止事項)
      </h2>
      <p>
        利用者は、本サービスの利用にあたり、以下の行為をしてはなりません:
      </p>
      <ul className="list-disc pl-6 space-y-1 my-3">
        <li>法令または公序良俗に違反する行為</li>
        <li>犯罪行為に関連する行為</li>
        <li>本サービスの運営を妨害するおそれのある行為</li>
        <li>他の利用者に関する個人情報等を収集または蓄積する行為</li>
        <li>他の利用者に成りすます行為</li>
        <li>不当な差別、誹謗中傷、ハラスメントに該当する行為</li>
        <li>運営者が不適切と判断するその他の行為</li>
      </ul>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 4 条 (本サービスの提供の停止等)
      </h2>
      <p>
        運営者は、本サービスのアクセス過多やメンテナンス等の場合、
        事前の通知なく本サービスの全部または一部の提供を停止する
        ことがあります。停止により利用者または第三者が被ったいかなる
        不利益または損害についても、運営者は責任を負いません。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 5 条 (免責事項)
      </h2>
      <p>
        本サービスに掲載されているキャリア情報、給与レンジ、コミュニティ
        投稿等は、利用者からの自己申告データに基づいています。
        運営者は、その正確性・完全性・有用性を保証しません。
        本サービスを通じて行われた個人間のやり取り (Coffee Chat 等)
        について、運営者は当事者間のトラブルに一切関与しません。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 6 条 (規約の変更)
      </h2>
      <p>
        運営者は、必要と判断した場合には、利用者に通知することなく
        いつでも本規約を変更することができます。変更後の規約は、
        本サービス上に表示した時点から効力を生じるものとします。
      </p>

      <h2 className="display font-bold text-[18px] text-ink mt-8 mb-2">
        第 7 条 (準拠法・裁判管轄)
      </h2>
      <p>
        本規約の解釈にあたっては、日本法を準拠法とします。
        本サービスに関して紛争が生じた場合には、運営者の本店所在地を
        管轄する裁判所を専属的合意管轄とします。
      </p>

      <p className="text-[11px] text-ink-faint mt-12 border-t border-ink/10 pt-4">
        本利用規約は β 版のテンプレートです。正式版の公開時に詳細を
        差し替えます。ご質問は{" "}
        <a className="text-blue underline" href="/legal/contact">
          お問い合わせ
        </a>{" "}
        からご連絡ください。
      </p>
    </>
  );
}
