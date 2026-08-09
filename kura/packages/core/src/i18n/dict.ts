/**
 * Locale dictionary. Japan and Singapore are the launch markets, so ja + en are
 * both first-class; en is the fallback for every other market.
 *
 * Keys are flat and explicit so a missing translation is a type error, not a
 * silent fallback to a key name at runtime.
 */
export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

export function isLocale(v: string | undefined): v is Locale {
  return v === "ja" || v === "en";
}

const ja = {
  // --- navigation ---
  // Nav labels are deliberately shorter than the page headings they lead to
  // (pfTitle / mkTitle / myTitle). Spelled out in full, the Japanese set is
  // ~23 characters and cannot share a row with the wordmark on a phone.
  navPortfolio: "資産",
  navMarket: "さがす",
  navMypage: "マイページ",
  navAdmin: "価格管理",
  navLogin: "ログイン",
  navLogout: "ログアウト",
  navSignup: "はじめる",

  // --- landing ---
  landingHeadline: "手持ちのコレクションを、ひと目で。",
  landingSub:
    "カード・時計・バッグ・スニーカー。買った値段と今の相場を並べて、資産としてまとめて見られます。",
  landingCta: "無料ではじめる",
  landingLogin: "ログイン",
  landingF1Title: "ひと画面で全部わかる",
  landingF1Body: "カテゴリをまたいだ合計評価額と損益を、開いた瞬間に表示します。",
  landingF2Title: "売買をチャートに重ねる",
  landingF2Body: "買った日・売った日が価格推移の上にマークされ、判断の履歴が残ります。",
  landingF3Title: "出どころのわかる価格",
  landingF3Body: "価格には必ず参照元と取得日時が付きます。推測値は「データ不足」と表示します。",

  // --- auth ---
  authEmail: "メールアドレス",
  authPassword: "パスワード",
  authSignIn: "ログイン",
  authSignUp: "アカウント作成",
  authGoogle: "Google で続ける",
  authMagic: "メールでログインリンクを受け取る",
  authMagicSent: "ログインリンクを送信しました。メールをご確認ください。",
  authToSignUp: "アカウントをお持ちでない方",
  authToSignIn: "すでにアカウントをお持ちの方",
  authDisplayName: "表示名",
  authPasswordHint: "8文字以上",

  // --- portfolio ---
  pfTitle: "ポートフォリオ",
  pfTotalValue: "評価額合計",
  pfValueChart: "評価額の推移",
  pfValueChartEmpty:
    "価格履歴を蓄積中です。1日1回の自動更新で1点ずつ記録され、数日で推移として表示されます。",
  // --- contact ---
  ctTitle: "お問い合わせ",
  ctLead: "ご質問・不具合のご報告はこちらから。内容は運営に直接届きます。",
  ctSubject: "件名",
  ctBody: "お問い合わせ内容",
  ctSubmit: "送信する",
  ctSent: "送信しました。順次確認のうえ、ご記入のメールアドレス宛にご返信します。",
  ctErrEmail: "メールアドレスの形式が正しくありません。",
  ctPrivacy:
    "ご記入いただいた内容とメールアドレスは、お問い合わせへの対応にのみ使用します。",

  pfRange1w: "1週間",
  pfRange1m: "1ヶ月",
  pfRangeYtd: "年初来",
  pfRangeAll: "全期間",
  pfUnrealized: "評価損益",
  pfCost: "取得額合計",
  pfRealized: "実現損益",
  pfBreakdown: "カテゴリ構成",
  pfHoldings: "保有一覧",
  pfEmptyTitle: "まだ登録がありません",
  pfEmptyBody: "銘柄をさがして、買った記録を1件追加すると評価額が出ます。",
  pfEmptyCta: "銘柄をさがす",
  pfQty: "保有数",
  pfAvgCost: "平均取得",
  pfValue: "評価額",
  pfPl: "損益",
  pfExcluded: "価格データがない銘柄は合計に含めていません。",

  // --- market ---
  mkTitle: "銘柄をさがす",
  mkSearch: "銘柄名・型番で検索",
  mkAll: "すべて",
  mkNoResults: "該当する銘柄がありません。",

  // --- add-your-own item ---
  mkAddOwn: "自分でアイテムを追加",
  mkAddOwnTitle: "アイテムを追加",
  mkAddOwnLead:
    "一覧にない銘柄は、ここから追加できます。市場価格が取得できるものは自動で表示され、取得できない場合は自分で評価額を登録できます。",
  mkAddOwnErrName: "名称を入力してください。",
  mkCategory: "カテゴリ",
  mkAddOwnName: "名称",
  mkAddOwnDetail: "詳細（任意）",
  mkAddOwnDetailPlaceholder: "例: レザー、カラー、サイズなど",
  mkAddOwnIdentifier: "型番・リファレンス（任意）",
  mkAddOwnNote:
    "追加すると同時にあなたの保有リストに加わります。市場価格は次回の自動更新（1日1回）で反映されます。",
  mkAddOwnSubmit: "追加して保有に加える",
  mkAdd: "保有に追加",
  mkAdded: "保有中",
  mkUpdated: "更新",
  mkNoPrice: "データ不足",

  // --- item detail ---
  itChart: "価格推移",
  itNoChart: "価格履歴がまだありません。取得できしだい表示されます。",
  itRecordBuy: "購入を記録",
  itRecordSell: "売却を記録",
  itTransactions: "取引履歴",
  itNoTransactions: "取引の記録がありません。",
  itSource: "出典",
  itUpdatedAt: "最終更新",
  itConfidence: "データ信頼度",
  itLowConfidenceWarn:
    "この銘柄は参照できた取引件数が少なく、実際の売買価格と大きく異なる場合があります。",
  itPhoto: "写真",
  itPhotoAdd: "写真を追加",
  itPhotoReplace: "写真を変更",
  itMarkerBuy: "購入",
  itMarkerSell: "売却",

  // --- community-reported prices ---
  cmTitle: "みんなの売却実績",
  cmLead: "利用者が実際に売れた価格として登録したものの中央値です。",
  cmContributors: "投稿者数",
  cmReports: "投稿件数",
  cmMarker: "売却実績",
  cmNone: "まだ公開できる売却実績がありません。3人以上の投稿が集まると表示されます。",
  cmWhyThreshold: "1人や2人の投稿は相場ではなく個別の事例のため、公開していません。",
  cmAsking: "出品価格",
  cmRealised: "売却実績",
  cmReport: "売却実績を登録",
  cmReportTitle: "売却実績の登録",
  cmReportLead:
    "実際に売れた価格を登録すると、同じ銘柄を持つ人の参考になります。個々の投稿が他の人に見えることはありません。",
  cmKind: "種別",
  cmKindSold: "売却した",
  cmKindBought: "購入した",
  cmVenue: "取引した場所",
  cmVenueMercari: "メルカリ",
  cmVenueYahoo: "ヤフオク",
  cmVenueStore: "店舗・買取",
  cmVenueOther: "その他",
  cmCondition: "状態",
  cmConditionNew: "新品・未使用",
  cmConditionUsed: "中古",
  cmConditionGraded: "鑑定済み",
  cmSubmit: "登録する",
  cmSubmitted: "登録しました。ありがとうございます。",
  cmPrivacyNote:
    "登録内容は集計にのみ使われ、個別の金額や日付が他の利用者に表示されることはありません。",
  cmMyReports: "登録した売却実績",
  cmStatsReports: "登録件数",
  cmStatsItems: "登録した銘柄数",
  cmStatsUnlocked: "相場公開に貢献した銘柄数",
  cmStatsLead: "あなたの投稿は、同じ銘柄を見ている人の判断材料になっています。",
  cmDelete: "削除",

  // --- self-reported valuation ---
  srTitle: "自分で登録した評価額",
  srLead:
    "自動取得できない銘柄は、買取査定や販売店の相場など、ご自身が確認した金額を登録できます。任意です。",
  srAdd: "評価額を登録",
  srEdit: "評価額を変更",
  srPrice: "評価額",
  srSource: "情報源",
  srSourcePlaceholder: "例: ◯◯買取 査定額、店頭表示価格",
  srSourceHelp: "どこで確認した金額かを書いてください。あとで見返すときの判断材料になります。",
  srAsOf: "その金額を確認した日",
  srSave: "保存",
  srRemove: "登録を削除",
  srRemoveConfirm: "この評価額を削除しますか？",
  srErrSource: "情報源を入力してください。",
  srBadge: "自己申告",
  srUsedFor: "この銘柄の評価額は自己申告値です",
  // {asOf} / {source} / {count} are substituted by `fill()`. Kept as plain
  // strings so the dictionary stays one flat, type-checked shape.
  srNote: "{asOf} 時点・出典: {source}",
  srPrivate: "登録した金額はあなたのポートフォリオにのみ反映され、他の利用者には表示されません。",
  srPortfolioNotice:
    "合計評価額のうち {count} 件は、あなたが登録した自己申告値を使っています。" +
    "登録時点の情報に基づくため、現在の市場価格をそのまま反映しているとは限りません。",
  itAddToHoldings: "保有に追加",

  // --- transaction form ---
  txType: "種別",
  txBuy: "購入",
  txSell: "売却",
  txDate: "日付",
  txQty: "数量",
  txUnitPrice: "1点あたりの単価",
  txSave: "保存",
  txCancel: "キャンセル",
  txDelete: "削除",
  txEdit: "編集",
  txDeleteConfirm: "この取引を削除しますか？",
  txErrFuture: "未来の日付は登録できません。",
  txErrQty: "数量は1以上の整数で入力してください。",
  txErrPrice: "単価は0より大きい数値で入力してください。",
  txErrOversell: "売却数量が保有数を超えています。",
  txErrGeneric: "保存できませんでした。時間をおいて再度お試しください。",

  // --- mypage ---
  myTitle: "マイページ",
  myDisplayName: "表示名",
  myCurrency: "表示通貨",
  myLanguage: "言語",
  mySave: "保存する",
  mySaved: "保存しました。",
  myStats: "統計",
  myRealizedTotal: "実現損益（累計）",
  myItemCount: "保有銘柄数",
  myDanger: "アカウントの削除",
  myDangerBody:
    "保有・取引・アップロードした画像をすべて削除します。この操作は取り消せません。",
  myDeleteAccount: "アカウントを削除する",
  myDeleteConfirm: "削除するには DELETE と入力してください。",

  // --- admin ---
  adTitle: "価格キュレーション",
  adBody: "eBay で自動取得できないカテゴリの価格を手動で登録します。",
  adItem: "銘柄",
  adPrice: "価格",
  adSourceUrl: "参照元 URL",
  adSave: "登録",
  adForbidden: "この画面にアクセスする権限がありません。",

  // --- admin dashboard ---
  adDashTitle: "管理ダッシュボード",
  adDashLead: "利用状況・データ品質・お問い合わせをまとめて確認できます。",
  adKpiUsers: "会員",
  adKpiTotalUsers: "総会員数",
  adKpiNew7: "新規（7日）",
  adKpiNew30: "新規（30日）",
  adKpiGrowth: "前月比",
  adKpiActive7: "アクティブ（7日）",
  adKpiActive30: "アクティブ（30日）",
  adKpiWithHoldings: "保有登録済み",
  adKpiActivation: "登録到達率",
  adKpiEngagement: "利用状況",
  adKpiHoldings: "保有銘柄数",
  adKpiTx: "取引記録",
  adKpiTx30: "取引（30日）",
  adKpiTracked: "管理資産額（JPY換算）",
  adKpiCommunity: "売却実績の投稿",
  adKpiSelfReported: "自己申告評価額",
  adKpiUserItems: "利用者が追加した銘柄",
  adKpiOpenContact: "未対応の問い合わせ",
  adKpiData: "データ品質",
  adKpiItems: "カタログ銘柄数",
  adKpiCoverage: "価格取得率",
  adKpiSnapshots: "価格履歴の点数",
  adKpiLastRefresh: "最終更新",
  adRefreshNow: "価格を今すぐ更新",
  adRefreshRunning: "更新中…（最大1分）",
  adContact: "お問い合わせ",
  adNoContact: "お問い合わせはありません。",
  adContactMember: "会員",
  adContactGuest: "ゲスト",
  adContactDone: "対応済みにする",
  adContactReopen: "未対応に戻す",
  adMembers: "会員一覧",
  adMemberJoined: "登録日",
  adMemberLastSeen: "最終操作",

  // --- shared ---
  loading: "読み込み中…",
  errorTitle: "問題が発生しました",
  errorBody: "時間をおいて再度お試しください。",
  retry: "再試行",
  noData: "—",
  confidenceHigh: "高",
  confidenceMedium: "中",
  confidenceLow: "低",
  confidenceInsufficient: "データ不足",
  catPokemon: "ポケモンカード",
  catTcg: "トレーディングカード",
  catWatch: "時計",
  catBag: "バッグ",
  catSneaker: "スニーカー",
  catCar: "高級車",

  // --- legal (SPEC §1.3 — must appear on every screen) ---
  disclaimer:
    "表示価格は過去の取引データに基づく参考値であり、売買価格を保証するものではありません。本アプリは投資助言・金融商品取引業に該当するサービスではありません。",
  legalTerms: "利用規約",
  legalPrivacy: "プライバシーポリシー",
  legalContact: "お問い合わせ",
} as const;

