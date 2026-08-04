# KURA / 蔵

> コレクションを、資産として見る。
> A portfolio tracker for collectible assets — trading cards, watches, bags, sneakers.

トレーディングカード・高級時計・ハイブランドバッグ・スニーカーなどの
「コレクタブル資産」を、株式ポートフォリオのように管理・可視化するアプリ。
**iOS / Android / Web** の3面、日本語・英語、JPY / SGD / USD に対応。

⚠️ **ブランド名は商標未確認です。** 詳細は下記「ネーミング」を参照。

---

## 構成

npm workspaces の monorepo です。

```
kura/
├── packages/core/     ★ 計算ロジック・翻訳・データ取得（Web と Mobile が共有）
├── apps/web/            Next.js 15。ランディング + Web アプリ + 価格更新 Cron
├── apps/mobile/         Expo SDK 57 / React Native。App Store / Google Play 提出用
├── supabase/migrations/ スキーマ・RLS・シード
└── docs/                調査報告とストア提出ガイド
```

**なぜ共有パッケージがあるのか**：評価額・損益の計算と翻訳を1か所に置くことで、
「アプリと Web で自分の資産額が違って見える」という事故を構造的に防いでいます。
`packages/core` はビルド成果物ではなく TypeScript のソースをそのまま公開し、
Next は `transpilePackages`、Metro は monorepo 設定で取り込みます。

---

## クイックスタート

```bash
cd kura
npm install                      # workspaces 一括インストール

# --- Web ---
cp apps/web/.env.example apps/web/.env.local     # Supabase の値を記入
npm run dev                                      # http://localhost:3000

# --- Mobile ---
cp apps/mobile/.env.example apps/mobile/.env     # 同上（EXPO_PUBLIC_ 接頭辞）
npm run mobile                                   # Expo Dev Server
```

DB は Supabase Dashboard → SQL Editor で `supabase/migrations/` を**番号順に**実行。
手順の詳細は [`LAUNCH.md`](./LAUNCH.md)、ストア提出は [`docs/STORE.md`](./docs/STORE.md)。

```bash
npm test           # 共有ロジックのユニットテスト
npm run typecheck  # 全ワークスペース
npm run lint       # Web
npm run build      # Web 本番ビルド
```

---

## このアプリの設計思想

**1. 価格には必ず出所がつく**

表示するすべての価格に、参照元・取得日時・信頼度ラベルが伴います。
根拠が薄い価格は表示せず「データ不足」と明示します。
これは正確性のためであると同時に、法的な安全性のためでもあります。

**2. 欠損値は 0 ではない**

価格が取得できない銘柄の評価額は `null` であり、合計から**除外**されます。
0円として合計に含めると、実在しない損失を表示することになります。
為替レートが引けない場合も同様に「評価額不明」として扱います。
この不変条件は `packages/core/src/calc.ts` に閉じ込め、テストで固定しています。

**3. 投資助言をしない**

「買い時」「売り時」「推奨」といった表現を UI に一切使いません。
価格の上下は事実として表示するだけです。免責表示は全画面に常設されます。

**4. 他人のブランド資産を使わない**

公式商品画像・ロゴは一切保持しません。画像はユーザー自身が撮影したものか、
自作のカテゴリアイコンのみです。商品名・型番は記述的使用に留めます。

---

## データソース

3層構造です（詳細と調査結果は [`docs/RESEARCH.md`](./docs/RESEARCH.md)）。

| カテゴリ | ソース | 価格の性質 |
|---|---|---|
| トレカ（MTG） | **Scryfall**（無料・認証不要） | 市場価格 ◎ |
| ポケモンカード | **Pokémon TCG API** | 市場価格 ◎ |
| 遊戯王 / 時計 / スニーカー | eBay Browse API | **出品価格** △ |
| 時計 / バッグ / スニーカー | **楽天市場**（無料・JPY 建て） | **出品価格** △ |
| バッグ（エルメス等） | 管理画面から手動登録（出典 URL 必須） | 買取価格表など ○ |
| **全カテゴリ** | **利用者が投稿した売却実績** | **実売価格** ◎ |

> **重要**: eBay と楽天の値は落札価格ではなく**出品価格**です。
> Marketplace Insights API（落札実績）は Limited Release で、申請しても
> 一般開発者には付与されません。この制約は `docs/RESEARCH.md` §1 に記載しています。
>
> **実売価格が取れる無料 API は存在しません。** ヤフオク!は検索 API の一般提供が
> 終了し、メルカリには公開 API がありません。したがって実売価格は
> **利用者の投稿から作ります**（`docs/RESEARCH.md` §8）。
> 1人が相場を動かせないよう「1人1票・投稿者3人未満は非公開・180日の窓」を
> **DB 側で**強制しています。個別の投稿は他人から読めません。
>
> **Scryfall のデータは有料プランの背後に置けません**（規約上の制約）。
> 収益化を設計する際は `docs/RESEARCH.md` §7.1 を必ず読んでください。

**スクレイピングは一行も含まれていません。**

---

## セキュリティ

| 項目 | 実装 |
|---|---|
| 認可 | 全ユーザーテーブルで RLS 有効。API 層でも `user_id` を再検証 |
| 整合性 | 保有数が負になる取引を**DBトリガー**で拒否（クライアント検証に依存しない） |
| 管理者権限 | `is_admin()` を DB 側で再チェックする SECURITY DEFINER 関数経由のみ |
| Service role キー | Cron のみが使用。コンポーネントからは import しない |
| 入力検証 | Zod スキーマを Web / Mobile で共有。サーバー側でも再検証 |
| モバイル認証情報 | **OS のキーチェーン**（expo-secure-store）に保存。平文保存しない |
| 画像 | Web はマジックナンバー検証、両方とも再エンコードしてから保存 |
| ストレージ | 非公開バケット。`{user_id}/` 配下のみ読み書き可 |
| CSP | 外部スクリプトホストを許可しない |
| ログ | 価格・保有内容を出力しない |
| 依存関係 | 実行時に届く脆弱性 0 件。残る `uuid@7`（moderate）は `expo prebuild` 用のビルドツール経由で、**アプリのバンドルには含まれません**（理由は `package.json` の `//audit-uuid`） |

---

## ネーミング

作業名は `KURA / 蔵` ですが **商標調査は未実施** です。

ブランド名は `packages/core/src/brand.ts` の1ファイルに集約し、
Web・Mobile の全画面がそこを参照します。改名（あるいは買い手によるリブランド）は
1ファイルの変更で完了します。

⚠️ ただし**アプリのバンドル ID（`com.kuraapp.kura`）はストア登録後に変更できません**。
公開前に J-PlatPat で第9類（ソフトウェア）・第36類（金融・資産管理）の
称呼類似検索を行ってください。シンガポール展開時は IPOS でも別途調査が必要です。

---

## ライセンス

© 2026. All rights reserved.
