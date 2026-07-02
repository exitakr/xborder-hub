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
- [ ] **`supabase/migrations/0008_contact_submissions.sql` を SQL Editor で実行**
  - `/legal/contact` のフォーム送信を保存するテーブル。未実行のうちは
    お問い合わせフォーム送信時に「DB がまだ準備できていません」エラー
  - 受信は Supabase Dashboard → Table Editor → contact_submissions で一覧確認
    (DB が常に正本。下記のメール通知が失敗してもここで必ず確認できる)
- [ ] **お問い合わせ通知メールの宛先を実際に受信できるようにする**
  (`lib/email/notifyContact.ts` が送信元 `noreply@xbordercareer.com` から
  `contact@xbordercareer.com` 宛に毎送信を通知する。Resend は送信専用なので、
  この宛先で実際に受信するには別途設定が必要)
  - Xserver の **メールアカウント設定** で `contact@xbordercareer.com` を作成し、
    届いたら手元の Gmail に自動転送する設定にするのが簡単(Xserver 側の
    「メール転送設定」)
  - Vercel 環境変数に `RESEND_API_KEY`(Resend の API Key)と、宛先を変えたい
    場合のみ `CONTACT_NOTIFY_EMAIL` を設定(未設定時は `contact@xbordercareer.com`)
  - `RESEND_API_KEY` 未設定でもフォーム送信自体は失敗しない(通知だけ
    スキップされ、コンソールに warning が出る。DB 保存は必ず成功する)
  - ⚠️ Vercel → Settings → Environment Variables で `RESEND_API_KEY` を保存する際、
    **"Sensitive" にチェック**を入れる(値が UI から再表示できなくなり、デプロイログ
    にも出ない)。`SUPABASE_SERVICE_ROLE_KEY`(本リポは未使用)を将来追加する場合も同様
- [ ] **`supabase/migrations/0009_member_directory_level.sql` を SQL Editor で実行**
  - 検索カードのユーザー名横に「Lv.N」バッジを出すため、`fetch_member_directory`
    RPC に `level int` 列を追加(国・業界・企業・職種の distinct 最大数)。
    未実行でもアプリは動く(検索カードの Lv バッジが消えるだけ)。
  - 自分のプロフィール / マイページ / AppTopBar の Lv 表示は localStorage 側の
    `career` から即計算するので 0009 と無関係に常に出る
- [ ] **`supabase/migrations/0010_onboarding_required.sql` を SQL Editor で実行(必須)**
  - `handle_new_user()` から email ローカル部 → display_name の自動補完を撤去。
    新規登録ユーザーの display_name は NULL になり、`/welcome` ウィザード完了が
    強制される(`middleware.ts` が未オンボーディング者を全保護ルートで /welcome に
    リダイレクト)
  - **バックフィル**: display_name が email ローカル部のままの **全ユーザー**
    (オンボーディング済みも含む)について `display_name = null, onboarded_at = null`
    にリセット。次回ログイン時に /welcome へ強制送還され、本人として表示名を
    入力し直すまで他のページは使えない
  - 名前を別途設定済み(メアド由来でない)のユーザーには影響なし
- [ ] **`supabase/migrations/0011_onboarding_backfill_fix.sql` を SQL Editor で実行**
  - 0010 のバックフィルは完全一致のみで、"Exitakr"(大文字)や " exitakr "
    (空白入り)のような表示名を取りこぼしていた。これを case-insensitive +
    trim 比較で再バックフィル。0010 と同じく `display_name` と `onboarded_at` を
    NULL に戻して /welcome へ再誘導する
  - 0010 を既に実行済みでも安全(冪等)。対象ユーザーがいない場合は 0 件 update
- [ ] **`supabase/migrations/0012_admin_moderation.sql` を SQL Editor で実行(管理画面の必須基盤)**
  - 管理人ダッシュボード用の SECURITY DEFINER RPC を追加(すべて `public.is_admin()`
    でゲート):`admin_stats`(真の件数)、`admin_list_members`(会員一覧・メール・
    最終アクセス)、`admin_list_threads` / `admin_list_comments`(モデレーション)、
    `admin_delete_thread` / `admin_delete_comment`(任意コンテンツ削除)
  - 0007 で profiles が owner-only になり通常クエリでは会員一覧・総数が取れないため必須。
    未実行だと `/admin` の会員タブ・実数統計・削除が動かない(コミュニティ承認は動く)
  - service_role キーは不要(auth.users は RPC 内でのみ安全に参照)
