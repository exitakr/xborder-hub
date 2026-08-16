# App Store / Google Play 提出ガイド

> `apps/mobile` を審査に通すための手順と、そのまま貼れるストア掲載文。
> **審査でよく落ちる項目には ⚠️ を付けています。** そこだけでも先に読んでください。

---

## 0. 提出前の必須チェック

| 項目 | 状態 | 備考 |
|---|---|---|
| アカウント削除機能をアプリ内に実装 | ✅ 実装済 | 「マイページ」タブ。Apple 5.1.1(v) / Google Play の必須要件 |
| プライバシーポリシーの URL | ⚠️ 要準備 | Web 版 `/legal/privacy` を公開してその URL を使う |
| 審査用デモアカウント | ⚠️ **必須・要準備** | 下記 §4。**未提出だと確実に差し戻されます** |
| 写真アクセスの用途説明 | ✅ 実装済 | `app.json` の `NSPhotoLibraryUsageDescription` |
| 輸出コンプライアンス | ✅ 設定済 | `usesNonExemptEncryption: false`（HTTPS のみのため該当なし） |
| 免責表示 | ✅ 全画面 | 「投資助言ではない」旨を全スクリーン下部に常設 |
| 年齢レーティング | ⚠️ 要申告 | §6 |

---

## 1. EAS の初期設定

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas init            # app.json の extra.eas.projectId が実 ID に書き換わる
```

⚠️ `app.json` の `projectId` は現在ダミー（`00000000-…`）です。`eas init` で必ず実 ID に置き換えてください。

### 環境変数（EAS 側に登録）

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL      --value "https://xxx.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --name EXPO_PUBLIC_SITE_URL          --value "https://your-domain"
```

`EXPO_PUBLIC_*` はバンドルに埋め込まれます。**anon キーのみ**を入れてください
（RLS があるため公開して安全です）。service_role キーは絶対に入れないこと。

### ビルドと提出

```bash
npm run build:ios       # eas build --platform ios --profile production
npm run build:android   # → .aab（Play は aab 必須）
npm run submit:ios
npm run submit:android
```

⚠️ `eas.json` の `submit.production` は `REPLACE_WITH_…` のままです。
App Store Connect の Apple ID / ASC App ID / Team ID を入れてから実行してください。

---

## 2. バンドル ID / パッケージ名

```
com.ohmyasset.app
```

⚠️ **一度ストアに登録すると変更できません。** 独自ドメインを持っているなら
それに合わせて `packages/core/src/brand.ts` の `applicationId` と `app.json` を
先に変更してください。商標調査（`LAUNCH.md` §D）の結果次第では名前ごと変わるため、
**商標調査を先に済ませることを強く推奨します。**

---

## 3. ストア掲載文（そのまま使えます）

### 3.1 日本語

**アプリ名（30字以内）**
```
Oh My Asset - コレクション管理
```

**サブタイトル（30字以内 / iOS）**
```
カード・時計・スニーカーを記録
```

**短い説明（80字以内 / Google Play）**
```
トレカ・時計・バッグ・スニーカー。買った値段と今の相場を並べて、コレクションを資産として管理できます。
```

**説明文**
```
手持ちのコレクションを記録し、推定市場価値を把握できる管理アプリです。

■ ひと画面で全部わかる
カテゴリをまたいだ合計評価額と損益を、開いた瞬間に表示します。
トレーディングカード、時計、バッグ、スニーカーをまとめて管理できます。

■ 売買をチャートに重ねる
買った日には青い「B」、売った日にはオレンジの「S」が価格推移チャート上に
表示されます。いつ買って、そこから相場がどう動いたかが一目でわかります。

■ 出どころのわかる価格
表示する価格には必ず参照元・取得日時・信頼度がついています。
根拠が薄い銘柄は価格を出さず「データ不足」と明示します。

■ 日本語／英語、JPY／SGD／USD 対応
海外のコレクターとも同じ基準で管理できます。

■ あなたのデータはあなたのものです
保有内容と取引価格は、ご本人以外は参照できません。
写真は非公開の領域に保存されます。アプリ内からいつでも全削除できます。

―――
表示価格は過去の取引データに基づく参考値であり、売買価格を保証するものでは
ありません。本アプリは投資助言・金融商品取引業に該当するサービスではありません。
```

