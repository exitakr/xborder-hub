# X Border Hub

> 海外で働く前に、"答え合わせ"ができる場所。  
> crossing borders, one career at a time.

## ファイル構成

```
/
├── app/                      # Next.js App Router(新規ページはここに追加)
│   ├── layout.tsx            # ルートレイアウト(メタデータ・フォント設定)
│   ├── page.tsx              # / → /index.html へリダイレクト
│   ├── not-found.tsx         # / → /404.html へリダイレクト
│   └── globals.css           # Tailwind エントリ
├── lib/
│   └── supabase/
│       ├── client.ts         # ブラウザ用 Supabase クライアント
│       └── server.ts         # サーバー用 Supabase クライアント
├── public/                   # 静的ファイル(従来のサイト一式)
│   ├── index.html            # ランディング
│   ├── home.html             # アプリホーム
│   ├── search.html           # フロー検索
│   ├── profile.html          # プロフィール詳細
│   ├── mypage.html           # マイページ
│   ├── premium.html          # プレミアム案内
│   ├── login.html            # ログイン(現状はダミー)
│   ├── chat.html             # チャット
│   ├── threads.html          # スレッド一覧
│   ├── thread.html           # スレッド詳細
│   ├── thread-new.html       # スレッド新規作成
│   ├── 404.html              # 404
│   ├── styles.css            # 共通スタイル
│   ├── home.js               # ホーム: 地図 + トレンド
│   ├── search.js             # 検索: フィルタ + 結果計算
│   ├── map-data.js           # 都市・移動・トレンドデータ
│   ├── favicon.svg
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
├── next.config.ts            # /home → /home.html などのリライト + セキュリティヘッダ
├── tailwind.config.ts        # カラートークン
├── tsconfig.json
└── .env.example              # Supabase の環境変数テンプレート
```

## アーキテクチャ

現在は **Next.js シェル + 既存の静的 HTML を `public/` から配信** するハイブリッド構成です。
段階的に各 HTML を `app/` 配下の TSX へ移植しつつ、Supabase Auth/DB を追加していきます。

- `/` は `public/index.html` を表示
- `/home`、`/search` などのクリーン URL は `next.config.ts` のリライトで `*.html` に解決
- 直リンク `/home.html` も従来通り動作

## セットアップ

```bash
# 依存関係をインストール
npm install

# 環境変数を用意(Supabase プロジェクトを作成して値を入れる)
cp .env.example .env.local

# 開発サーバー
npm run dev          # http://localhost:3000

# 型チェック
npm run typecheck

# 本番ビルド
npm run build && npm start
```

## デプロイ

`next.config.ts` を持つ Next.js プロジェクトとしてデプロイします。

**Vercel** (推奨):
```bash
npx vercel deploy --prod
```

Vercel ダッシュボードで `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定してください。

## 設計仕様

### カラーパレット (French Blue)
| 名前 | コード | 用途 |
|------|--------|------|
| French Blue | `#0055A4` | 主要アクセント・CTA |
| Ink | `#0A1F3D` | テキスト・枠線・影 |
| Cream | `#FFF6E8` | 背景 |
| Paper | `#FBF0DD` | カード背景 |
| Mustard | `#FFC93C` | サブアクセント・スタンプ |
| Jade | `#4ECDC4` / `#1FA89E` | 補助アクセント |
| Plum | `#6B4F8E` | フロー色 |

### フォント
- **Display** (見出し): Bricolage Grotesque
- **Body** (本文): Manrope
- **Italic** (装飾): Instrument Serif
- **日本語**: Zen Kaku Gothic New

### コピー禁止用語
以下の単語は意図的に避けています:
- ❌ 人的資本
- ❌ 可視化
- ❌ プラットフォーム
- ❌ インフラ

代替表現として「軌跡」「道」「場所」「ハブ」「コミュニティ」を使用。

## カスタマイズ

### コンテンツ更新
- ビジョン/メッセージ: `public/index.html` の各セクション
- 地図データ: `public/map-data.js` の `regions` オブジェクト
- トレンドデータ: `public/map-data.js` の `trends` オブジェクト
- 検索の選択肢: `public/search.js` の `options` オブジェクト

### カラー変更
`public/styles.css` の色トークンと `tailwind.config.ts` を揃えて変更。

## ロードマップ

- [x] **Phase 1**: Next.js 足場 + 既存 HTML を `public/` から配信(現在地)
- [ ] **Phase 2**: 各 HTML を App Router の TSX に段階移植・共通レイアウト抽出
- [ ] **Phase 3**: Supabase Auth でログイン/サインアップを実装、middleware でセッション保護
- [ ] **Phase 4**: DB スキーマ(`profiles` / `cities` / `moves` / `threads` / `messages`)+ RLS、ハードコードを Supabase クエリに置換
- [ ] **Phase 5**: CSP/セキュリティヘッダ強化、依存脆弱性 CI、入力サニタイズ
- [ ] **Phase 6**: 決済(Stripe Connect)、メール(Resend)、多言語(DeepL)、利用規約・プライバシー・PDPA

## ライセンス

© 2026 X Border Hub. All rights reserved.
