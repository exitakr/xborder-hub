# 公開前 必須対応チェックリスト

> Claude が代行できなかった項目だけをまとめています。Vercel に上がっていても、
> このリストが全部 ✅ になるまで本番公開しないでください。

## A. Supabase(あなたしかできない)

- [ ] `supabase/migrations/0001_init.sql` を SQL Editor で実行(済みなら ✅)
- [ ] `supabase/migrations/0002_communities_threads.sql` を SQL Editor で実行
  - これが未実行のうちは、`/threads` 投稿・コメント・Coffee Chat 申請・
    コミュニティ申請がすべて「DB がまだ準備できていません」のエラーで止まる
  - 実行後、`/threads`(空 → サンプル表示)・`/mypage`(空 → サンプル表示)
    が DB を読みに行くことを 1 度確認
- [ ] `supabase/migrations/0003_chat_admin.sql` を SQL Editor で実行
  - トークルーム(chat_rooms / chat_messages)、CC 承認時のルーム自動作成、
    新着メッセージ通知、Realtime 配信、管理者ロールが入る
- [ ] **管理者アカウントを設定** — SQL Editor で:
  ```sql
  update public.profiles set is_admin = true
    where id = (select id from auth.users where email = 'exitakr@gmail.com');
  ```
  設定後、そのアカウントで `/admin` にアクセスできる(非管理者には 404)
- [ ] Supabase Dashboard → Authentication → URL Configuration
  - Site URL: 本番ドメイン(例: `https://xborder-hub.vercel.app`)
  - Redirect URLs: `https://xborder-hub.vercel.app/auth/callback`,
    `https://xborder-hub.vercel.app/reset-password`,
    開発用も `http://localhost:3000/auth/callback`,
    `http://localhost:3000/reset-password`
- [ ] Authentication → Email Templates の Magic Link / Recovery のリンクが
  `{{ .ConfirmationURL }}` を使っていること(初期値で OK)
- [ ] Database → Roles → `service_role` の鍵を Vercel に保存していない
  (anon key だけが NEXT_PUBLIC_ で公開される。OK な状態を再確認)

## B. Vercel

- [x] `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 設定済
- [ ] Vercel の **Deployment Protection** が "Standard Protection / Vercel
  Authentication" のままだと一般ユーザが見られないので、公開時に
  `Disabled` か `Only Preview` に切替
- [ ] カスタムドメインを設定する場合、上の Supabase 側 URL も合わせて更新

## C. 法務(プレースホルダのまま)

- [ ] `/legal/terms` 利用規約 — `app/legal/terms/page.tsx` の本文を
  弁護士レビュー版に差し替え
- [ ] `/legal/privacy` プライバシーポリシー — 同上、特に PDPA(SG)・
  個人情報保護法(JP)準拠を確認
- [ ] `/legal/contact` お問い合わせ — 連絡先メールを実在のアドレスに

## D. 未実装の機能(β中は隠す / 動かなくても OK)

- [ ] **他人のプロフィール表示** — `/profile` は自分専用のまま。
  ただし Coffee Chat 申請は `/search` の実会員カードから直接 DB に
  保存されるようになったので、公開ブロッカーではない。
  `/profile?id=<uuid>` の閲覧ページは将来の改善項目
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

## F. 動作確認(あなたが手動で)

実行: SQL(0001 → 0002 → 0003)を流したあとログイン → 下記をひと通り

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
