# X Border Hub

> 海外で働く前に、"答え合わせ"ができる場所。  
> crossing borders, one career at a time.

## ファイル構成

```
/
├── index.html         # ランディング/サービス概要(エントリーポイント)
├── home.html          # アプリホーム(移動地図 + トレンド + 新着フィード)
├── search.html        # フロー検索(A→B の経路で人を探す)
├── profile.html       # プロフィール詳細(YT さんサンプル)
├── 404.html           # 404 ページ
│
├── styles.css         # 共通スタイル(色トークン・アニメーション・コンポーネント)
├── home.js            # ホーム: 地図描画 + トレンド切り替え
├── search.js          # 検索: フィルタモーダル + 結果計算
├── map-data.js        # 共有: 都市・移動データ + トレンドデータ
│
├── favicon.svg        # X マーク + マスタードドット
├── manifest.json      # PWA マニフェスト
├── robots.txt         # SEO
└── sitemap.xml        # SEO
```

## 公開方法

### 静的ホスティング (推奨)

任意の静的ホスティングサービスに、上記ファイル一式をアップロードするだけです。
バックエンド不要。すべてクライアントサイドで動作します。

**Vercel** (最も簡単):
```bash
npx vercel deploy --prod
```

**Netlify**:
```bash
npx netlify deploy --prod --dir=.
```

**Cloudflare Pages**:
```bash
npx wrangler pages deploy . --project-name=x-border-hub
```

**GitHub Pages**: ファイルを `main` ブランチに push し、Settings → Pages で有効化。

### ローカル確認

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve

# 任意のサーバー
```

ブラウザで `http://localhost:8000` を開く。

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
- ビジョン/メッセージ: `index.html` の各セクション
- 地図データ: `map-data.js` の `regions` オブジェクト
- トレンドデータ: `map-data.js` の `trends` オブジェクト
- 検索の選択肢: `search.js` の `options` オブジェクト

### カラー変更
`styles.css` の色トークンと、各 HTML 内の `tailwind.config` を一括変更。

## 既知の制限事項

このバージョンはフロントエンドのみのデモです:
- 認証・ユーザー登録は未実装(ボタンのみ)
- データはハードコード
- 投稿・相談予約機能は未実装

本番運用には以下が追加で必要:
- 認証 (Supabase Auth 等)
- データベース (Supabase / Firebase 等)
- 決済 (Stripe Connect)
- メール送信 (Resend)
- 多言語化 (DeepL API)
- 利用規約・プライバシーポリシー・PDPA 対応

## ライセンス

© 2026 X Border Hub. All rights reserved.
