# 公開前 必須対応チェックリスト

> Claude が代行できなかった項目だけをまとめています。Vercel に上がっていても、
> このリストが全部 ✅ になるまで本番公開しないでください。

## A. Supabase(あなたしかできない)

- [ ] `supabase/migrations/0001_init.sql` を SQL Editor で実行(済みなら ✅)
- [ ] `supabase/migrations/0002_communities_threads.sql` を SQL Editor で実行
  - これが未実行のうちは、`/threads` 投稿・コメント・Coffee Chat 申請・
    コミュニティ申請がすべて「DB がまだ準備できていません」のエラーで止まる
  - 実行後、`/threads`・`/mypage` が DB を読みに行くことを 1 度確認
    (本番ビルドではサンプル非表示。dev では空のときサンプルが出る)
- [ ] `supabase/migrations/0003_chat_admin.sql` を SQL Editor で実行
  - トークルーム(chat_rooms / chat_messages)、CC 承認時のルーム自動作成、
    新着メッセージ通知、Realtime 配信、管理者ロールが入る
- [ ] `supabase/migrations/0004_onboarding_comp.sql` を SQL Editor で実行
  - オンボーディング(profiles.onboarded_at — 既存ユーザーは自動で完了扱い)
  - 年収 Give-to-Get(compensation_data の国/業界/職種列 +
    SECURITY DEFINER RPC。user_id は読者に渡らない設計)
  - 未実行のうちは /welcome 強制は発動せず、/salaries はロック表示のまま
- [ ] `supabase/migrations/0005_admin_samples.sql` を SQL Editor で実行
  - ホームの「トレンドキャリア」「注目のスレッド」やスレッド一覧のサンプルは
    本番でも表示される。管理者(is_admin)だけが各カードの「×」で全ユーザーから
    非表示にできる(dismissed_samples テーブルに記録)
  - 未実行でもサンプルは表示される。ただし「×」削除は
    「DB がまだ準備できていません」エラーになる(0005 実行で解消)
- [ ] **`supabase/migrations/0006_profile_full.sql` を SQL Editor で実行(必須)**
  - プロフィール全項目(職歴 career / スキル / 志望 / VISA / 年収 / 滞在年数 /
    相談トピック / 出身地)を profiles テーブルに保存する列を追加
  - **未実行のうちは、マイページで入力した職歴・スキル等が他のユーザーや
    他の端末に反映されない**(表示名・年齢・国・業界・職種だけは 0001 の列で
    同期される)。実行すると `/profile/<uuid>` で他会員の経歴まで見えるようになる
- [ ] **`supabase/migrations/0007_profile_lockdown.sql` を SQL Editor で実行(公開前必須・セキュリティ修正)**
  - 0006 まで profiles は「全認証ユーザーが SELECT * 可能」だったため、
    会員登録した攻撃者が anon-key で他会員の visa/salary/career(企業名・実年収・実績)を
    直接抜き取れる状態だった。これを「自分の行のみ SELECT 可」に変更し、
    他会員の閲覧は visibility_settings を強制適用する SECURITY DEFINER RPC 経由のみに
  - 同時に career_profile テーブルも owner-only に変更
  - RPC 3 本を追加: `fetch_public_profile`(単独), `fetch_member_directory`(/search 一覧),
    `fetch_author_bylines`(スレッド/コメントの著者表示)
  - **0007 未実行のままアプリを使うと検索一覧・他人のプロフィール・スレッド著者名が
    全部空表示になる**(コード側は 0007 RPC を呼ぶ実装に切替済)。必ず 0006 と
    一緒に実行してください
- [ ] **管理者アカウントを設定** — SQL Editor で:
  ```sql
  update public.profiles set is_admin = true
    where id = (select id from auth.users where email = 'exitakr@gmail.com');
  ```
  設定後、そのアカウントで `/admin` にアクセスできる(非管理者には 404)
