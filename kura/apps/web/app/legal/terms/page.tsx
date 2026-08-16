import type { Metadata } from "next";
import { wordmark } from "@oma/core";
import { site } from "@/lib/site";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@oma/core";
import { LegalBody } from "../LegalBody";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const name = wordmark(locale);

  return (
    <LegalBody title={t.legalTerms}>
      {locale === "ja" ? (
        <>
          <h2>1. 本規約について</h2>
          <p>
            本規約は、{name}（以下「本サービス」）の利用条件を定めるものです。
            利用者は、本サービスを利用することで本規約に同意したものとみなされます。
          </p>

          <h2>2. サービスの性質</h2>
          <p>
            本サービスは、利用者が自ら登録したコレクション品の取得価格と、
            公開されている市場データに基づく参考価格を記録・表示するツールです。
          </p>
          <p>
            <strong>
              本サービスは、金融商品取引法上の投資助言・代理業その他の金融商品取引業に
              該当するサービスではありません。
            </strong>
            表示される価格は過去の取引データ等に基づく参考値であり、
            特定の売買を推奨するものではなく、また実際の売買価格を保証するものでもありません。
            売買の判断は利用者ご自身の責任で行ってください。
          </p>
          <p>
            本サービスで提供される情報は、コレクションの記録・管理を目的とした参考情報にすぎません。
            投資・金融・税務・法務その他の専門的助言を構成するものではありません。
            表示される評価額は、公開されている市場情報に基づく推定値であり、
            実際の取引価格と異なる場合があります。
            将来の価値、値上がり、または運用成果について、当社はいかなる表明も保証も行いません。
          </p>
          <p>
            記載されている商標・ブランド名は、すべて各権利者に帰属します。
            Oh My Asset は、本サービスに掲載されるいかなるブランドとも、
            提携・推奨・後援の関係にありません。
          </p>

          <h2>3. 価格情報の出所と限界</h2>
          <p>
            価格情報は、eBay の公開 API から取得した出品価格、
            および運営者が公開情報を参照して手動で登録した価格から構成されます。
            出品価格は実際の落札価格とは異なり、一般に高めに出る傾向があります。
            参照した取引件数が少ない銘柄については「データ不足」と表示し、価格を表示しません。
          </p>

          <h2>4. アカウント</h2>
          <p>
            利用者は、登録情報を正確に保ち、認証情報を第三者に開示しない責任を負います。
            アカウントを通じて行われた操作の結果は、利用者に帰属します。
          </p>

          <h2>5. 禁止事項</h2>
          <ul>
            <li>法令または公序良俗に違反する行為</li>
            <li>本サービスの運営を妨害する行為、および自動化された過度なアクセス</li>
            <li>他の利用者の情報への不正なアクセスを試みる行為</li>
            <li>本サービスから取得したデータの無断での再配布・商用利用</li>
            <li>模倣品（偽物）・レプリカの登録、およびその写真のアップロード</li>
            <li>第三者の権利を侵害する画像・情報の投稿</li>
          </ul>

          <h2>6. 利用者がアップロードした写真</h2>
          <p>
            <strong>アップロードされた写真の著作権は、利用者ご自身に帰属します。</strong>
            当社がその権利を取得することはありません。
          </p>
          <p>
            写真をアップロードすることにより、利用者は当社に対し、
            本サービスを利用者に提供する目的の範囲に限って、
            当該写真を保存・複製・表示するための、
            非独占的・世界的・無償の利用許諾を付与するものとします。
            具体的には、利用者ご自身のコレクション画面への表示と、
            端末を変更しても失われないよう保管することを指します。
            当社は、利用者の写真を広告に利用したり、他の利用者に公開したりすることはありません。
            この許諾は、写真またはアカウントを削除した時点で終了します。
          </p>
          <p>
            利用者は、アップロードする写真を自ら撮影したものであること、
            または必要な権利を有していることを表明し、
            第三者の著作権・商標権・肖像権その他の権利を侵害しないことを保証するものとします。
          </p>
          <p>
            <strong>模倣品（偽物）の登録・写真投稿は禁止します。</strong>
            模倣品・レプリカその他権利を侵害する物品の画像をアップロードする行為を禁じます。
            違反が確認された場合、当社は事前の通知なく、
            当該写真の削除およびアカウントの利用停止を行うことがあります。
          </p>

          <h2>7. 知的財産</h2>
          <p>
            本サービスは、第三者の商品画像・ロゴを掲載していません。
            商品名・型番の表記は、当該商品を特定するための記述的な使用であり、
            各権利者との提携・後援関係を示すものではありません。
          </p>

          <h2>8. 免責</h2>
          <p>
            本サービスは現状有姿で提供されます。
            運営者は、価格情報の正確性・完全性・最新性について保証せず、
            本サービスの利用または利用不能から生じた損害について、
            適用法令が許容する範囲で責任を負いません。
          </p>

          <h2>9. サービスの変更・終了</h2>
          <p>
            運営者は、本サービスの内容を変更し、または提供を終了することがあります。
            終了する場合は、合理的な範囲で事前に通知します。
          </p>

          <h2>10. 準拠法・管轄</h2>
          <p>
            本規約は日本法に準拠します。
            本サービスに関して紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>

          <h2>11. お問い合わせ</h2>
          <p>お問い合わせは<a href="/contact" className="text-accent hover:underline">お問い合わせフォーム</a>からお願いします。</p>
        </>
      ) : (
        <>
          <h2>1. About these terms</h2>
          <p>
            These terms govern your use of {name} (the &ldquo;Service&rdquo;). By using the
            Service you agree to them.
          </p>

          <h2>2. What the Service is</h2>
          <p>
            The Service is a record-keeping tool. It stores what you paid for items you
            entered yourself, and displays reference prices derived from publicly available
            market data.
          </p>
          <p>
            <strong>
              The Service is not an investment advisory, brokerage, or financial instruments
              business.
            </strong>{" "}
            Prices shown are reference values derived from past transaction data. They do not
            recommend any transaction and do not guarantee any sale price. Any decision to buy
            or sell is yours alone.
          </p>
          <p>
            Information provided on this platform is for informational and collection
            management purposes only. It does not constitute investment, financial, tax, legal
            or professional advice. Asset values are estimates based on publicly available
            market information and may differ from actual transaction prices. No
            representation or warranty is made regarding future value, appreciation, or
            investment performance.
          </p>
          <p>
            All trademarks belong to their respective owners. Oh My Asset is not affiliated
            with, endorsed by, or sponsored by any brand listed on the platform.
          </p>

          <h2>3. Where prices come from, and their limits</h2>
          <p>
            Prices are drawn from listing prices returned by eBay&rsquo;s public API, and from
            values recorded manually by the operator with reference to published sources.
            Listing prices differ from realised sale prices and generally read high. Items with
            too few observations are labelled &ldquo;no data&rdquo; and no price is shown.
          </p>

          <h2>4. Your account</h2>
          <p>
            You are responsible for keeping your registration details accurate and your
            credentials confidential. Activity carried out through your account is attributed
            to you.
          </p>

          <h2>5. Prohibited conduct</h2>
          <ul>
            <li>Anything unlawful</li>
            <li>Interfering with the Service, including excessive automated access</li>
            <li>Attempting to access other users&rsquo; data</li>
            <li>Redistributing or commercially exploiting data obtained from the Service</li>
            <li>Cataloguing counterfeit or replica items, or uploading photographs of them</li>
            <li>Uploading images or information that infringe anyone else&rsquo;s rights</li>
          </ul>

          <h2>6. Photographs you upload</h2>
          <p>
            <strong>You keep the copyright in every photograph you upload.</strong> We claim
            no ownership of it.
          </p>
          <p>
            By uploading a photograph you grant us a non-exclusive, worldwide, royalty-free
            licence to store, reproduce and display it strictly for the purpose of operating
            the Service for you — showing it back to you in your own collection, and holding a
            copy so it survives a device change. The licence exists only so the Service can
            function; we do not use your photographs for advertising or publish them to other
            users, and it ends when you delete the photograph or your account.
          </p>
          <p>
            You confirm that you took the photograph, or otherwise hold the rights needed to
            upload it, and that doing so infringes nobody else&rsquo;s copyright, trademark or
            privacy.
          </p>
          <p>
            <strong>
              Counterfeit goods must not be catalogued or photographed on the Service.
            </strong>{" "}
            Uploading images of counterfeit, replica or otherwise infringing items is
            prohibited. We may remove any photograph and suspend any account that breaches
            this, without notice.
          </p>

          <h2>7. Intellectual property</h2>
          <p>
            The Service does not host third-party product images or logos. Product names and
            reference numbers are used descriptively to identify goods and do not imply any
            affiliation with or endorsement by their rights holders. You retain rights in
            photographs you upload.
          </p>

          <h2>8. Disclaimer</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo;. The operator makes no warranty as to
            the accuracy, completeness, or timeliness of price information, and to the extent
            permitted by law accepts no liability for loss arising from use of, or inability to
            use, the Service.
          </p>

          <h2>9. Changes and discontinuation</h2>
          <p>
            The operator may change or discontinue the Service, giving reasonable notice where
            discontinuation is planned.
          </p>

          <h2>10. Governing law</h2>
          <p>
            These terms are governed by the laws of Japan, with the Tokyo District Court as the
            court of first instance for any dispute.
          </p>

          <h2>11. Contact</h2>
          <p>Please use the <a href="/contact" className="text-accent hover:underline">contact form</a>.</p>
        </>
      )}
    </LegalBody>
  );
}
