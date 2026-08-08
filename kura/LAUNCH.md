# 公開までの手順書

> コードで代行できない作業だけをまとめています。
> Vercel にデプロイできていても、**A〜C が全部 ✅ になるまで本番公開しないでください。**

---

## A. Supabase（必須・あなたしかできない）

### A-1. プロジェクト作成
- [ ] https://supabase.com でプロジェクトを作成（リージョンは **Tokyo (ap-northeast-1)** 推奨）
- [ ] Settings → API から以下を控える
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`（**絶対に公開しない**）

### A-2. マイグレーションを番号順に実行
SQL Editor に貼り付けて実行します。**順番を守ってください。**

- [ ] `supabase/migrations/0001_init.sql`
      テーブル・インデックス・**RLS**・ストレージバケット・退会用関数
      末尾に RLS の検査があり、有効化漏れがあれば例外で止まります
- [ ] `supabase/migrations/0002_seed_catalogue.sql`
      銘柄マスタ 約50件（時計 / スニーカー / カード / バッグ）
- [ ] `supabase/migrations/0003_admin_curation.sql`
      管理者による価格登録用の関数
- [ ] `supabase/migrations/0004_transaction_integrity.sql`
      **保有数が負になる取引を DB 側で拒否するトリガー。**
      モバイルアプリは PostgREST に直接書き込むため、これがないと
      アプリ側の検証を迂回して不整合なデータを作れてしまいます
- [ ] `supabase/migrations/0005_price_sources.sql`
      MTG を Scryfall、ポケモンカードを Pokémon TCG API に切り替え
      （どちらも無料で**市場価格**を返すため eBay の出品価格より高品質）
- [ ] `supabase/migrations/0006_community_prices.sql`
      利用者が投稿した**実売価格**の集計基盤と、楽天市場ソースの追加。
      時計・バッグ・スニーカーには無料の実売価格 API が存在しないため、
      **投稿者3人以上**が集まった銘柄でのみ相場を公開します
      （1〜2件は相場ではなく個別事例のため非公開。詳細は `docs/RESEARCH.md` §8）
- [ ] `supabase/migrations/0007_self_reported_prices.sql`
      自動取得できない銘柄に、利用者自身が評価額と情報源を登録できるようにします。
      **登録内容は本人のポートフォリオにのみ反映され、他の利用者には見えません**
      （0006 のコミュニティ集計とは別物です）。合計評価額に自己申告値が
      含まれる場合は、その旨がポートフォリオ画面に表示されます
- [ ] `supabase/migrations/0008_user_added_items.sql`
      利用者が Browse からカタログに無い銘柄を自分で追加できるようにする
      `create_market_item` 関数、`car`（高級車）カテゴリ、日英バイリンガル
      検索用の `aliases` 列を追加します
- [ ] `supabase/migrations/0009_bags_cars_and_aliases.sql`
      バッグ16件・高級車14件をカタログに追加し、既存バッグにも日本語の
      別名（エルメス／ルイヴィトン／シャネル 等）を設定します。
      **高級車は eBay Motors の出品価格を使うため、ノイズが多くなります**
      （中古車情報サイトの公開 API は存在しないため、この App が持つ
      唯一の無料手段です。詳細は `docs/RESEARCH.md` §9）

### A-3. 認証設定
- [ ] Authentication → URL Configuration
  - Site URL: `https://<本番ドメイン>`
  - Redirect URLs: `https://<本番ドメイン>/auth/callback` と
    `http://localhost:3000/auth/callback`
- [ ] Google OAuth を使う場合: Authentication → Providers → Google を有効化し、
      Google Cloud Console で発行した Client ID / Secret を設定
- [ ] Authentication → Email templates の確認リンクを
      `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` 形式にする
      （**これをしないと、登録した端末と別の端末でメール確認したときに失敗します**）

### A-4. 管理者アカウント
- [ ] 自分のアカウントでサインアップ後、SQL Editor で:
```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'あなたのメールアドレス');
```
- [ ] `/admin/prices` が開けることを確認

### A-5. ⚠️ 無料枠のままにしない
- [ ] **Pro プラン（$25/月）への移行を推奨**
      無料枠は **7日間アクセスがないとプロジェクトが自動停止** します。
      公開後に停止すると Cron が失敗し続け、稼働率の断絶は売却時の
      デューデリジェンスで必ず指摘されます。
      画像ストレージも無料枠 1GB（約660人分）で先に埋まります。

---

## B. Vercel（Web 版）

- [ ] リポジトリを接続し、**Root Directory を `kura/apps/web` に設定**（重要）
- [ ] Install Command は既定のままで可（workspaces のルートから解決されます）
- [ ] 環境変数を設定（すべて Production / Preview 両方に）

| 変数 | 値 | Sensitive |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public キー | — |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role キー | ✅ **必ずチェック** |
| `EBAY_CLIENT_ID` | eBay App ID | ✅ |
| `EBAY_CLIENT_SECRET` | eBay Cert ID | ✅ |
| `POKEMONTCG_API_KEY` | pokemontcg.io の API キー（任意だが推奨） | ✅ |
| `RAKUTEN_APPLICATION_ID` | 楽天ウェブサービスのアプリ ID（時計/バッグ/スニーカーの JPY 相場） | ✅ |
| `CRON_SECRET` | `openssl rand -hex 32` の出力 | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://<本番ドメイン>` | — |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 問い合わせ先アドレス | — |

