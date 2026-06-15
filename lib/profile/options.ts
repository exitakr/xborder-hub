/**
 * Shared select options for profile / onboarding / compensation forms.
 * Originally defined inline in app/mypage/MyPageClient.tsx — extracted so
 * /welcome and /salaries reuse the exact same vocabulary (values are
 * stored verbatim in Supabase rows).
 */

export type Opt = { v: string; label: string };

// 国の選択肢 — 越境キャリアでよく出てくる地域を網羅。順番はおおよそ
// 日本に近いアジア → 北米 → 欧州 → 中東/オセアニア/アフリカの順。
export const COUNTRY_OPTS: Opt[] = [
  { v: "", label: "—" },
  // East / Southeast Asia
  { v: "Japan", label: "🇯🇵 日本" },
  { v: "Singapore", label: "🇸🇬 シンガポール" },
  { v: "Hong Kong", label: "🇭🇰 香港" },
  { v: "Taiwan", label: "🇹🇼 台湾" },
  { v: "South Korea", label: "🇰🇷 韓国" },
  { v: "China", label: "🇨🇳 中国" },
  { v: "Thailand", label: "🇹🇭 タイ" },
  { v: "Vietnam", label: "🇻🇳 ベトナム" },
  { v: "Indonesia", label: "🇮🇩 インドネシア" },
  { v: "Malaysia", label: "🇲🇾 マレーシア" },
  { v: "Philippines", label: "🇵🇭 フィリピン" },
  { v: "Cambodia", label: "🇰🇭 カンボジア" },
  { v: "Laos", label: "🇱🇦 ラオス" },
  { v: "Myanmar", label: "🇲🇲 ミャンマー" },
  { v: "Mongolia", label: "🇲🇳 モンゴル" },
  // South Asia
  { v: "India", label: "🇮🇳 インド" },
  { v: "Bangladesh", label: "🇧🇩 バングラデシュ" },
  { v: "Sri Lanka", label: "🇱🇰 スリランカ" },
  { v: "Pakistan", label: "🇵🇰 パキスタン" },
  { v: "Nepal", label: "🇳🇵 ネパール" },
  // North America
  { v: "United States", label: "🇺🇸 アメリカ" },
  { v: "Canada", label: "🇨🇦 カナダ" },
  { v: "Mexico", label: "🇲🇽 メキシコ" },
  // Latin America
  { v: "Brazil", label: "🇧🇷 ブラジル" },
  { v: "Argentina", label: "🇦🇷 アルゼンチン" },
  { v: "Chile", label: "🇨🇱 チリ" },
  { v: "Colombia", label: "🇨🇴 コロンビア" },
  { v: "Peru", label: "🇵🇪 ペルー" },
  // Europe
  { v: "United Kingdom", label: "🇬🇧 イギリス" },
  { v: "Ireland", label: "🇮🇪 アイルランド" },
  { v: "France", label: "🇫🇷 フランス" },
  { v: "Germany", label: "🇩🇪 ドイツ" },
  { v: "Netherlands", label: "🇳🇱 オランダ" },
  { v: "Belgium", label: "🇧🇪 ベルギー" },
  { v: "Switzerland", label: "🇨🇭 スイス" },
  { v: "Austria", label: "🇦🇹 オーストリア" },
  { v: "Italy", label: "🇮🇹 イタリア" },
  { v: "Spain", label: "🇪🇸 スペイン" },
  { v: "Portugal", label: "🇵🇹 ポルトガル" },
  { v: "Sweden", label: "🇸🇪 スウェーデン" },
  { v: "Norway", label: "🇳🇴 ノルウェー" },
  { v: "Denmark", label: "🇩🇰 デンマーク" },
  { v: "Finland", label: "🇫🇮 フィンランド" },
  { v: "Poland", label: "🇵🇱 ポーランド" },
  { v: "Czech Republic", label: "🇨🇿 チェコ" },
  { v: "Greece", label: "🇬🇷 ギリシャ" },
  { v: "Russia", label: "🇷🇺 ロシア" },
  { v: "Turkey", label: "🇹🇷 トルコ" },
  // Middle East
  { v: "Israel", label: "🇮🇱 イスラエル" },
  { v: "United Arab Emirates", label: "🇦🇪 UAE" },
  { v: "Saudi Arabia", label: "🇸🇦 サウジアラビア" },
  { v: "Qatar", label: "🇶🇦 カタール" },
  // Oceania
  { v: "Australia", label: "🇦🇺 オーストラリア" },
  { v: "New Zealand", label: "🇳🇿 ニュージーランド" },
  // Africa
  { v: "South Africa", label: "🇿🇦 南アフリカ" },
  { v: "Egypt", label: "🇪🇬 エジプト" },
  { v: "Kenya", label: "🇰🇪 ケニア" },
  { v: "Nigeria", label: "🇳🇬 ナイジェリア" },
  { v: "Morocco", label: "🇲🇦 モロッコ" },
  { v: "Other", label: "🌏 その他" },
];