- [ ] **`supabase/migrations/0013_daily_question_threads.sql` を SQL Editor で実行**
  - ホーム「今日の質問」の遷移先を共有スレッドにする基盤。最初に「答える」を
    押したユーザーのリクエストで日付ごとに1本だけスレッドが作られ(author は
    運営=is_admin アカウント)、全員が同じスレッドにコメントで回答する。
    作成された時点で /threads 一覧にも自動表示
  - 未実行だと「答える」押下時に「DB がまだ準備できていません」エラー
- [ ] **`supabase/migrations/0014_community_request_notify.sql` を SQL Editor で実行**
  - コミュニティ申請の承認/却下時に、申請者へアプリ内通知を送るトリガー。
    未実行でも承認/却下自体は動く(申請者に通知が届かないだけ)
- [ ] **管理者アカウントを設定** — SQL Editor で:
  ```sql
  update public.profiles set is_admin = true
    where id = (select id from auth.users where email = 'exitakr@gmail.com');
  ```
  設定後、そのアカウントで `/admin` にアクセスできる(非管理者には 404)。
  ヘッダーに「管理」リンクが出る(管理人のみ)。管理画面では:
  概要(実数統計)/ 会員(メール・登録日・最終アクセス・投稿数、検索可)/
  コンテンツ(スレッド・コメントの削除)/ お問い合わせ(ステータス管理)/
  コミュニティ(申請承認)をタブで操作できる
- [ ] **Supabase Dashboard → Authentication → URL Configuration**(認証エラー
  の最大原因。新規登録メールのリンクがここに無い URL を指していると `otp_expired`
  もしくは「認証に失敗しました」になる)
  - **Site URL**: 独自ドメイン取得後は `https://xbordercareer.com`。それまでは
    `https://xborder-hub.vercel.app`
  - **Redirect URLs**(以下を全部追加。ワイルドカード `**` 推奨):
    - `https://xbordercareer.com/**`
    - `https://xborder-hub.vercel.app/**`(旧 URL からのリンク保険)
    - `http://localhost:3000/**`(開発用)
  - ⚠️ Vercel 側の `NEXT_PUBLIC_SITE_URL` を同じドメインに設定しておくこと
    (`app/login/actions.ts:14-24` の `siteOrigin()` がこれを最優先で参照)
- [ ] **重要: Email Templates をデフォルトの `{{ .ConfirmationURL }}` から
  `token_hash` 直リンクに変更する(必須・既知の不具合の修正)**
  - `@supabase/ssr` はデフォルトで PKCE フローを使うため、`{{ .ConfirmationURL }}`
    のデフォルトリンクは「サインアップしたブラウザの Cookie に保存された
    code_verifier」と突き合わせる方式。**サインアップした端末/ブラウザと、
    確認メールのリンクをクリックする端末/ブラウザが違うと認証が失敗する**
    (例: PC で登録 → スマホの Gmail でリンクをタップ → エラー)。
    実際に「メールは届くがリンククリック後に認証失敗」の主因
  - `app/auth/callback/route.ts:40-43` は token_hash 方式(ブラウザに依存しない
    検証)にも対応済みなので、各テンプレートの `href="{{ .ConfirmationURL }}"` を
    以下に置き換えるだけで解決(コード変更不要):
    - Confirm signup: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=%2Fhome`
    - Magic Link: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=%2Fhome`
    - Reset Password: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=%2Freset-password`
    - Change Email Address: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change&next=%2Fmypage`
  - 件名・本文を日本語に書き換えることを推奨(例: 件名「【X Border Hub】メール
    アドレスの確認」)。`{{ .SiteURL }}` / `{{ .TokenHash }}` プレースホルダのみ
    そのまま残す
- [ ] **カスタム SMTP(Resend)を設定** — Authentication → Emails → SMTP Settings
  - Supabase 内蔵 SMTP は厳しいレート制限(1 時間数通)+ 送信元が
    `noreply@mail.app.supabase.io` でスパム判定されやすい。公開前に必ず切り替え
  - **Resend セットアップ手順**(無料枠 3,000 通/月):
    1. https://resend.com でサインアップ(GitHub OAuth)
    2. **Domains → Add Domain** → `xbordercareer.com`
    3. Resend が表示する DNS レコード(SPF / DKIM × 3 / DMARC)を Xserver の
       **DNSレコード設定**に追加 → Resend 側で「Verify DNS」が全部緑になるまで待つ
    4. **API Keys → Create API Key** で発行(SMTP パスワードとして使う)
  - **Supabase SMTP 設定値**:
    - Sender email: `noreply@xbordercareer.com`
    - Sender name: `X Border Hub`
    - Host: `smtp.resend.com`
    - Port: `465`(SSL) または `587`(STARTTLS)
    - Username: `resend`
    - Password: 上記の Resend API Key
    - 保存後「Send test email」で自分宛に届くこと、Gmail の「ソースを表示」で
      SPF=PASS / DKIM=PASS / DMARC=PASS を確認
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

