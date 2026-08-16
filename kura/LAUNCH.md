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
- [ ] `supabase/migrations/0010_route_bags_to_rakuten.sql`
      **バッグ26件と日本語ポケカ2件を楽天ソースに割り当てます。**
      0006 は制約に `rakuten` を許可しただけで実際の割り当てが無く、
      `RAKUTEN_APPLICATION_ID` を設定しても楽天が一度も呼ばれない状態でした。
      あわせて、`search_query` が空で永久に価格が付かなかった9件も解消します
- [ ] `supabase/migrations/0011_contact_and_admin_kpis.sql`
      お問い合わせフォームの保存先と、管理ダッシュボードの集計関数
      （KPI・会員一覧・問い合わせ一覧）を追加します。
      **集計関数はすべて `is_admin()` を関数内で再チェック**します
- [ ] `supabase/migrations/0012_japanese_items_use_rakuten.sql`
      **日本語で登録された銘柄を楽天に振り分け**、検索語にカテゴリ名
      （バッグ／腕時計／スニーカー等）を付けます。
      従来は日本語のままeBay（英語圏）に投げていたため一致せず、
      またブランド名だけだとそのブランドの全商品が混ざっていました。
      既存の該当銘柄も修復します
- [ ] `supabase/migrations/0013_price_floor_and_item_removal.sql`
      **下限価格（`min_price`）** を追加します。バーキンが約$202と表示された不具合の
      恒久対策で、検索がアクセサリー（保護カバー・チャーム等）に当たった場合に
      価格を公開しません。あわせて保有削除用の関数と、
      **カルティエの時計・ジュエリー、シェーヌダンクル、バッグのサイズ違いなど35件**
      をカタログに追加します
- [ ] `supabase/migrations/0014_catalogue_images.sql`
      **カード画像**の保存先（`image_url`）を追加します。日次バッチが価格と
      同じレスポンスから画像を拾うため、追加のAPIリクエストは発生しません。
      適用直後は空で、**次回の価格更新が走ったカードから順に画像が付きます**
      （`/admin` の「価格を今すぐ更新」で即座に反映できます）。
      カード以外（時計・バッグ・車等）は仕様上ずっと空のままです（`docs/RESEARCH.md` §13.4）
- [ ] `supabase/migrations/0017_admin_portfolios_and_owner.sql`
      会員ごとのポートフォリオ（評価額・取得額・カテゴリ）と銘柄別の保有者数を
      `/admin` に表示します。あわせて **管理者を exitakr@gmail.com のみに限定**します
      （他アカウントの `is_admin` は false に戻されます）
- [ ] `supabase/migrations/0016_email_health.sql`
      `/admin` に**確認メールの到達状況**（未確認アカウント数・確認率）を表示します。
      確認メールが届いていないことに気づくための唯一の指標です
- [ ] `supabase/migrations/0015_plans_and_limits.sql`
      **登録件数の上限（無料20件）と、無制限プランの権利管理**を追加します。
      上限は **DBのトリガーで強制**されます（アプリはPostgRESTに直接書き込むため、
      UI側のチェックだけでは迂回できてしまいます）。
      ⚠️ **決済は未接続です。** 購入ボタンは意図的に置いていません。
      自分のアカウントを無制限にするには SQL Editor で:
```sql
select public.grant_unlimited(
  (select id from auth.users where email = 'あなたのメールアドレス'),
  'admin', null, null, 'owner'
);
```

### A-2.5. ⚠️ メール送信（Resend + Supabase SMTP）

**新規登録が失敗する最大の原因がここです。必ず実施してください。**

#### なぜ必要か

Supabase の標準メール送信は **1時間に数通**しか送れず、テストでアカウントを
2〜3個作るだけで `429 rate limit` に達します。差出人も
`noreply@mail.app.supabase.io` のままです。

> ⚠️ **重要な前提**: 確認メールを送っているのは**このアプリではなく Supabase 本体**です。
> アプリ側に Resend の API キーを入れるコードを書いても、認証メールには一切影響しません。
> 認証メールを変えられるのは **Supabase プロジェクトの Custom SMTP 設定だけ**です。
> （アプリから送る通知メールを足したい場合は別途 Resend API を使いますが、それとこれは別物です）

#### 送信サービスの選択