- [ ] Supabase Dashboard → Authentication → URL Configuration
  - Site URL: 本番ドメイン(例: `https://xborder-hub.vercel.app`)
  - Redirect URLs(**ここに無い URL に届いた確認リンクは無効化される**):
    `https://xborder-hub.vercel.app/auth/callback`,
    `https://xborder-hub.vercel.app/reset-password`,
    開発用も `http://localhost:3000/auth/callback`,
    `http://localhost:3000/reset-password`
  - カスタムドメイン / プレビュー URL からもサインアップを試すなら、それらも追加
  - ⚠️ Vercel の `NEXT_PUBLIC_SITE_URL` を設定しておくと、確認メールのリンクは
    常にこの URL を指すようになり、ホスト不一致での失敗を防げる(コード側対応済)
- [ ] Authentication → Email Templates の Confirm signup / Magic Link / Recovery が
  `{{ .ConfirmationURL }}` を使っていること(初期値で OK)。コールバックは
  PKCE(`?code=`)と token_hash(`?token_hash=&type=`)の**両方**に対応済なので、
  どちらのテンプレート形式でも確認リンクは通る
- [ ] **メール送信(SMTP)を本番用に設定** — Authentication → Emails → SMTP Settings。
  Supabase 内蔵の送信は 1 時間あたり数通の厳しいレート制限があり、迷惑メール送りに
  なりやすい。公開時は Resend / Postmark / Amazon SES などのカスタム SMTP を設定する
  (未設定だと公開直後に新規登録メールが届かなくなる可能性が高い)
- [ ] 新規登録 → 確認メール受信 → リンククリック → `/auth/callback` 経由で
  `/welcome` に着地する一連を、実際のメールアドレスで 1 度通す
- [ ] Database → Roles → `service_role` の鍵を Vercel に保存していない
  (anon key だけが NEXT_PUBLIC_ で公開される。OK な状態を再確認)

## B. Vercel(環境変数 + 公開設定)

