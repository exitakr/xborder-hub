# KURA / 蔵

> コレクションを、資産として見る。
> A portfolio tracker for collectible assets — trading cards, watches, bags, sneakers.

トレーディングカード・高級時計・ハイブランドバッグ・スニーカーなどの
「コレクタブル資産」を、株式ポートフォリオのように管理・可視化するアプリ。
日本語 / 英語、JPY / SGD / USD に対応。

⚠️ **ブランド名は商標未確認です。** 詳細は下記「ネーミング」を参照。

---

## クイックスタート

```bash
cd kura
npm install
cp .env.example .env.local     # Supabase の値を記入
npm run dev                    # http://localhost:3000
```

DB を用意する場合は Supabase Dashboard → SQL Editor で
`supabase/migrations/` を **番号順に** 実行してください。
手順の詳細は [`LAUNCH.md`](./LAUNCH.md)。

```bash
npm run typecheck   # tsc --noEmit
npm test            # 計算ロジックのユニットテスト
npm run lint
npm run build
```

---

## このアプリの設計思想

**1. 価格には必ず出所がつく**

表示するすべての価格に、参照元・取得日時・サンプル件数・信頼度ラベルが伴います。
根拠が薄い価格は表示せず「データ不足」と明示します。
これは正確性のためであると同時に、法的な安全性のためでもあります。

**2. 欠損値は 0 ではない**

価格が取得できない銘柄の評価額は `null` であり、合計から**除外**されます。
0円として合計に含めると、実在しない損失を表示することになります。
この不変条件は `lib/calc.ts` に閉じ込め、ユニットテストで固定しています。

**3. 投資助言をしない**

「買い時」「売り時」「推奨」といった表現を UI に一切使いません。
価格の上下は事実として表示するだけです。免責表示は全画面のフッターに常設され、
ルートレイアウトが描画するのでページ側で外すことができません。

**4. 他人のブランド資産を使わない**

公式商品画像・ロゴは一切保持しません。画像はユーザー自身が撮影したものか、
自作のカテゴリアイコンのみです。商品名・型番は記述的使用に留めます。

---

## ディレクトリ構成

```
kura/
├── app/
│   ├── layout.tsx              # 全画面共通のヘッダ・フッタ・免責表示
│   ├── page.tsx                # ランディング（未ログイン）
│   ├── login/ signup/          # 認証（パスワード / マジックリンク / Google）
│   ├── auth/callback/          # OAuth・メール確認のコード交換
│   ├── portfolio/              # ホーム。総評価額・構成比・保有一覧
│   ├── market/                 # 銘柄検索・保有への追加
│   ├── items/[id]/             # ★銘柄詳細。チャート + 売買マーカー + 取引履歴
│   ├── mypage/                 # 表示名・通貨・言語・アカウント削除
│   ├── admin/prices/           # 価格キュレーション（管理者のみ）
│   ├── legal/                  # 利用規約・プライバシーポリシー（日英）
│   └── api/cron/refresh-prices # 日次価格更新（Vercel Cron）
├── components/                 # 共通 UI
├── lib/
│   ├── brand.ts                # ★ブランド名の唯一の定義箇所
│   ├── calc.ts                 # ★計算ロジック（純粋関数・テスト付き）
│   ├── calc.test.ts
│   ├── ebay.ts                 # eBay Browse API クライアント
│   ├── money.ts                # 通貨換算・書式
│   ├── image.ts                # 画像検証・リサイズ（マジックナンバー検証）
│   ├── i18n/dict.ts            # 日英の全 UI 文字列
│   ├── portfolio.ts            # ポートフォリオのデータ読み込み
│   └── supabase/               # client / server / admin(service role)
├── supabase/migrations/        # スキーマ・RLS・シード
├── docs/RESEARCH.md            # ★実装前調査の報告（仕様書 付録への回答）
└── LAUNCH.md                   # 公開までの手順書
```

---

## データソース

3層構造です（詳細と調査結果は [`docs/RESEARCH.md`](./docs/RESEARCH.md)）。

| Layer | 内容 | 状態 |
|---|---|---|
| 1 | eBay Browse API による出品価格の中央値 | 実装済み・日次自動 |
| 2 | 管理者による手動キュレーション（出典 URL 必須） | 実装済み・`/admin/prices` |
| 3 | ユーザー投稿の取引実績 | **蓄積のみ**。価格表示には未使用（Phase 2） |

> **重要**: Layer 1 は落札価格ではなく**出品価格**です。
> eBay の Marketplace Insights API（落札実績）は Limited Release で、
> 申請しても一般開発者には付与されません。この制約と対応は
> `docs/RESEARCH.md` §1 に記載しています。

**スクレイピングは一行も含まれていません。**

---

## セキュリティ

| 項目 | 実装 |
|---|---|
| 認可 | 全ユーザーテーブルで RLS 有効。API 層でも `user_id` を再検証 |
| 管理者権限 | `is_admin()` を DB 側で再チェックする SECURITY DEFINER 関数経由のみ |
| Service role キー | Cron のみが使用。コンポーネントからは import しない |
| 入力検証 | Zod でサーバーサイド検証。クライアント検証には依存しない |
| 画像 | マジックナンバーで形式判定。Canvas で再エンコードしてから保存 |
| ストレージ | 非公開バケット。`{user_id}/` 配下のみ読み書き可 |
| XSS | `dangerouslySetInnerHTML` 不使用 |
| CSP | 外部スクリプトホストを許可しない |
| ログ | 価格・保有内容を出力しない |

---

## ネーミング

作業名は `KURA / 蔵` ですが **商標調査は未実施** です。

ブランド名は `lib/brand.ts` の1ファイルに集約し、全画面がそこを参照します。
ロゴやアプリ名をコンポーネントに直接書いていないため、
改名（あるいは買い手によるリブランド）は1ファイルの変更で完了します。

公開前に J-PlatPat で第9類（ソフトウェア）・第36類（金融・資産管理）の
称呼類似検索を行ってください。シンガポール展開時は IPOS でも別途調査が必要です。

---

## ライセンス

© 2026. All rights reserved.