| サービス | 無料枠 | SMTP | 備考 |
|---|---|---|---|
| **Brevo**（推奨） | **300通/日**（≈9,000通/月） | ○ | 無期限無料・クレカ不要。この用途では最大 |
| Mailjet | 6,000通/月（200通/日） | ○ | Brevo が使えない場合の次点 |
| Resend | 3,000通/月（100通/日） | ○ | **x-border-hub で消費済み** |
| MailerSend | 500通/月 | ○ | 2025年に大幅減枠。非推奨 |
| Amazon SES | 62,000通/月 | ○ | **EC2 上のアプリ限定**。Vercel では対象外。審査も必要 |

> 確認メールは1人あたり1〜2通です。**300通/日は1日300人の新規登録に耐えます**。
> 当面この規模を超えることはないため、Brevo で十分です。

#### 手順1-A: Brevo の場合（推奨）

> ## ⚠️ 最重要：`Senders` ではなく `Domains` を使うこと
>
> Brevo には送信元を許可する画面が**2つ**あり、片方は行き止まりです。
>
> | 画面 | 方式 | 必要なもの |
> |---|---|---|
> | **Senders**（❌ 使わない） | そのアドレス宛に**確認コードをメール送信** | `noreply@` の**受信箱** |
> | **Domains**（✅ こちら） | **DNS レコード**でドメイン所有を証明 | Cloudflare の DNS のみ |
>
> `noreply@` に受信箱は存在しないので、**Senders では永久に完了できません**。
> ドメイン認証を通せば、`noreply@` も `support@` も**個別確認なしで送信可能**になります。

**A-1. Brevo でドメインを追加**
- [ ] Brevo → **Senders, Domains & Dedicated IPs → Domains** タブ
      （⚠️ 隣の `Senders` タブではありません）
- [ ] **Add a domain** → `ohmyasset.com` を入力
- [ ] 表示される3つのレコードを控える
      - **Brevo code**（TXT）
      - **DKIM**（TXT・ホスト名は `brevo._domainkey`）
      - **DMARC**（TXT・ホスト名は `_dmarc`）

> SPF と MX は**共有IPでは不要**です（Brevo が要求するのは専用IPの場合のみ）。

**A-2. Cloudflare DNS に登録**
- [ ] Cloudflare → `ohmyasset.com` → **DNS → Records → Add record**
- [ ] 3件とも **Type: TXT** で追加

| Name（Cloudflare の入力欄） | Content |
|---|---|
| `@` | Brevo code の値 |
| `brevo._domainkey` | DKIM の値（`k=rsa;p=...`） |
| `_dmarc` | `v=DMARC1; p=none; rua=mailto:あなたのGmail` |

> ⚠️ **Name 欄にドメイン名を含めないでください。**
> Cloudflare は自動でドメインを補完するため、`brevo._domainkey.ohmyasset.com` と
> 入力すると `brevo._domainkey.ohmyasset.com.ohmyasset.com` になり、認証が通りません。
>
> ⚠️ **DMARC レコードは1ドメインに1つだけ**です。既にある場合は追加せず、既存を編集します。
>
> ℹ️ TXT レコードに Proxy（オレンジの雲）の設定はありません。CNAME/A とは異なり
> 気にする必要はありません。

- [ ] Brevo の Domains 画面に戻り **Verify / Authenticate** を実行
- [ ] **Authenticated** になるまで待つ（通常10〜30分、最大24時間）

**A-3. 受信箱を作る（Cloudflare Email Routing・無料）**

ドメイン認証だけで送信はできますが、**`noreply@` 宛の返信は消滅します**。
利用者は確認メールに普通に返信してくるため、受信経路は用意すべきです。

- [ ] Cloudflare → `ohmyasset.com` → **Email → Email Routing** を有効化
- [ ] **Destination addresses** に `exitakr@gmail.com` を追加し、届いた確認リンクを開く
- [ ] **Routing rules** で `support@ohmyasset.com` → Gmail の転送を作成
- [ ] 必要な MX / SPF レコードは Cloudflare が自動追加します（**Add records** を押す）

> 💡 **送信元は `noreply@` より `support@` を推奨します。**
> 返信が届く方が利用者体験として明確に良く、`noreply@` は問い合わせを
> 黙って捨てる設計です。Email Routing を設定すれば、どちらも実在します。

**A-4. Supabase に SMTP を設定** → 下の **手順3** へ進んでください。

---

#### 手順1-B: Resend の場合（無料枠が空いていれば）

> 現在 Resend の無料枠は x-border-hub が消費済みのため、通常は A のままで進めます。

- [ ] Resend に登録し **Domains → Add Domain** でドメインを認証

- [ ] 表示された TXT レコードを Cloudflare DNS に登録し、**Verified** を待つ

