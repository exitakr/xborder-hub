import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, wordmark } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { LegalBody } from "../LegalBody";

export const metadata: Metadata = { title: "特定商取引法に基づく表記" };

/**
 * The Specified Commercial Transactions Act notice (特定商取引法に基づく表記).
 *
 * Not optional and not boilerplate. Article 11 of the Act requires a seller
 * offering goods or services to consumers online in Japan to publish the
 * operator's name, address, telephone number, price, payment method, delivery
 * timing and returns policy, in a place a buyer can read BEFORE paying. Stripe
 * checks for this page when reviewing a Japanese account, so in practice it is
 * also a precondition for taking any money at all.
 *
 * WHY THE VALUES COME FROM THE ENVIRONMENT
 *
 * The Act asks for a real person's legal name, postal address and telephone
 * number. Those do not belong in a public git repository, and they are not
 * knowable by anyone writing this file. So the page is a form with no answers
 * until the operator supplies them, and it refuses to render at all while they
 * are missing — a 特商法 page with blanks where the address should be is worse
 * than no page: it is a published statement that the seller cannot be reached.
 *
 * The address and phone number may be withheld under the 2021 amendment only
 * if the site states that they will be disclosed without delay on request, and
 * gives a route for that request. That exemption is what SELLER_DISCLOSE_ON_REQUEST
 * turns on; it is not a way to avoid having them.
 */
export default async function CommercePage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const name = wordmark(locale);

  const seller = {
    operator: process.env.SELLER_NAME?.trim() ?? "",
    manager: process.env.SELLER_MANAGER?.trim() ?? "",
    address: process.env.SELLER_ADDRESS?.trim() ?? "",
    phone: process.env.SELLER_PHONE?.trim() ?? "",
    onRequest: process.env.SELLER_DISCLOSE_ON_REQUEST === "1",
  };

  // Nothing to publish yet. A 404 is honest; a page of empty rows is not.
  if (!seller.operator) notFound();

  const ja = locale === "ja";

  const disclose = ja
    ? "請求があったら遅滞なく開示します。開示のご請求はお問い合わせフォームからお願いします。"
    : "Disclosed without delay upon request. Please ask through the contact form.";

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: ja ? "販売事業者" : "Seller", value: seller.operator },
    ...(seller.manager
      ? [{ label: ja ? "運営責任者" : "Responsible person", value: seller.manager }]
      : []),
    {
      label: ja ? "所在地" : "Address",
      value: seller.address || (seller.onRequest ? disclose : "—"),
    },
    {
      label: ja ? "電話番号" : "Telephone",
      value: seller.phone || (seller.onRequest ? disclose : "—"),
    },
    {
      label: ja ? "お問い合わせ" : "Contact",
      value: (
        <a href="/contact" className="text-accent hover:underline">
          {ja ? "お問い合わせフォーム" : "Contact form"}
        </a>
      ),
    },
    {
      label: ja ? "販売価格" : "Price",
      value: ja
        ? `月額 ${t.planPriceMonthly}（税込） ／ 年額 ${t.planPriceYearly}（税込）`
        : `${t.planPriceMonthly} per month or ${t.planPriceYearly} per year, including tax`,
    },
    /*
     * The clauses a recurring seller must publish, added by the 2022 amendment
     * to the Specified Commercial Transactions Act. They are not a longer
     * version of the one-time text — the Act treats 定期購入 as its own
     * category, and omitting the renewal cadence or the cancellation route
     * gives the buyer a statutory right to rescind.
     */
    {
      label: ja ? "契約期間・自動更新" : "Term and renewal",
      value: ja
        ? "自動更新の継続課金です。月額プランは1ヶ月ごと、年額プランは1年ごとに、解約されるまで自動的に更新されます。最低利用期間はありません。"
        : "A recurring subscription. Monthly plans renew every month and yearly plans every year, automatically, until cancelled. There is no minimum term.",
    },
    {
      label: ja ? "解約の方法" : "How to cancel",
      value: ja
        ? "ログイン後の「プラン」画面から、いつでもご自身で解約できます。解約後も、お支払い済みの期間の終了日まで有料機能をご利用いただけます。次回更新日の前日までに解約された場合、次回以降の請求は発生しません。"
        : "From the Plan screen once signed in, at any time and without contacting us. You keep the paid features until the end of the period already paid for, and cancelling before the next renewal date means you are not charged again.",
    },
    {
      label: ja ? "商品代金以外の必要料金" : "Additional charges",
      value: ja
        ? "なし。インターネット接続に係る通信料はお客様のご負担となります。"
        : "None. Your own internet connection charges apply.",
    },
    {
      label: ja ? "支払方法" : "Payment methods",
      value: ja
        ? "クレジットカード（Stripe による決済）"
        : "Credit card, processed by Stripe",
    },
    {
      label: ja ? "支払時期" : "When payment is taken",
      value: ja
        ? "お申し込み時、および以降の各更新日に、ご登録のクレジットカードから決済されます。"
        : "When you subscribe, and again on each renewal date, from the card you registered.",
    },
    {
      label: ja ? "提供時期" : "When the service is provided",
      value: ja
        ? "決済完了後ただちにご利用いただけます。"
        : "Immediately after payment completes.",
    },
    {
      label: ja ? "返品・キャンセル" : "Returns and cancellation",
      value: ja
        ? "デジタルサービスの性質上、決済済みの期間分の返金は原則としてお受けできません。解約されると次回以降の請求が停止し、お支払い済みの期間の終了日までご利用いただけます。当方の障害により提供できない場合、および法令上返金が求められる場合はこの限りではありません。"
        : "Because this is a digital service delivered immediately, periods already paid for are not generally refundable. Cancelling stops all future charges and leaves access in place until the paid period ends. This does not apply where we are unable to provide the Service through our own fault, or where a refund is required by law.",
    },
    {
      label: ja ? "動作環境" : "Requirements",
      value: ja
        ? "最新版の一般的なウェブブラウザ（Chrome・Safari・Edge・Firefox）"
        : "A current version of a mainstream web browser (Chrome, Safari, Edge, Firefox)",
    },
  ];

  return (
    <LegalBody title={ja ? "特定商取引法に基づく表記" : "Specified Commercial Transactions Act"}>
      <p>
        {ja
          ? `${name}（以下「本サービス」）の有料プランに関する表記です。`
          : `This notice concerns the paid plan of ${name}.`}
      </p>

      {/* A definition list rather than a table: the Act asks for labelled
          facts, and a two-column table is the first thing to break on a phone,
          which is where most of these are read. */}
      <dl className="mt-6 divide-y divide-line border-y border-line">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
            <dt className="text-sm font-medium">{row.label}</dt>
            <dd className="text-sm leading-relaxed text-muted">{row.value}</dd>
          </div>
        ))}
      </dl>
    </LegalBody>
  );
}