// Stored verbatim in Supabase rows. Existing tokens (Tech / Finance / …) are
// kept for backward compatibility; new entries are appended.
export const INDUSTRY_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "Tech", label: "IT / テック" },
  { v: "Software", label: "ソフトウェア / SaaS" },
  { v: "Finance", label: "金融" },
  { v: "Startup", label: "スタートアップ" },
  { v: "Consulting", label: "コンサルティング" },
  { v: "Consumer", label: "消費財 / 小売" },
  { v: "Manufacturing", label: "製造業" },
  { v: "Automotive", label: "自動車 / モビリティ" },
  { v: "Healthcare", label: "ヘルスケア / 製薬" },
  { v: "Gaming", label: "ゲーム / エンタメ" },
  { v: "Media", label: "メディア / 広告" },
  { v: "Web3", label: "Web3 / Crypto" },
  { v: "RealEstate", label: "不動産 / 建設" },
  { v: "Logistics", label: "物流 / サプライチェーン" },
  { v: "Energy", label: "エネルギー / 環境" },
  { v: "Telecom", label: "通信" },
  { v: "Travel", label: "旅行 / ホスピタリティ" },
  { v: "Food", label: "食品 / 外食" },
  { v: "Education", label: "教育" },
  { v: "Legal", label: "法律 / 法務" },
  { v: "Government", label: "公共 / 政府" },
  { v: "NPO", label: "非営利 / NGO" },
  { v: "Other", label: "その他" },
];

// 約 50 件、検索しやすい粒度で統一。値は Supabase / localStorage に
// そのまま保存される(JP の正式名称をキーにする)。
export const ROLE_OPTS: Opt[] = [
  { v: "", label: "—" },
  // Executive / business
  { v: "経営者・役員", label: "経営者・役員 (CEO / COO / CTO / CFO)" },
  { v: "事業企画・事業開発", label: "事業企画・事業開発" },
  { v: "経営企画・経営戦略", label: "経営企画・経営戦略" },
  { v: "M&A・アライアンス", label: "M&A・アライアンス" },
  { v: "カントリーマネージャー", label: "カントリーマネージャー" },
  // Finance / accounting / audit
  { v: "経理・財務", label: "経理・財務" },
  { v: "管理会計・税務", label: "管理会計・税務" },
  { v: "内部監査・IR", label: "内部監査・IR" },
  // Legal / compliance / professional
  { v: "法務・コンプライアンス", label: "法務・コンプライアンス" },
  { v: "知的財産・特許", label: "知的財産・特許" },
  { v: "弁護士・会計士・税理士", label: "弁護士・会計士・税理士" },
  // Admin / HR
  { v: "総務・秘書", label: "総務・秘書" },
  { v: "人事・採用", label: "人事・採用" },
  { v: "人材開発・組織開発", label: "人材開発・組織開発" },
  { v: "労務・給与", label: "労務・給与" },
  // Supply chain / global ops
  { v: "物流・サプライチェーン", label: "物流・サプライチェーン" },
  { v: "購買・資材調達", label: "購買・資材調達" },
  { v: "貿易・通訳・翻訳", label: "貿易・通訳・翻訳" },
  // Sales
  { v: "法人営業", label: "法人営業" },
  { v: "個人営業・リテール", label: "個人営業・リテール" },
  { v: "営業企画・インサイドセールス", label: "営業企画・インサイドセールス" },
  { v: "プリセールス・セールスエンジニア", label: "プリセールス・セールスエンジニア" },
  { v: "代理店・アライアンス営業", label: "代理店・アライアンス営業" },
  { v: "海外営業", label: "海外営業" },
  // Customer ops
  { v: "カスタマーサクセス・サポート", label: "カスタマーサクセス・サポート" },
  // Marketing / research
  { v: "広報・PR・広告", label: "広報・PR・広告" },
  { v: "マーケティング・販促", label: "マーケティング・販促" },
  { v: "リサーチ・データ分析", label: "リサーチ・データ分析" },
  { v: "商品企画・MD", label: "商品企画・MD" },
  // Retail / store
  { v: "バイヤー・仕入れ", label: "バイヤー・仕入れ" },
  { v: "店舗運営・店長", label: "店舗運営・店長" },
  { v: "店舗開発・FC開発", label: "店舗開発・FC開発" },
  // Consulting
  { v: "戦略・経営コンサルタント", label: "戦略・経営コンサルタント" },
  { v: "ITコンサルタント", label: "ITコンサルタント" },
  // Product / engineering
  { v: "プロダクトマネージャー", label: "プロダクトマネージャー" },
  { v: "プロジェクトマネージャー", label: "プロジェクトマネージャー" },
  { v: "ソフトウェアエンジニア", label: "ソフトウェアエンジニア" },
  { v: "フロントエンドエンジニア", label: "フロントエンドエンジニア" },
  { v: "モバイルエンジニア", label: "モバイルエンジニア" },
  { v: "インフラ・SRE・DevOps", label: "インフラ・SRE・DevOps" },
  { v: "ネットワーク・セキュリティ", label: "ネットワーク・セキュリティ" },
  { v: "データエンジニア・DB", label: "データエンジニア・DB" },
  { v: "データサイエンティスト・ML", label: "データサイエンティスト・ML" },
  { v: "QA・テストエンジニア", label: "QA・テストエンジニア" },
  { v: "情報システム・社内SE", label: "情報システム・社内SE" },
  { v: "組み込み・ハードウェア", label: "組み込み・ハードウェア" },
  { v: "R&D・研究職", label: "R&D・研究職" },
  // Creative / web / media
  { v: "UI/UXデザイナー", label: "UI/UXデザイナー" },
  { v: "クリエイティブ・アートディレクター", label: "クリエイティブ・アートディレクター" },
  { v: "Webディレクター・編集・ライター", label: "Webディレクター・編集・ライター" },
  { v: "プロダクト・空間デザイナー", label: "プロダクト・空間デザイナー" },
  { v: "ゲーム制作", label: "ゲーム制作 (PG / プランナー / デザイナー)" },
  // Education / care / other
  { v: "教員・トレーナー・キャリアコンサルタント", label: "教員・トレーナー・キャリアコンサルタント" },
  { v: "医療・介護福祉", label: "医療・介護福祉" },
  { v: "駐在帯同", label: "駐在帯同(無職)" },
  { v: "その他", label: "その他" },
];

