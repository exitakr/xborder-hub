import type { Metadata } from "next";
import { wordmark } from "@oma/core";
import { site } from "@/lib/site";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@oma/core";
import { LegalBody } from "../LegalBody";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const name = wordmark(locale);

  return (
    <LegalBody title={t.legalPrivacy}>
      {locale === "ja" ? (
        <>
          <h2>1. 取得する情報</h2>
          <ul>
            <li>アカウント情報：メールアドレス、表示名</li>
            <li>利用者が登録した情報：保有銘柄、取引日・数量・単価、アップロードした写真</li>
            <li>技術情報：アクセスログ、エラー情報</li>
          </ul>

          <h2>2. 利用目的</h2>
          <p>
            取得した情報は、本サービスの提供、認証、
            および障害対応・不正利用防止のために利用します。
            保有内容や取引価格を広告目的で第三者に提供することはありません。
          </p>

          <h2>3. 保有資産情報の取扱い</h2>
          <p>
            保有銘柄と取引価格は機微性の高い情報です。{name} では、
            これらのデータへのアクセスをデータベースの行レベルセキュリティで本人のみに制限し、
            アプリケーションのログにも価格・保有内容を出力しません。
          </p>

          <h2>4. 第三者提供・委託先</h2>
          <p>
            本サービスは、以下の事業者のサービスを利用しています。
            利用者データは、サービス提供に必要な範囲でこれらの事業者のシステムに保存されます。
          </p>
          <ul>
            <li>Supabase（認証、データベース、画像保管）</li>
            <li>Vercel（アプリケーションの配信、アクセス数の集計）</li>
            <li>Brevo（認証メール・確認メールの送信）</li>
          </ul>
          <p>
            価格の取得のために eBay・楽天市場・Scryfall・Pokémon TCG API の公開 API を
            利用しますが、その際に利用者個人を識別する情報は送信しません。
            取得元と取得方法の詳細は「価格データについて」に記載しています。
          </p>

          <h2>5. 国外へのデータ移転</h2>
          <p>
            上記事業者のサーバーは日本国外に所在する場合があります。
            日本国外の利用者を含め、本サービスの利用にあたっては当該移転に同意いただきます。
          </p>

          <h2>6. 利用者の権利</h2>
          <p>
            お住まいの国にかかわらず、すべての利用者が以下を請求できます。
          </p>
          <ul>
            <li>保有している個人データの開示</li>
            <li>誤った内容の訂正</li>
            <li>利用の停止、および同意の撤回</li>
            <li>アカウントとデータの削除</li>
          </ul>
          <p>
            ご請求は<a href="/contact" className="text-accent hover:underline">お問い合わせフォーム</a>
            からお願いします。原則として30日以内に回答します。
            なお、削除については請求を待たずに、マイページからご自身でいつでも実行できます。
          </p>

          <h2>7. 各国の法令に基づく補足</h2>
          <p>
            上記の権利は本サービスの方針としてすべての利用者に適用されます。
            以下は、本サービスが対象としている国の法令が個別に定める事項です。
          </p>
          <p>
            <strong>日本（個人情報保護法）</strong>
            ：本サービスの運営者は日本の個人情報取扱事業者です。
            利用目的は第2項、第三者提供および委託先は第4項に記載しています。
            開示・訂正・利用停止の請求、および苦情の申出は上記フォームで受け付けます。
            解決しない場合は、個人情報保護委員会に申し出ることができます。
          </p>
          <p>
            <strong>シンガポール（PDPA）</strong>
            ：シンガポールを提供地域としているため、同国の個人情報保護法が適用されます。
            同法第11条に基づき個人データの管理責任者（Data Protection Officer）を置いており、
            上記フォームからの請求は当該責任者が受領します。
            回答に不服がある場合は、個人情報保護委員会（PDPC）へ申し立てることができます。
          </p>
          <p>
            上記以外の国からもご利用いただけますが、本サービスは日本およびシンガポール向けに
            提供しており、これらの国以外の法令に基づく個別の対応は行っていません。
          </p>

          <h2>8. 保存期間と削除</h2>
          <p>
            アカウントが存続する間、データを保存します。
            マイページの「アカウントの削除」から、保有・取引・アップロード画像を含む
            すべてのデータを削除できます。削除は取り消せません。
          </p>

          <h2>9. Cookie とアクセス解析</h2>
          <p>
            ログインセッションの維持と表示言語の記憶のために Cookie を使用します。
            広告目的のトラッキング Cookie は使用していません。
          </p>
          <p>
            どのページがどれだけ閲覧されているかを把握するため、Vercel Web Analytics を
            利用しています。閲覧ページ、参照元サイト、おおまかな端末種別を記録しますが、
            Cookie を設定せず、継続的な識別子も付与せず、IP アドレスも保持しません。
            そのためサイトをまたいだ追跡や、アカウントとの紐付けはできません。
          </p>

          <h2>10. お問い合わせ</h2>
          <p>お問い合わせは<a href="/contact" className="text-accent hover:underline">お問い合わせフォーム</a>からお願いします。</p>
        </>
      ) : (
        <>
          <h2>1. What we collect</h2>
          <ul>
            <li>Account details: email address and display name</li>
            <li>
              What you enter: the items you hold, transaction dates, quantities and unit
              prices, and photographs you upload
            </li>
            <li>Technical data: access logs and error reports</li>
          </ul>

          <h2>2. How it is used</h2>
          <p>
            To operate and authenticate the Service, and to diagnose faults and prevent abuse.
            We do not sell or share your holdings or transaction prices for advertising.
          </p>

          <h2>3. Handling of holdings data</h2>
          <p>
            What you own and what you paid is sensitive. In {name}, access to this data is
            restricted to you by row-level security in the database, and prices and holdings
            are never written to application logs.
          </p>

          <h2>4. Processors</h2>
          <p>
            The Service is built on the providers below, and your data is stored in their
            systems to the extent needed to run it:
          </p>
          <ul>
            <li>Supabase — authentication, database, image storage</li>
            <li>Vercel — application hosting and aggregate traffic measurement</li>
            <li>Brevo — delivery of authentication and confirmation email</li>
          </ul>
          <p>
            The public APIs of eBay, Rakuten Ichiba, Scryfall and the Pokémon TCG API are
            called to retrieve prices. No information identifying you is sent in those
            requests. How each source is used is described under{" "}
            <a href="/data-sources" className="text-accent hover:underline">
              About our price data
            </a>
            .
          </p>

          <h2>5. International transfers</h2>
          <p>
            The providers above may host data outside your country of residence. Using the
            Service involves consenting to that transfer.
          </p>

          <h2>6. Your rights</h2>
          <p>Wherever you live, you may ask us to:</p>
          <ul>
            <li>tell you what personal data we hold about you</li>
            <li>correct anything that is wrong</li>
            <li>stop using it, and withdraw your consent</li>
            <li>delete your account and its data</li>
          </ul>
          <p>
            Please use the{" "}
            <a href="/contact" className="text-accent hover:underline">contact form</a>; we
            respond within 30 days. Deletion needs no request at all — you can do it yourself
            from the Account page at any time.
          </p>

          <h2>7. Country-specific notes</h2>
          <p>
            The rights above are our policy and apply to every user. What follows is what the
            law of each market we serve requires us to say specifically.
          </p>
          <p>
            <strong>Japan (APPI)</strong>: the operator is a personal information handling
            business operator under Japanese law. Our purposes of use are in section 2, and our
            processors and disclosures in section 4. Requests for disclosure, correction or
            suspension of use, and complaints, go through the form above. If a complaint is not
            resolved, you may raise it with the Personal Information Protection Commission.
          </p>
          <p>
            <strong>Singapore (PDPA)</strong>: because the Service is offered in Singapore, the
            Personal Data Protection Act applies to it. We have designated a Data Protection
            Officer as required by section 11, and requests sent through the form above reach
            them. If you are not satisfied with our response, you may complain to the Personal
            Data Protection Commission (PDPC).
          </p>
          <p>
            You are welcome to use the Service from elsewhere, but it is offered to Japan and
            Singapore, and we do not undertake obligations specific to the law of other
            countries.
          </p>

          <h2>8. Retention and deletion</h2>
          <p>
            Data is retained while your account exists. &ldquo;Delete account&rdquo; on the
            Account page removes all of it, including holdings, transactions and uploaded
            images. Deletion cannot be undone.
          </p>

          <h2>9. Cookies and traffic measurement</h2>
          <p>
            Cookies are used to keep you signed in and to remember your language. No
            advertising or tracking cookies are used.
          </p>
          <p>
            To understand how many people reach the Service and which pages they read, we use
            Vercel Web Analytics. It records the page visited, the referring site and the
            general device type. It sets no cookie, assigns no persistent identifier, and does
            not retain your IP address — so it cannot follow you between sites or link a visit
            to your account.
          </p>

          <h2>10. Contact</h2>
          <p>Please use the <a href="/contact" className="text-accent hover:underline">contact form</a>.</p>
        </>
      )}
    </LegalBody>
  );
}