- [x] `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 設定済
- [ ] `NEXT_PUBLIC_SITE_URL` — 正規 URL(例: `https://xborder-hub.vercel.app`)。
  metadata / sitemap / robots / OG がこれを使う
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`(任意・推奨)— posthog.com 無料枠で
  プロジェクト作成 → Project API Key を設定。無ければ計測は自動 no-op。
  リージョンが EU の場合は `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` も
- [ ] `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN`(任意・推奨)— sentry.io 無料枠で
  Next.js プロジェクト作成 → DSN を両方に設定。無ければ自動 no-op
- [ ] `NEXT_PUBLIC_DEMO_CONTENT` — **本番では設定しない**(サンプルデータ非表示)。
  ステージングで見せたい場合のみ `1`。切替はビルド時反映なので再デプロイ必須
- [ ] Vercel の **Deployment Protection** が "Standard Protection / Vercel
  Authentication" のままだと一般ユーザが見られないので、公開時に
  `Disabled` か `Only Preview` に切替
- [ ] カスタムドメインを設定する場合、Supabase 側 URL と
  `NEXT_PUBLIC_SITE_URL` も合わせて更新

## C. 法務(プレースホルダのまま)

- [ ] `/legal/terms` 利用規約 — `app/legal/terms/page.tsx` の本文を
  弁護士レビュー版に差し替え
- [ ] `/legal/privacy` プライバシーポリシー — 同上、特に PDPA(SG)・
  個人情報保護法(JP)準拠を確認
- [ ] `/legal/contact` お問い合わせ — 連絡先メールを実在のアドレスに

## D. 未実装の機能(β中は隠す / 動かなくても OK)

- [x] **他人のプロフィール表示** — 実装済。`/profile/<uuid>` で他会員の
  プロフィール(経歴・スキル・志望・相談トピック)を閲覧でき、`/search` の
  カードの「詳細 →」から遷移する。公開範囲は各会員の visibility_settings に従う
  (企業名・年収・スキル・VISA は非公開設定なら表示されない)。0006 実行が前提
- [ ] **決済 (Stripe Checkout)** — `app/premium/SubscribeButton.tsx` は
  `localStorage('xbh_premium','1')` を立ててマイページに飛ぶだけ。
  本番では Stripe Checkout セッションを起動する
- [ ] **トランザクションメール (Resend / Postmark)** — Coffee Chat 承認・
  コミュニティ申請受領などはアプリ内通知のみ。メール送付は別 PR
- [ ] **i18n (DeepL)** — 日本語専用。EN / VI などは別 PR

## E. セキュリティ(Phase 5 にロードマップ済)

- [ ] CSP / `Content-Security-Policy` を `next.config.ts` に追加
- [ ] `npm audit` 高深刻度を 0 件にする CI を追加
- [ ] サーバーアクションの入力長制限は既に入れたが、サニタイズ
  (Markdown injection 対策)は未対応
- [ ] レートリミット(Upstash + Edge Middleware など)

## F. シードコンテンツ(公開前に必ず)

本番はサンプルデータ非表示なので、空に見えないよう運営アカウントで実コンテンツを投入:

- [ ] `/thread/new` から実スレッドを 5〜10 件投稿
  (カテゴリを散らす: 転職体験 / ビザ / 給与交渉 / 生活 / 家族)
- [ ] 各スレッドに自然なコメントを 2〜3 件(サブアカウントがあれば理想)
- [ ] `/salaries` に自分の年収データを 1 件投稿(最初の 1 行が無いと
  ロック画面の件数が 0 のまま)
- [ ] プロフィール(表示名・From/To・業界/職種・**職歴**)を設定し、検索に
  実会員として表示され、別アカウントから `/profile/<uuid>` で職歴まで
  見えることを確認(0006 実行が前提)

## G. 動作確認(あなたが手動で)

実行: SQL(0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007)を流したあとログイン → 下記をひと通り

- [ ] **新規登録** → `/welcome` ウィザード → 完了 → `/mypage` に実名表示。
  既存アカウントは /welcome を経由しないこと、パスワード再設定リンクが
  /reset-password に直行することも確認
- [ ] **プロフィール連携** — `/mypage` で職歴・スキル・志望・自己紹介を保存 →
  別ブラウザ(またはシークレットウィンドウ)で同じアカウントにログインし、
  入力内容が反映されること(DB が真実の源。端末跨ぎで一致)。
  さらに別アカウントから検索 → カードに企業遍歴が出て、「詳細 →」で経歴が見える
- [ ] **/salaries** — 未投稿だとロック画面 → 匿名投稿 → 全データ解放。
  2 アカウント目で投稿し、互いのデータが見える(名前は見えない)こと
- [ ] `/threads` でスレッドが DB から表示される(空ならサンプル)
- [ ] `/thread/new` で投稿 → `/thread?id=<uuid>` に遷移し本文が見える
- [ ] `/thread?id=<uuid>` でコメント投稿 → ページに即時反映、👍/👎 が保存される
- [ ] `/threads` の「+ コミュニティを申請」が成功メッセージを返す
- [ ] 別アカウントで `/search` から自分に Coffee Chat 申請 →
  自分の `/mypage` 受信タブに出る → 承認 → トークルームが開く
- [ ] トークルームで送受信(2 ブラウザで Realtime 反映を確認)
- [ ] `/notifications` で DB 起源の通知が見える(chat_request /
  chat_approved / thread_reply / dm がトリガで自動投入される)
- [ ] `/admin`(is_admin を立てたアカウント)でコミュニティ申請を承認
  → コミュニティが開設される。非管理者アカウントでは 404
- [ ] `/premium` の「無料トライアル開始」が β 用 stub であることを
  確認(本物の決済は通らない)

---

最終 commit 時に、このファイルを `git rm PRELAUNCH.md` で消すか、
`README.md` 末尾にマージするかしてください。