> ⚠️ **`onboarding@resend.dev` を使ってはいけません。**
> Resend のテスト用差出人は、**あなた自身のアカウントのメールアドレス宛にしか送れません**。
> 他人のアドレスへの送信は黙って失敗します。
> 「自分では登録できたのに、別のメールアドレスだと登録できない」という症状は、
> ほぼこれが原因です。

#### 手順2: API キーを発行

- [ ] Resend → **API Keys → Create API Key**（権限は `Sending access` で十分）
- [ ] `re_` で始まるキーを控える（**再表示されません**）

#### 手順3: Supabase に SMTP を設定

**Oh My Asset のプロジェクト**（x-border-hub ではありません）で:

- [ ] Supabase → **Project Settings → Authentication → SMTP Settings**
- [ ] `Enable Custom SMTP` を ON にして以下を入力

| 項目 | 値 |
|---|---|
| Sender email | `support@<認証したドメイン>`（返信が届くため推奨） |
| Sender name | `Oh My Asset` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` ← **固定文字列。メールアドレスではありません** |
| Password | 手順2の `re_...` API キー |

- [ ] **Save** を押す（押し忘れが非常に多いです）

#### 手順4: レート制限を上げる

- [ ] Supabase → **Authentication → Rate Limits** →
      `Rate limit for sending emails` を引き上げる（例: 100/時）

> ⚠️ 独自SMTPにしても**ここが既定値のままだと同じ症状が続きます**。
> SMTP 設定とレート制限は別々の設定です。

#### 手順5: 確認

- [ ] `/admin` の **「確認メールの到達状況」→「テスト送信」** に自分のアドレスを入れて送信
      （新規アカウントは作られません。エラーが出た場合は原文がそのまま表示されます）
- [ ] **別のメールアドレス**で実際に新規登録し、自分のドメインから届くことを確認
- [ ] リンクを開いて、そのままログイン状態になることを確認

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
- [ ] `/admin`（管理ダッシュボード）が開けることを確認

### A-5. ⚠️ 無料枠のままにしない
- [ ] **Pro プラン（$25/月）への移行を推奨**
      無料枠は **7日間アクセスがないとプロジェクトが自動停止** します。
      公開後に停止すると Cron が失敗し続け、稼働率の断絶は売却時の
      デューデリジェンスで必ず指摘されます。
      画像ストレージも無料枠 1GB（約660人分）で先に埋まります。

---

## B. Vercel（Web 版）

- [ ] リポジトリを接続し、**Root Directory を `apps/web` に設定**（重要）
- [ ] 実行リージョンが **東京（hnd1）** であることを確認（`vercel.json` で指定済み）

> **なぜ東京固定なのか**: 未指定だと Vercel の既定は `iad1`（米国東部）です。
> DB は東京（ap-northeast-1）、利用者も日本にいるため、
> サーバー描画のたびに**クエリ1本ごとに太平洋を往復**していました。
> 1ページで複数クエリを投げるので、これが体感遅延の主因になります。
> 同居させると 1 クエリあたり約150ms → 約5ms になります。
>
> ⚠️ `vercel.json` は**スキーマ検証が厳格**で、未知のキーがあると
> `should NOT have additional property` でデプロイ全体が失敗します。
> JSON にコメントは書けないため、意図はこのファイルに記載しています。
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

- [ ] デプロイ後、Cron が登録されていることを確認
      （Settings → Cron Jobs に `/api/cron/refresh-prices` が 20:00 UTC で表示される）
- [ ] 手動で疎通確認: **`/admin` の「価格を今すぐ更新」ボタン**を押す
      （管理者アカウントでログインした状態。スマホからでも実行できます）
      結果の JSON がその場に表示され、`updated` が 1 以上なら成功です

> `CRON_SECRET` はサーバー側にしか存在しないため、ボタンは
> サーバーアクション経由で Cron エンドポイントを呼びます。
> ターミナルから直接叩くことも引き続き可能です:
> ```bash
> curl -H "Authorization: Bearer $CRON_SECRET" https://<本番ドメイン>/api/cron/refresh-prices
> ```

---

## B-1. 独立ドメイン `ohmyasset.com` への移行

> **なぜやるか**: `kura.xbordercareer.com` は無関係な親ドメインのサブドメインで、
> 買い手に譲渡できません（親ドメインごと渡すか、全URLを捨てるかの二択）。
> インデックスが育つほど移行コストが上がるため、**早いほど安く済みます**。

### ステップ1: Cloudflare で取得
- [ ] Cloudflare → Domain Registration → Register Domain → `ohmyasset.com`
- [ ] 取得すると DNS ゾーンは自動作成されます（ネームサーバ変更は不要）

### ステップ2: Vercel に追加
- [ ] Vercel → **my-asset-app** → Settings → Domains → `ohmyasset.com` を Add
- [ ] `www.ohmyasset.com` も Add し、`ohmyasset.com` への **Redirect** に設定
- [ ] Vercel が表示する **CNAME / A レコードの値をそのまま** Cloudflare DNS に登録
      （⚠️ 値はプロジェクトごとに異なります。他所で見た汎用値を使わないこと）
- [ ] ⚠️ **該当レコードの Proxy を OFF（グレーの雲）にする。**
      ON のままだと Vercel の証明書発行が失敗します
- [ ] Vercel の Domains 画面が **Valid Configuration** になるまで待つ（5〜30分）

### ステップ3: アプリ側の設定（忘れると本番が壊れます）

| 場所 | 設定 | 値 |
|---|---|---|
| Vercel → Environment Variables | `NEXT_PUBLIC_SITE_URL` | `https://ohmyasset.com` |
| Supabase → Authentication → URL Configuration | Site URL | `https://ohmyasset.com` |
| 同上 → Redirect URLs | 追加 | `https://ohmyasset.com/auth/callback` |
| 同上 → Redirect URLs | **残す** | `https://kura.xbordercareer.com/auth/callback` |

