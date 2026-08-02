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
  navPortfolio: "ポートフォリオ",
  navMarket: "銘柄をさがす",
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
