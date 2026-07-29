import type { Metadata } from "next";
import { brand, wordmark } from "@/lib/brand";
import { getLocale } from "@/lib/i18n/server";
import { getDict } from "@/lib/i18n/dict";
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
            <li>Vercel（アプリケーションの配信）</li>
          </ul>
          <p>
            価格の取得のために eBay の公開 API を利用しますが、
            その際に利用者個人を識別する情報は送信しません。
          </p>

          <h2>5. 国外へのデータ移転</h2>
          <p>
            上記事業者のサーバーは日本国外に所在する場合があります。
            日本国外の利用者を含め、本サービスの利用にあたっては当該移転に同意いただきます。
          </p>

          <h2>6. シンガポールの利用者の方へ（PDPA）</h2>
          <p>
            シンガポール個人情報保護法（PDPA）に基づき、利用者は自己の個人データへのアクセス、
            訂正、および同意の撤回を請求することができます。
            ご請求は下記の連絡先までお願いします。
          </p>

          <h2>7. 保存期間と削除</h2>
          <p>
            アカウントが存続する間、データを保存します。
            マイページの「アカウントの削除」から、保有・取引・アップロード画像を含む
            すべてのデータを削除できます。削除は取り消せません。
          </p>

          <h2>8. Cookie</h2>
          <p>
            ログインセッションの維持と表示言語の記憶のために Cookie を使用します。
            広告目的のトラッキング Cookie は使用していません。
          </p>

          <h2>9. お問い合わせ</h2>
          <p>{brand.contactEmail}</p>
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
            <li>Vercel — application hosting</li>
          </ul>
          <p>
            eBay&rsquo;s public API is called to retrieve prices. No information identifying
            you is sent in those requests.
          </p>

          <h2>5. International transfers</h2>
          <p>
            The providers above may host data outside your country of residence. Using the
            Service involves consenting to that transfer.
          </p>

          <h2>6. For users in Singapore (PDPA)</h2>
          <p>
            Under Singapore&rsquo;s Personal Data Protection Act you may request access to and
            correction of your personal data, and may withdraw consent. Please use the contact
            address below.
          </p>

          <h2>7. Retention and deletion</h2>
          <p>
            Data is retained while your account exists. &ldquo;Delete account&rdquo; on the
            Account page removes all of it, including holdings, transactions and uploaded
            images. Deletion cannot be undone.
          </p>

          <h2>8. Cookies</h2>
          <p>
            Cookies are used to keep you signed in and to remember your language. No
            advertising or tracking cookies are used.
          </p>

          <h2>9. Contact</h2>
          <p>{brand.contactEmail}</p>
        </>
      )}
    </LegalBody>
  );
}