- [ ] `NEXT_PUBLIC_SITE_URL` 変更後は **Redeploy**（ビルド時に埋め込まれるため）
- [ ] 旧 Redirect URL を**すぐ消さない**。移行前に送信済みの確認メールが死にます

> sitemap / robots / canonical / OG URL はすべて `NEXT_PUBLIC_SITE_URL` を
> 参照しているため、コード側で直す箇所はありません。

### ステップ4: メール送信ドメインの切り替え
- [ ] 送信元を `noreply@ohmyasset.com` に変更（A-2.5 の SMTP 設定）
- [ ] **新ドメインで SPF / DKIM / DMARC を再設定**
      （ドメインが変われば認証もやり直しです。ここを忘れると迷惑メール行きになります）

### ステップ5: 旧URLを捨てない
- [ ] Vercel で `kura.xbordercareer.com` を **301 リダイレクト**として残す
      （親ドメインを保有する限り無料。インデックスの評価が引き継がれます）
- [ ] Google Search Console に新ドメインを登録し、**アドレス変更ツール**を実行

### ステップ6: モバイルアプリ
- [ ] `app.json` の `scheme`（`oma`）は**変更不要**（ディープリンクはスキーム経由）
- [ ] Supabase の Redirect URLs に `oma://` が入っていることを再確認
- [ ] ⚠️ バンドルID `com.ohmyasset.app` は**すでに新ドメインと整合**。変更不要

### ステップ7: 確認
- [ ] `https://ohmyasset.com` が表示される
- [ ] 旧 `kura.xbordercareer.com` が新ドメインへ 301 される
- [ ] **新規登録 → 確認メール → リンク → ログイン**が新ドメインで一通り通る
- [ ] `https://ohmyasset.com/sitemap.xml` の URL が新ドメインになっている

---

## B-2. モバイルアプリ（App Store / Google Play）

手順とストア掲載文は **[`docs/STORE.md`](./docs/STORE.md)** にまとめてあります。
最低限、以下は着手前に把握してください。

- [ ] `eas init` で `app.json` の `projectId` を実 ID に置き換える（現在はダミー）
- [ ] `eas.json` の `submit.production` に App Store Connect の ID 類を記入
- [ ] ⚠️ **審査用デモアカウントを用意する**（保有データを数件入れた状態で）。
      未提出だとログイン必須アプリはほぼ確実に差し戻されます
- [ ] ⚠️ **バンドル ID `com.ohmyasset.app` は登録後に変更できません。**
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

- [ ] **商標調査** — J-PlatPat で `Oh My Asset` / `オーマイアセット` の第9類・第36類 称呼類似検索
      https://www.j-platpat.inpit.go.jp/
      抵触する場合は `packages/core/src/brand.ts` の `name` / `shortName` を変更するだけで改名できます
- [ ] シンガポール展開時は IPOS でも別途調査
      https://www.ipos.gov.sg/
- [ ] 利用規約・プライバシーポリシーの弁護士レビュー
      （`app/legal/terms`, `app/legal/privacy` に日英の草案があります）
- [ ] 日本で有料化する場合は **特定商取引法に基づく表記** ページを追加
- [x] シンガポールの個人データを扱うため **PDPA** の DPO 指定を明記済み
      （プライバシーポリシー §6。実際に担当者を割り当てること）
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