export const VISA_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "EP_SG", label: "EP (Singapore)" },
  { v: "S_Pass_SG", label: "S Pass (Singapore)" },
  { v: "PR_SG", label: "PR (Singapore)" },
  { v: "H1B", label: "H-1B (US)" },
  { v: "O1", label: "O-1 (US)" },
  { v: "L1", label: "L-1 (US)" },
  { v: "Green_Card", label: "Green Card (US)" },
  { v: "Tier2_UK", label: "Skilled Worker (UK)" },
  { v: "WP", label: "就労ビザ (その他)" },
  { v: "PR", label: "永住権 (その他)" },
  { v: "Citizen", label: "市民権" },
  { v: "none", label: "無し / 検討中" },
];

export const JPY_SALARY_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "lt_400", label: "〜400万円" },
  { v: "400_600", label: "400〜600万円" },
  { v: "600_800", label: "600〜800万円" },
  { v: "800_1000", label: "800〜1,000万円" },
  { v: "1000_1300", label: "1,000〜1,300万円" },
  { v: "1300_1600", label: "1,300〜1,600万円" },
  { v: "1600_2000", label: "1,600〜2,000万円" },
  { v: "gte_2000", label: "2,000万円以上" },
];

/* ───── Compensation-form-only vocabularies (migration 0004) ───── */

export const RENT_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "lt_10", label: "〜10万円" },
  { v: "10_20", label: "10〜20万円" },
  { v: "20_30", label: "20〜30万円" },
  { v: "30_45", label: "30〜45万円" },
  { v: "gte_45", label: "45万円以上" },
  { v: "company", label: "会社負担" },
];

export const SAVINGS_RATE_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "lt_10", label: "〜10%" },
  { v: "10_20", label: "10〜20%" },
  { v: "20_30", label: "20〜30%" },
  { v: "30_50", label: "30〜50%" },
  { v: "gte_50", label: "50%以上" },
];

export const WEEKLY_HOURS_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "lt_40", label: "〜40時間" },
  { v: "40_45", label: "40〜45時間" },
  { v: "45_50", label: "45〜50時間" },
  { v: "50_60", label: "50〜60時間" },
  { v: "gte_60", label: "60時間以上" },
];

export const REMOTE_FREQ_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "full_remote", label: "フルリモート" },
  { v: "hybrid_3plus", label: "週3日以上リモート" },
  { v: "hybrid_1_2", label: "週1〜2日リモート" },
  { v: "office", label: "ほぼ出社" },
];

export const ENGLISH_USAGE_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "lt_10", label: "〜10%(ほぼ日本語)" },
  { v: "10_30", label: "10〜30%" },
  { v: "30_60", label: "30〜60%" },
  { v: "60_90", label: "60〜90%" },
  { v: "gte_90", label: "90%以上(ほぼ英語)" },
];

export function labelOf(opts: Opt[], v: string | null | undefined): string {
  if (!v) return "—";
  return opts.find((o) => o.v === v)?.label ?? v;
}