**キーワード（100字以内 / iOS、カンマ区切り）**
```
コレクション,ポケカ,トレカ,時計,スニーカー,資産管理,ポートフォリオ,相場,転売,collectible
```

### 3.2 English

**App name**
```
Oh My Asset - Collectibles Tracker
```

**Subtitle**
```
Track your collectibles' value
```

**Short description (Google Play, 80 chars)**
```
Catalog, organize and monitor the estimated market value of your collectibles.
```

**Description**
```
Catalog, organize and monitor the estimated market value of your collectibles.

■ Everything on one screen
Estimated total value and change across every category, the moment you open the app.
Trading cards, watches, bags and sneakers, together.

■ Your trades, on the chart
Buys are marked with a blue "B" and sells with an orange "S", drawn directly on
the price history. You can see exactly where you bought and what happened next.

■ Prices you can trace
Every price carries its source, the time it was fetched, and a confidence
label. Where the data is too thin, we say so instead of guessing.

■ Japanese & English, JPY / SGD / USD
Built for collectors in Japan, Singapore, and everywhere else.

■ Your data stays yours
Your holdings and prices are readable only by you. Photos are kept in private
storage. You can delete everything from inside the app at any time.

―――
Information provided in this app is for informational and collection management
purposes only. It does not constitute investment, financial, tax, legal or
professional advice. Asset values are estimates based on publicly available
market information and may differ from actual transaction prices. No
representation or warranty is made regarding future value, appreciation, or
investment performance.

All trademarks belong to their respective owners. Oh My Asset is not affiliated
with, endorsed by, or sponsored by any brand listed on the platform.
```

**Keywords (iOS)**
```
collection,trading cards,pokemon,watches,sneakers,collectibles,tracker,catalog,inventory,resale
```

---

## 4. ⚠️ 審査用デモアカウント（最重要）

ログインしないと中身が見えないアプリは、**デモアカウントを渡さないと必ず差し戻されます。**

1. 本番 Supabase で審査用アカウントを1つ作る（例 `review@yourdomain.com`）
2. **保有データを数件入れておく**（空のポートフォリオだと機能を確認してもらえません）
   - 銘柄を3〜4件追加し、それぞれに購入・売却を1〜2件登録
   - 1件は写真も登録しておく
3. App Store Connect → 「App Review Information」に ID / パスワードを入力
4. Google Play → 「アプリのアクセス権」→「すべての機能が制限されています」を選び、
   同じ資格情報を入力

### レビュー担当者への注記（Notes 欄にそのまま貼れます）

```
This app is a personal record-keeping tool for collectible items
(trading cards, watches, bags, sneakers). Users record what they paid
for items they own, and the app displays reference market prices
alongside their cost basis.

The app does NOT sell, broker, or process any transaction. It is not a
marketplace and contains no in-app purchases. It is not an investment
advisory service, and it displays a disclaimer to that effect on every
screen.

Price data comes from public, documented APIs (eBay Browse API,
Scryfall, and the Pokémon TCG API) and from values recorded manually by
the operator. No product images from any brand are used; the only images
in the app are ones the user photographs themselves.

Photo library access is used solely so a user can attach their own photo
to an item they own. Photos are stored privately per account.

Account deletion is available in-app: Account tab → "Delete account".

Demo account:
  Email:    review@yourdomain.com
  Password: <fill in>
The demo account already contains sample holdings and transactions.
```

---

## 5. プライバシー申告

### 5.1 iOS — App Privacy（Nutrition Labels）

「**Data Linked to You**」として以下を申告します。用途はすべて "App Functionality"、
トラッキングは **なし**（`NSPrivacyTracking` = false）。

