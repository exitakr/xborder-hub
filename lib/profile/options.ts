/**
 * Shared select options for profile / onboarding / compensation forms.
 * Originally defined inline in app/mypage/MyPageClient.tsx — extracted so
 * /welcome and /salaries reuse the exact same vocabulary (values are
 * stored verbatim in Supabase rows).
 */

export type Opt = { v: string; label: string };

export const COUNTRY_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "Japan", label: "🇯🇵 Japan" },
  { v: "Singapore", label: "🇸🇬 Singapore" },
  { v: "Hong Kong", label: "🇭🇰 Hong Kong" },
  { v: "Thailand", label: "🇹🇭 Thailand" },
  { v: "Vietnam", label: "🇻🇳 Vietnam" },
  { v: "Indonesia", label: "🇮🇩 Indonesia" },
  { v: "Malaysia", label: "🇲🇾 Malaysia" },
  { v: "United States", label: "🇺🇸 United States" },
  { v: "United Kingdom", label: "🇬🇧 United Kingdom" },
  { v: "Germany", label: "🇩🇪 Germany" },
  { v: "Australia", label: "🇦🇺 Australia" },
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

// Japanese role vocabulary. Values are stored verbatim in Supabase rows.
export const ROLE_OPTS: Opt[] = [
  { v: "", label: "—" },
  { v: "営業/セールス", label: "営業/セールス" },
  { v: "ソリューションアーキテクト", label: "ソリューションアーキテクト" },
  { v: "プリセールスエンジニア", label: "プリセールスエンジニア" },
  { v: "サポート/カスタマーエンジニア", label: "サポート/カスタマーエンジニア" },
  { v: "ソフトウェアエンジニア", label: "ソフトウェアエンジニア" },
  { v: "エンジニアリングマネージャー", label: "エンジニアリングマネージャー" },
  { v: "SRE/DevOps", label: "SRE/DevOps" },
  { v: "インフラエンジニア", label: "インフラエンジニア" },
  { v: "システムエンジニア", label: "システムエンジニア" },
  { v: "セキュリティエンジニア", label: "セキュリティエンジニア" },
  { v: "ソフトウェアアーキテクト", label: "ソフトウェアアーキテクト" },
  { v: "組み込みエンジニア", label: "組み込みエンジニア" },
  { v: "ハードウェアエンジニア", label: "ハードウェアエンジニア" },
  { v: "QAエンジニア", label: "QAエンジニア" },
  { v: "ゲームエンジニア", label: "ゲームエンジニア" },
  { v: "デベロッパーリレーション", label: "デベロッパーリレーション" },
  { v: "AI/MLエンジニア", label: "AI/MLエンジニア" },
  { v: "データエンジニア", label: "データエンジニア" },
  { v: "データサイエンティスト", label: "データサイエンティスト" },
  { v: "データアナリスト", label: "データアナリスト" },
  { v: "ビジネスアナリスト", label: "ビジネスアナリスト" },
  { v: "プロダクトマネージャー", label: "プロダクトマネージャー" },
  { v: "プロジェクトマネージャー", label: "プロジェクトマネージャー" },
  { v: "プログラムマネージャー", label: "プログラムマネージャー" },
  { v: "カスタマーサポート", label: "カスタマーサポート" },
  { v: "カスタマーサクセス", label: "カスタマーサクセス" },
  { v: "コンサルタント", label: "コンサルタント" },
  { v: "デザイナー", label: "デザイナー" },
  { v: "マーケター", label: "マーケター" },
  { v: "人事", label: "人事" },
  { v: "採用", label: "採用" },
  { v: "リーガル", label: "リーガル" },
  { v: "バックオフィス", label: "バックオフィス" },
  { v: "事業開発", label: "事業開発" },
  { v: "経理", label: "経理" },
  { v: "カントリーマネージャー", label: "カントリーマネージャー" },
  { v: "サプライチェーン", label: "サプライチェーン" },
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