## C. 法務

- [x] `/legal/terms` 利用規約 — 13 条構成の実用版に差し替え済(2026-06-16)。
  正式公開・有償機能開始時には弁護士レビューを推奨
- [x] `/legal/privacy` プライバシーポリシー — 個人情報保護法準拠の 12 セクション
  構成に差し替え済(2026-06-16)。取得項目・利用目的・第三者提供・越境移転・
  利用者の権利を明示
- [x] `/legal/contact` お問い合わせ — フォーム化済。送信は contact_submissions に
  保存され、運営は Supabase Dashboard で確認・対応
- [ ] **B2B(求人広告)で有償化する時に必須**:
  1. **個人事業主の開業届を税務署に提出**(無料・即日。e-Tax または freee 開業で 5 分)。
     法人登記不要。これにより特商法上の「販売業者」として表示できる氏名・所在地が確定する
  2. **特定商取引法に基づく表記ページ**(`/legal/tokushoho`)を新設して、運営者名・
     所在地・電話番号(自宅可)・販売価格・支払時期・キャンセル条件を記載
  3. 利用規約に「第 14 条(有償サービス)」を追加し、課金・返金・解約条件を明記
  4. 個人会員向けの請求は当面なし(全機能無料)。求人広告は B2B 契約のため、
     消費者向け表記は影響を受けにくいが、念のため弁護士レビューを推奨
- [ ] 正式公開時に上記をプロの弁護士レビュー版に差し替え。テンプレ自動生成は
  **KIYAC (https://kiyac.app)** が日本語対応・無料・AI 生成で扱いやすい。
  ただし弁護士ドットコム等のテンプレも一部無料で利用可能

## D. 機能の状況

- [x] **他人のプロフィール表示** — 実装済。`/profile/<uuid>` で他会員の
  プロフィール(経歴・スキル・志望・相談トピック)を閲覧でき、`/search` の
  カードの「詳細 →」から遷移する。公開範囲は各会員の visibility_settings に従う
  (企業名・年収・スキル・VISA は非公開設定なら表示されない)
- [x] **マネタイズ機能を撤去** — `/premium` ページ、Coffee Chat の
  SGD 30 課金、給与データのプレミアム閲覧ゲートを全て撤去。会員登録した
  全員がスレッド投稿・コメント・Coffee Chat 申請・年収データ閲覧(投稿後)を
  無料で利用可。`/premium` URL は `/home` にリダイレクト
- [ ] **B2B マネタイズ(将来)** — グローバル人材会員を集めてハブ化したのち、
  企業からの求人広告掲載で収益化。実装は別フェーズ(求人投稿フォーム・
  企業ダッシュボード・課金経路・求人 RLS テーブル)
- [ ] **アプリ内通知のメール送付** — Coffee Chat 承認・コミュニティ申請受領などは
  現状アプリ内通知のみ。Supabase の認証メールが Resend 経由になれば、同じ Resend
  プロジェクトでアプリからのトランザクションメール送信も追加可能(別 PR)
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

実行: SQL(0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → 0008 → 0009 → 0010 → 0011 → 0012 → 0013 → 0014)を流したあとログイン → 下記をひと通り

- [ ] **新規登録 → 強制オンボーディング** — 確認メールリンク → `/welcome` ウィザード
  に着地(名前欄は **空**、メアド由来の自動補完が無いこと)。途中で URL バーから
  `/threads`, `/mypage`, `/home`, `/search`, `/salaries`, `/profile`, `/notifications`
  に直アクセス → **すべて `/welcome?next=<元のパス>` に強制リダイレクト**される
  (middleware.ts が onboarded_at + display_name を毎リクエストチェック)
- [ ] **/welcome 完了後** — 指定 next に着地し、以後すべての保護ルートで
  リダイレクトされない。`xb_onb=1` cookie が DevTools の Application タブに見える
  (12時間キャッシュ。サインアウトで削除)
- [ ] **既存メアド由来名ユーザー** — 0010 実行後、自分(exitakr@gmail.com で
  display_name = "exitakr" のはず)で再ログイン → /welcome に戻され、本人として
  表示名を入力 → 完了後はメアドが画面のどこにも残らない
- 既存アカウント(別名で登録済み)は /welcome を経由しないこと、パスワード再設定
  リンクが /reset-password に直行することも確認
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
- [ ] `/premium` URL を踏むと `/home` にサイレントリダイレクトする
  (古いリンクの保険。検索結果に残った場合に 404 を返さない)

---

最終 commit 時に、このファイルを `git rm PRELAUNCH.md` で消すか、
`README.md` 末尾にマージするかしてください。