| データ種別 | 収集 | 用途 |
|---|---|---|
| Email Address | ✅ | アカウント認証 |
| Name（表示名） | ✅ | アカウント表示 |
| User Content（写真） | ✅ | アプリ機能 |
| **Other Financial Info**（保有・取得価格） | ✅ | アプリ機能 |
| Crash Data / Analytics | ❌ | 現状なし |
| Advertising Data | ❌ | なし |

⚠️ 保有銘柄と取得価格は **"Other Financial Info"** に該当します。ここを未申告にすると
リジェクト対象です。将来 Sentry や解析を入れる場合は申告の追加を忘れないこと。

### 5.2 Android — Data safety フォーム

| 項目 | 回答 |
|---|---|
| データを収集するか | はい |
| データを共有するか（第三者へ） | **いいえ**（Supabase / Vercel は処理委託先であり「共有」に当たらない） |
| 転送時の暗号化 | はい（HTTPS のみ） |
| ユーザーが削除を要求できるか | **はい**（アプリ内から即時削除可） |
| 収集項目 | メールアドレス / 名前 / 写真 / 「財務情報 - その他」 |

---

## 6. 年齢レーティング

- **iOS**: 4+（暴力・成人向け表現なし、ギャンブル要素なし）
- **Google Play**: IARC 質問票で「該当なし」を選択 → 全年齢

⚠️ 「ユーザー間のやりとり」「位置情報の共有」は **いいえ**。
本アプリに SNS 機能はありません（SPEC の非目標どおり）。

---

## 7. ⚠️ 審査で問題になりうる点と、その備え

### 7.1 Guideline 4.2「最低限の機能」
Web サイトを包んだだけのアプリは落とされます。本アプリは React Native の
ネイティブ実装で、写真ライブラリ連携・OS キーチェーンでの認証保管・
プルして更新など、ネイティブ機能を実際に使っています。ここは問題になりにくい構成です。

### 7.2 金融アプリと見なされないための備え
Apple・Google とも金融サービスには追加の審査があります。本アプリは
**記録ツールであって金融サービスではない**ことを明確にしています。

- 「買い時」「売り時」「推奨」等の表現を UI に一切使っていない
- 全画面に免責表示
- 売買・決済・送金機能なし
- レビュー注記（§4）で明示

万一「金融サービスか」と問われた場合は、上記の注記をそのまま回答してください。

### 7.3 価格が「データ不足」ばかりになる状態で出さない
初回の Cron が回る前は価格が空です。**銘柄マスタに実価格が入ってから提出**してください。
空の状態だと「機能していない」と判断されるおそれがあります。

### 7.4 Scryfall のライセンス制約（将来の収益化に直結）
Scryfall のデータは **有料プランの背後に置くことができません**。
将来サブスクリプションを導入する場合、MTG の価格表示は無料プランでも
見られる必要があります。**売却時のデューデリジェンスで確認される可能性がある論点**です。
詳細は `docs/RESEARCH.md` §7。

---

## 8. スクリーンショット要件

必要サイズ（それぞれ 3〜5 枚）:

| ストア | サイズ |
|---|---|
| iOS 6.9" (iPhone 16 Pro Max) | 1290 × 2796 |
| iOS 6.5"（任意だが推奨） | 1242 × 2688 |
| Android スマートフォン | 1080 × 1920 以上 |
| Google Play フィーチャーグラフィック | 1024 × 500（必須） |

推奨する 4 枚の構成:

1. **ポートフォリオ画面** — 合計評価額が入った状態（このアプリの価値が一番伝わる）
2. **銘柄詳細のチャート** — B/S マーカーが乗っている状態（最大の差別化点）
3. **銘柄検索** — カテゴリチップが見える状態
4. **取引記録シート** — 入力の簡単さ

⚠️ スクリーンショットに**他社の商品写真を写さないでください**（SPEC §1.2）。
デモデータの写真は自分で撮影したものか、カテゴリアイコンのままにします。