- [ ] デプロイ後、Cron が登録されていることを確認
      （Settings → Cron Jobs に `/api/cron/refresh-prices` が 20:00 UTC で表示される）
- [ ] 手動で疎通確認:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<本番ドメイン>/api/cron/refresh-prices
# {"ok":true,"updated":N,...} が返ればOK
```

---

## B-2. モバイルアプリ（App Store / Google Play）

手順とストア掲載文は **[`docs/STORE.md`](./docs/STORE.md)** にまとめてあります。
最低限、以下は着手前に把握してください。

- [ ] `eas init` で `app.json` の `projectId` を実 ID に置き換える（現在はダミー）
- [ ] `eas.json` の `submit.production` に App Store Connect の ID 類を記入
- [ ] ⚠️ **審査用デモアカウントを用意する**（保有データを数件入れた状態で）。
      未提出だとログイン必須アプリはほぼ確実に差し戻されます
- [ ] ⚠️ **バンドル ID `com.kuraapp.kura` は登録後に変更できません。**
      商標調査（§D）を先に済ませてください
- [ ] 価格が実際に入った状態で提出する（「データ不足」だらけだと機能不全と見なされます）

---

## B-3. 楽天ウェブサービス（時計・バッグ・スニーカーの日本相場）

eBay より取得が速く、**JPY 建て**なので日本の相場に近い数字が出ます。
eBay キーの取得を待っている間でも、これだけで該当カテゴリに価格が入ります。

- [ ] https://webservice.rakuten.co.jp で楽天アカウントでログイン
- [ ] 「アプリ ID 発行」からアプリを登録（審査なし・即時発行）
- [ ] 発行された **applicationId** を Vercel の `RAKUTEN_APPLICATION_ID` に設定
- [ ] ⚠️ 規約により**出典表示が必須**です。銘柄詳細画面に自動表示されます（削除しないこと）
- [ ] ⚠️ これも**出品価格**であり落札価格ではありません。実売価格は §B-4 で扱います

---

## B-4. 実売価格（コミュニティ投稿）の立ち上げ

時計・バッグ・スニーカーに**無料の実売価格 API は存在しません**（調査結果は
`docs/RESEARCH.md` §8）。そのため利用者の投稿から相場を作る設計にしています。

- [ ] マイグレーション `0006` が適用済みであることを確認
- [ ] ⚠️ **投稿者が3人集まるまで、その銘柄の相場は表示されません。**
      1〜2件は相場ではなく個別事例のため、意図的に非公開にしています
- [ ] クローズドベータで**主要銘柄に3人以上の投稿を集める**ことを最初の目標にする
      （これが埋まらないと、この機能は利用者から見て存在しないのと同じです）
- [ ] 投稿インセンティブはマイページの貢献度表示です。
      「相場公開に貢献した銘柄数」が伸びることが投稿の動機になります

---

## C. eBay Developer Program

- [ ] https://developer.ebay.com でアカウント作成
- [ ] **Production** キーセットを取得（Sandbox ではありません）
- [ ] 必要なスコープは `https://api.ebay.com/oauth/api_scope` のみ。
      Browse API は制限付き API ではないため、申請は不要です
- [ ] ⚠️ **Marketplace Insights API は申請しないでください**（時間の無駄です）。
      Limited Release であり、申請しても一般開発者には付与されません。
      詳細は `docs/RESEARCH.md` §1

---

## D. 法務（公開前に必ず）

- [ ] **商標調査** — J-PlatPat で `KURA` / `蔵` の第9類・第36類 称呼類似検索
      https://www.j-platpat.inpit.go.jp/
      抵触する場合は `lib/brand.ts` の `name` / `nameJa` を変更するだけで改名できます
- [ ] シンガポール展開時は IPOS でも別途調査
      https://www.ipos.gov.sg/
- [ ] 利用規約・プライバシーポリシーの弁護士レビュー
      （`app/legal/terms`, `app/legal/privacy` に日英の草案があります）
- [ ] 日本で有料化する場合は **特定商取引法に基づく表記** ページを追加
- [ ] シンガポールの個人データを扱うため **PDPA** の DPO 指定要否を確認
- [ ] 「買い時 / 売り時 / 推奨」等の表現が UI に混入していないか最終確認
      （投資助言に該当するリスクを避けるため）

---

## E. 公開前の動作確認

- [ ] 2つの別アカウントでログインし、**互いの保有データが見えない**ことを確認
      （RLS の実地テスト。最重要）
- [ ] 価格が未取得の銘柄を保有しても、合計評価額が壊れないことを確認
- [ ] iPhone SE 幅（375px）で全画面が破綻しないことを確認
- [ ] キーボードのみ（Tab / Enter）で登録〜取引入力まで到達できることを確認
- [ ] OS の「視差効果を減らす」を有効にして、チャートのアニメーションが止まることを確認
- [ ] 退会機能を実行し、holdings / transactions / Storage の画像が消えることを確認
- [ ] `npm audit` に高危険度の脆弱性がないことを確認

---

## F. 公開後（成長と資産価値のため）

- [ ] Google Search Console にドメインを登録
- [ ] Sentry を導入（`@sentry/nextjs`。SPEC Month 3 の項目、未実装）
- [ ] 銘柄マスタを各カテゴリ 30〜50 件まで拡充
      （現状は約50件。`0002_seed_catalogue.sql` と同じ形式で追加）
- [ ] クローズドベータ 20 名程度で運用し、Layer 3 の取引実績を蓄積し始める
      — **これが将来の最大の差別化要因かつ売却価値になります**
