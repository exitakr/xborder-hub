import { Linking, ScrollView, Text, View } from "react-native";
import Constants from "expo-constants";
import { brand } from "@oma/core";
import { useSession } from "../src/session";
import { Button, Disclaimer } from "../src/components/ui";
import { theme } from "../src/theme";
import { useColors } from "../src/ThemeProvider";

/**
 * In-app legal screen.
 *
 * App Store review requires the terms and privacy policy to be reachable from
 * inside the app, not only from the store listing. The full documents live on
 * the web app so there is one canonical copy; this screen states the essentials
 * and links out.
 */
export default function LegalScreen() {
  const { t, profile } = useSession();

  // Falls back to the production site rather than a placeholder domain: an
  // unset env var used to ship "example.com" into a store build, where it
  // reads as an unfinished app in exactly the screen reviewers check.
  const siteUrl =
    (Constants.expoConfig?.extra?.SITE_URL as string | undefined) ??
    process.env.EXPO_PUBLIC_SITE_URL ??
    "https://ohmyasset.com";

  const ja = profile.locale === "ja";

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space(4), gap: theme.space(4) }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>
        {t.legalTerms} · {t.legalPrivacy}
      </Text>

      <Section title={ja ? "このアプリについて" : "About this app"}>
        {ja
          ? `${brand.name} は、あなたが自分で登録したコレクションの取得価格と、公開されている市場データにもとづく参考価格を記録・表示する記録ツールです。売買の仲介や決済は行いません。`
          : `${brand.name} is a record-keeping tool. It stores what you paid for items you entered yourself and shows reference prices derived from public market data. It does not broker or process any transaction.`}
      </Section>

      <Section title={ja ? "投資助言ではありません" : "Not investment advice"}>
        {ja
          ? "表示価格は過去の取引データ等にもとづく参考値であり、特定の売買を推奨するものではありません。本アプリは投資助言・金融商品取引業に該当するサービスではありません。"
          : "Prices shown are reference values derived from past transaction data. They do not recommend any transaction. This app is not an investment advisory or financial instruments business."}
      </Section>

      <Section title={ja ? "価格の出どころ" : "Where prices come from"}>
        {ja
          ? "価格は eBay の公開 API による出品価格、Scryfall および Pokémon TCG API による市場価格、そして運営が公開情報を参照して手動で登録した値から構成されます。出品価格は実際の落札価格より高く出る傾向があります。参照件数が少ない銘柄は「データ不足」と表示し、価格を出しません。"
          : "Prices come from eBay's public API (listing prices), Scryfall and the Pokémon TCG API (market prices), and values recorded manually by the operator from published sources. Listing prices tend to read higher than realised sale prices. Items with too few observations are labelled and no price is shown."}
      </Section>

      <Section title={ja ? "あなたのデータ" : "Your data"}>
        {ja
          ? "保有銘柄と取引価格は、データベースの行レベルセキュリティによりご本人以外は参照できません。写真は非公開の保管領域に保存され、あなたのアカウントからのみ閲覧できます。マイページからいつでも全データを削除できます。"
          : "Your holdings and transaction prices are readable only by you, enforced by row-level security in the database. Photos are kept in private storage accessible only from your account. You can delete all of it at any time from the Account tab."}
      </Section>

      <View style={{ gap: theme.space(3), marginTop: theme.space(2) }}>
        <Button
          label={t.legalTerms}
          variant="secondary"
          onPress={() => Linking.openURL(`${siteUrl}/legal/terms`)}
        />
        <Button
          label={t.legalPrivacy}
          variant="secondary"
          onPress={() => Linking.openURL(`${siteUrl}/legal/privacy`)}
        />
      </View>

      <Disclaimer text={t.disclaimer} trademark={t.trademarkNotice} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const col = useColors();

  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: 13, lineHeight: 20, color: col.muted }}>{children}</Text>
    </View>
  );
}