/**
 * Widen the literal string types from `ja` to plain `string`, while keeping the
 * key set exact — that is what makes a missing or misspelled key in `en` a
 * compile error without demanding that translations match word for word.
 */
type Dict = { readonly [K in keyof typeof ja]: string };

const en: Dict = {
  navPortfolio: "Portfolio",
  navMarket: "Browse",
  navMypage: "Account",
  navAdmin: "Prices",
  navLogin: "Log in",
  navLogout: "Log out",
  navSignup: "Get started",

  landingHeadline: "Your collection, at a glance.",
  landingSub:
    "Cards, watches, bags, sneakers. Put what you paid next to what it trades for today, and see the whole thing as one portfolio.",
  landingCta: "Start free",
  landingLogin: "Log in",
  landingF1Title: "One screen, everything",
  landingF1Body:
    "Total value and gain/loss across every category, the moment you open the app.",
  landingF2Title: "Your trades on the chart",
  landingF2Body:
    "Buys and sells are marked directly on the price history, so your decisions stay visible.",
  landingF3Title: "Prices you can trace",
  landingF3Body:
    "Every price carries its source and the time it was fetched. Thin data is labelled, never guessed.",

  authEmail: "Email",
  authPassword: "Password",
  authSignIn: "Log in",
  authSignUp: "Create account",
  authGoogle: "Continue with Google",
  authMagic: "Email me a login link",
  authMagicSent: "Login link sent. Please check your inbox.",
  authToSignUp: "Don't have an account?",
  authToSignIn: "Already have an account?",
  authDisplayName: "Display name",
  authPasswordHint: "8 characters or more",

  pfTitle: "Portfolio",
  pfTotalValue: "Total value",
  pfValueChart: "Value over time",
  pfValueChartEmpty:
    "Building price history. The daily refresh records one point per day, so a trend appears within a few days.",
  // --- contact ---
  ctTitle: "Contact",
  ctLead: "Questions or bug reports go straight to the people running this.",
  ctSubject: "Subject",
  ctBody: "Message",
  ctSubmit: "Send",
  ctSent: "Sent. We read every message and will reply to the address you gave.",
  ctErrEmail: "That email address does not look right.",
  ctPrivacy: "Your message and address are used only to answer this enquiry.",

  pfRange1w: "1W",
  pfRange1m: "1M",
  pfRangeYtd: "YTD",
  pfRangeAll: "All",
  pfUnrealized: "Unrealised P/L",
  pfCost: "Total cost",
  pfRealized: "Realised P/L",
  pfBreakdown: "By category",
  pfHoldings: "Holdings",
  pfEmptyTitle: "Nothing here yet",
  pfEmptyBody: "Find an item and record one purchase to see your first valuation.",
  pfEmptyCta: "Browse items",
  pfQty: "Qty",
  pfAvgCost: "Avg cost",
  pfValue: "Value",
  pfPl: "P/L",
  pfExcluded: "Items without price data are excluded from the totals.",

  mkTitle: "Browse items",
  mkSearch: "Search by name or reference",
  mkAll: "All",
  mkNoResults: "No items match your search.",

  // --- add-your-own item ---
  mkAddOwn: "Add your own item",
  mkAddOwnTitle: "Add an item",
  mkAddOwnLead:
    "Not in the list? Add it here. If a market price is available it will show automatically; if not, you can record your own valuation.",
  mkAddOwnErrName: "Please enter a name.",
  mkCategory: "Category",
  mkAddOwnName: "Name",
  mkAddOwnDetail: "Detail (optional)",
  mkAddOwnDetailPlaceholder: "e.g. leather, colour, size",
  mkAddOwnIdentifier: "Reference number (optional)",
  mkAddOwnNote:
    "Adding it also adds it to your holdings. A market price, if one is available, appears after the next daily refresh.",
  mkAddOwnSubmit: "Add and hold it",
  mkAdd: "Add to holdings",
  mkAdded: "In holdings",
  mkUpdated: "Updated",
  mkNoPrice: "No data",

  itChart: "Price history",
  itNoChart: "No price history yet. It will appear once data is collected.",
  itRecordBuy: "Record a buy",
  itRecordSell: "Record a sell",
  itTransactions: "Transactions",
  itNoTransactions: "No transactions recorded.",
  itSource: "Source",
  itUpdatedAt: "Last updated",
  itConfidence: "Data confidence",
  itLowConfidenceWarn:
    "This item is based on a small number of observations and may differ substantially from actual sale prices.",
  itPhoto: "Photo",
  itPhotoAdd: "Add photo",
  itPhotoReplace: "Replace photo",
  itMarkerBuy: "Buy",
  itMarkerSell: "Sell",

  // --- community-reported prices ---
  cmTitle: "Community sale prices",
  cmLead: "The median of what users reported actually selling this for.",
  cmContributors: "Contributors",
  cmReports: "Reports",
  cmMarker: "Reported sale",
  cmNone: "No community prices yet. They appear once three or more people report.",
  cmWhyThreshold:
    "One or two reports describe individual sales rather than a market, so they are not published.",
  cmAsking: "Asking price",
  cmRealised: "Sold for",
  cmReport: "Report a sale",
  cmReportTitle: "Report a sale",
  cmReportLead:
    "Reporting what you sold for helps others holding the same item. Individual reports are never shown to anyone else.",
  cmKind: "Type",
  cmKindSold: "I sold it",
  cmKindBought: "I bought it",
  cmVenue: "Where",
  cmVenueMercari: "Mercari",
  cmVenueYahoo: "Yahoo! Auctions",
  cmVenueStore: "Shop / buyback",
  cmVenueOther: "Other",
  cmCondition: "Condition",
  cmConditionNew: "New / unused",
  cmConditionUsed: "Used",
  cmConditionGraded: "Graded",
  cmSubmit: "Submit",
  cmSubmitted: "Recorded. Thank you.",
  cmPrivacyNote:
    "Reports are used only in aggregate. Individual amounts and dates are never shown to other users.",
  cmMyReports: "Your reported sales",
  cmStatsReports: "Reports filed",
  cmStatsItems: "Items covered",
  cmStatsUnlocked: "Items whose published price you helped build",
  cmStatsLead: "Your reports are part of what other holders of these items see.",
  cmDelete: "Delete",

  // --- self-reported valuation ---
  srTitle: "Your own valuation",
  srLead:
    "For items with no automatic price, you can record a figure you have seen yourself — a buyback quote, a dealer's asking price. Optional.",
  srAdd: "Add a valuation",
  srEdit: "Change valuation",
  srPrice: "Valuation",
  srSource: "Source",
  srSourcePlaceholder: "e.g. buyback quote, shop price tag",
  srSourceHelp: "Where you saw this figure. It is what makes the number judgeable later.",
  srAsOf: "Date you saw it",
  srSave: "Save",
  srRemove: "Remove valuation",
  srRemoveConfirm: "Remove this valuation?",
  srErrSource: "Please enter where the figure came from.",
  srBadge: "Self-reported",
  srUsedFor: "This item is valued from your own figure",
  srNote: "As of {asOf} · source: {source}",
  srPrivate: "Your figure affects only your own portfolio and is never shown to other users.",
  // Deliberately phrased to read correctly at any count, rather than carrying a
  // plural rule the dictionary has no machinery for.
  srPortfolioNotice:
    "{count} of your holdings are valued from figures you entered yourself. Those reflect the " +
    "information available when you recorded them, not necessarily the current market price.",
  itAddToHoldings: "Add to holdings",

  txType: "Type",
  txBuy: "Buy",
  txSell: "Sell",
  txDate: "Date",
  txQty: "Quantity",
  txUnitPrice: "Price per unit",
  txSave: "Save",
  txCancel: "Cancel",
  txDelete: "Delete",
  txEdit: "Edit",
  txDeleteConfirm: "Delete this transaction?",
  txErrFuture: "Future dates cannot be recorded.",
  txErrQty: "Quantity must be a whole number of 1 or more.",
  txErrPrice: "Price must be greater than 0.",
  txErrOversell: "Sell quantity exceeds the quantity you hold.",
  txErrGeneric: "Could not save. Please try again shortly.",

  myTitle: "Account",
  myDisplayName: "Display name",
  myCurrency: "Display currency",
  myLanguage: "Language",
  mySave: "Save",
  mySaved: "Saved.",
  myStats: "Statistics",
  myRealizedTotal: "Realised P/L (all time)",
  myItemCount: "Items held",
  myDanger: "Delete account",
  myDangerBody:
    "Permanently deletes your holdings, transactions and uploaded photos. This cannot be undone.",
  myDeleteAccount: "Delete my account",
  myDeleteConfirm: "Type DELETE to confirm.",

  adTitle: "Price curation",
  adBody: "Manually record prices for categories eBay cannot cover automatically.",
  adItem: "Item",
  adPrice: "Price",
  adSourceUrl: "Source URL",
  adSave: "Save",
  adForbidden: "You do not have access to this page.",

  // --- admin dashboard ---
  adDashTitle: "Admin dashboard",
  adDashLead: "Usage, data quality and support enquiries in one place.",
  adKpiUsers: "Members",
  adKpiTotalUsers: "Total members",
  adKpiNew7: "New (7d)",
  adKpiNew30: "New (30d)",
  adKpiGrowth: "vs prior 30d",
  adKpiActive7: "Active (7d)",
  adKpiActive30: "Active (30d)",
  adKpiWithHoldings: "With holdings",
  adKpiActivation: "Activation",
  adKpiEngagement: "Engagement",
  adKpiHoldings: "Holdings",
  adKpiTx: "Transactions",
  adKpiTx30: "Transactions (30d)",
  adKpiTracked: "Tracked value (JPY)",
  adKpiCommunity: "Community reports",
  adKpiSelfReported: "Self-reported prices",
  adKpiUserItems: "User-added items",
  adKpiOpenContact: "Open enquiries",
  adKpiData: "Data quality",
  adKpiItems: "Catalogue items",
  adKpiCoverage: "Price coverage",
  adKpiSnapshots: "Price snapshots",
  adKpiLastRefresh: "Last refresh",
  adRefreshNow: "Refresh prices now",
  adRefreshRunning: "Refreshing… (up to a minute)",
  adContact: "Enquiries",
  adNoContact: "No enquiries yet.",
  adContactMember: "member",
  adContactGuest: "guest",
  adContactDone: "Mark handled",
  adContactReopen: "Reopen",
  adMembers: "Members",
  adMemberJoined: "Joined",
  adMemberLastSeen: "Last active",

  loading: "Loading…",
  errorTitle: "Something went wrong",
  errorBody: "Please try again shortly.",
  retry: "Retry",
  noData: "—",
  confidenceHigh: "High",
  confidenceMedium: "Medium",
  confidenceLow: "Low",
  confidenceInsufficient: "Insufficient data",
  catPokemon: "Pokémon cards",
  catTcg: "Trading cards",
  catWatch: "Watches",
  catBag: "Bags",
  catSneaker: "Sneakers",
  catCar: "Cars",

  disclaimer:
    "Prices shown are reference values derived from past transaction data and do not guarantee any sale price. This app is not an investment advisory or financial instruments business.",
  legalTerms: "Terms of Service",
  legalPrivacy: "Privacy Policy",
  legalContact: "Contact",
};

const dicts: Record<Locale, Dict> = { ja, en };

export type TranslationKey = keyof Dict;

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}

/**
 * Substitute `{name}` placeholders in a translated string.
 *
 * The dictionary stays a flat map of strings — that is what lets the `Dict` type
 * catch a missing translation at compile time — so the few entries needing a
 * value interpolate at the call site instead of being functions.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
