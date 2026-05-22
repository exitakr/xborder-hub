# X Border Hub

> 海外で働く前に、"答え合わせ"ができる場所。  
> crossing borders, one career at a time.

## ファイル構成

```
/
├── app/                      # Next.js App Router(全ルート TSX 化済み)
│   ├── layout.tsx            # ルートレイアウト(メタデータ・フォント・/styles.css)
│   ├── globals.css           # Tailwind + ページ固有の小スタイル
│   ├── page.tsx              # / ランディング
│   ├── not-found.tsx         # 404
│   ├── profile/page.tsx      # プロフィール詳細
│   ├── mypage/               # マイページ(フル Client Component)
│   ├── premium/              # プレミアム案内 + Stripe スタブ
│   ├── threads/              # スレッド一覧(フィルタ・ソート・投票)
│   ├── thread/               # スレッド詳細 + コメント
│   ├── thread/new/           # スレッド新規作成(3 ステップ)
│   ├── chat/                 # トークルーム
│   └── search/               # フロー検索(フィルタ + 申請モーダル)
├── components/
│   └── site/                 # 共通コンポーネント
│       ├── LogoMark.tsx
│       ├── LandingHeader.tsx
│       ├── LandingFooter.tsx
│       ├── AppHeader.tsx
│       ├── BottomNavMobile.tsx
│       └── SideNavMenu.tsx
├── lib/
│   └── supabase/
│       ├── client.ts         # ブラウザ用 Supabase クライアント
│       └── server.ts         # サーバー用 Supabase クライアント
├── public/                   # 静的アセットと redesign 待ちのリファレンス
│   ├── home.html             # ※リデザイン予定(/home からは未配信)
│   ├── login.html            # ※リデザイン予定(/login からは未配信)
│   ├── home.js               # home.html のスクリプト
│   ├── map-data.js           # home.html が参照するデータ
│   ├── styles.css            # 共通スタイル(layout から <link>)
│   ├── favicon.svg
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
├── next.config.ts            # セキュリティヘッダ
├── tailwind.config.ts        # カラートークン
├── tsconfig.json
└── .env.example              # Supabase の環境変数テンプレート
```

## アーキテクチャ

すべての公開ルートが **Next.js App Router** で動いています。
旧 `home.html` / `login.html` だけは `/home`・`/login` クリーン URL から外し、
リデザイン待ちのリファレンスとして `public/` に残してあります(直リンク
`/home.html` で閲覧可能)。

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

- [x] **Phase 1**: Next.js 足場 + 既存 HTML を `public/` から配信
- [x] **Phase 2**: index / 404 / profile / premium / mypage / threads / thread / thread/new / chat / search を App Router の TSX に移植
- [x] **Phase 3**: Supabase Auth(メール+パスワード / Magic Link)、middleware でセッション保護、新 `app/login` 設計
- [x] **Phase 3+**: ホーム画面の UI 再設計 → 新 `app/home`(マップ中心、地域ピル内包、トレンドストリップ、注目スレッド、新着フィード、CTA カード)
- [ ] **Phase 4**: DB スキーマ(`profiles` / `cities` / `moves` / `threads` / `messages`)+ RLS、ハードコードを Supabase クエリに置換
- [ ] **Phase 5**: CSP/セキュリティヘッダ強化、依存脆弱性 CI、入力サニタイズ
- [ ] **Phase 6**: 決済(Stripe Connect)、メール(Resend)、多言語(DeepL)、利用規約・プライバシー・PDPA

## 認証フロー

- `/login` でメール+パスワード、新規登録、Magic Link の 3 モード切替
- Server Actions(`app/login/actions.ts`)が Supabase に投げる
- OAuth/Magic Link は `/auth/callback` がコードをセッションに交換
- `middleware.ts` が:
  - 全リクエストで Supabase セッション cookie をリフレッシュ
  - `/mypage` `/chat` `/profile` 系の未ログインアクセスを `/login?next=...` へリダイレクト
  - ログイン済みで `/login` に来た場合は `/mypage` へ
- Supabase ダッシュボードで **Site URL** と **Redirect URL** を以下に設定済みのこと:
  - 開発: `http://localhost:3000`, `http://localhost:3000/auth/callback`
  - 本番: Vercel のドメイン

## ライセンス

© 2026 X Border Hub. All rights reserved.
