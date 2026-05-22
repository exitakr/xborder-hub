export type City = {
  code: string;
  name: string;
  /** Latitude in degrees (-90 .. 90) */
  lat: number;
  /** Longitude in degrees (-180 .. 180) */
  lng: number;
  /** Visual hierarchy on the map */
  tier: 1 | 2 | 3;
};

/** Curated set of cities that show up on the global map. */
export const CITIES: City[] = [
  { code: "TYO", name: "Tokyo", lat: 35.68, lng: 139.69, tier: 1 },
  { code: "SIN", name: "Singapore", lat: 1.35, lng: 103.82, tier: 1 },
  { code: "NYC", name: "New York", lat: 40.71, lng: -74.01, tier: 1 },
  { code: "SFO", name: "San Francisco", lat: 37.77, lng: -122.42, tier: 1 },
  { code: "LON", name: "London", lat: 51.51, lng: -0.13, tier: 1 },
  { code: "HKG", name: "Hong Kong", lat: 22.32, lng: 114.17, tier: 2 },
  { code: "BKK", name: "Bangkok", lat: 13.76, lng: 100.5, tier: 2 },
  { code: "SGN", name: "Ho Chi Minh", lat: 10.82, lng: 106.63, tier: 2 },
  { code: "SYD", name: "Sydney", lat: -33.87, lng: 151.21, tier: 2 },
  { code: "BER", name: "Berlin", lat: 52.52, lng: 13.4, tier: 2 },
  { code: "PAR", name: "Paris", lat: 48.86, lng: 2.35, tier: 2 },
  { code: "DXB", name: "Dubai", lat: 25.2, lng: 55.27, tier: 2 },
  { code: "TPE", name: "Taipei", lat: 25.03, lng: 121.57, tier: 3 },
  { code: "SEL", name: "Seoul", lat: 37.57, lng: 126.98, tier: 3 },
  { code: "KUL", name: "Kuala Lumpur", lat: 3.14, lng: 101.69, tier: 3 },
  { code: "JKT", name: "Jakarta", lat: -6.21, lng: 106.85, tier: 3 },
  { code: "OSA", name: "Osaka", lat: 34.69, lng: 135.5, tier: 3 },
  { code: "LAX", name: "Los Angeles", lat: 34.05, lng: -118.24, tier: 3 },
  { code: "SEA", name: "Seattle", lat: 47.61, lng: -122.33, tier: 3 },
  { code: "AMS", name: "Amsterdam", lat: 52.37, lng: 4.9, tier: 3 },
  { code: "MEL", name: "Melbourne", lat: -37.81, lng: 144.96, tier: 3 },
];

export type Flow = {
  from: string;
  to: string;
  /** Annual aggregate count of moves */
  count: number;
};

/** Annual aggregated career moves across borders. Demo data. */
export const FLOWS: Flow[] = [
  { from: "TYO", to: "SIN", count: 624 },
  { from: "TYO", to: "SFO", count: 364 },
  { from: "TYO", to: "NYC", count: 260 },
  { from: "TYO", to: "LON", count: 208 },
  { from: "SIN", to: "BKK", count: 416 },
  { from: "SIN", to: "TYO", count: 260 },
  { from: "HKG", to: "TYO", count: 156 },
  { from: "TYO", to: "BKK", count: 208 },
  { from: "SIN", to: "SGN", count: 156 },
  { from: "TYO", to: "SYD", count: 156 },
  { from: "LON", to: "PAR", count: 156 },
  { from: "TYO", to: "BER", count: 104 },
  { from: "NYC", to: "TYO", count: 104 },
  { from: "SFO", to: "SEA", count: 104 },
  { from: "SIN", to: "KUL", count: 104 },
  { from: "TYO", to: "DXB", count: 78 },
  { from: "TPE", to: "TYO", count: 78 },
  { from: "SEL", to: "SIN", count: 104 },
];

export type AnnualTopFlow = {
  label: string;
  count: number;
  color: string;
};

export const ANNUAL_TOP_FLOWS: AnnualTopFlow[] = [
  { label: "Tokyo → Singapore", count: 624, color: "#0055A4" },
  { label: "Singapore → Bangkok", count: 416, color: "#1FA89E" },
  { label: "Tokyo → San Francisco", count: 364, color: "#6B4F8E" },
  { label: "Tokyo → New York", count: 260, color: "#FFC93C" },
  { label: "Singapore → Tokyo", count: 260, color: "#0055A4" },
  { label: "Tokyo → London", count: 208, color: "#1FA89E" },
];

export type TrendItem = {
  flag: string;
  name: string;
  count: number;
  /** Year-over-year delta in percentage points */
  change: number;
};

export type TrendKey = "country" | "industry" | "role";

export const TRENDS: Record<TrendKey, TrendItem[]> = {
  country: [
    { flag: "🇸🇬", name: "Singapore", count: 11240, change: 18 },
    { flag: "🇯🇵", name: "Japan", count: 9410, change: 12 },
    { flag: "🇭🇰", name: "Hong Kong", count: 4810, change: -5 },
    { flag: "🇹🇭", name: "Thailand", count: 3620, change: 3 },
    { flag: "🇻🇳", name: "Vietnam", count: 2940, change: 22 },
    { flag: "🇺🇸", name: "United States", count: 2580, change: 8 },
    { flag: "🇮🇩", name: "Indonesia", count: 2050, change: 14 },
  ],
  industry: [
    { flag: "💻", name: "Tech", count: 22450, change: 14 },
    { flag: "🏦", name: "Finance", count: 15820, change: -3 },
    { flag: "🚀", name: "Startup", count: 11220, change: 32 },
    { flag: "🏭", name: "Manufacturing", count: 7860, change: 2 },
    { flag: "🛍", name: "Consumer", count: 7140, change: 8 },
    { flag: "🏥", name: "Healthcare", count: 4480, change: 11 },
    { flag: "🎓", name: "Education", count: 2740, change: -2 },
  ],
  role: [
    { flag: "📐", name: "Product Manager", count: 9550, change: 21 },
    { flag: "⚙️", name: "Engineer", count: 8430, change: 9 },
    { flag: "💼", name: "BD / Sales", count: 7680, change: -2 },
    { flag: "📣", name: "Marketing", count: 4960, change: 6 },
    { flag: "🎨", name: "Designer", count: 3080, change: 15 },
    { flag: "📊", name: "Finance / Accounting", count: 2730, change: -1 },
    { flag: "👥", name: "HR / People", count: 1920, change: 5 },
    { flag: "🏠", name: "駐在帯同(無職)", count: 2120, change: 18 },
  ],
};

export type RecentMove = {
  initials: string;
  bg: string;
  text: string;
  fromCity: string;
  toCity: string;
  role: string;
  when: string;
};

export const RECENT_MOVES: RecentMove[] = [
  {
    initials: "RN",
    bg: "bg-blue",
    text: "text-cream",
    fromCity: "Tokyo",
    toCity: "Singapore",
    role: "Engineer · Grab",
    when: "2 時間前",
  },
  {
    initials: "HK",
    bg: "bg-jade",
    text: "text-ink",
    fromCity: "Singapore",
    toCity: "Ho Chi Minh",
    role: "BD / Sales · 起業",
    when: "5 時間前",
  },
  {
    initials: "MS",
    bg: "bg-mustard",
    text: "text-ink",
    fromCity: "Tokyo",
    toCity: "Bangkok",
    role: "BD · 現地スタートアップ",
    when: "昨日",
  },
  {
    initials: "JN",
    bg: "bg-plum",
    text: "text-cream",
    fromCity: "Tokyo",
    toCity: "San Francisco",
    role: "Engineer · US Tech",
    when: "2 日前",
  },
  {
    initials: "NA",
    bg: "bg-blue-soft",
    text: "text-ink",
    fromCity: "Tokyo",
    toCity: "Singapore",
    role: "駐在帯同",
    when: "3 日前",
  },
];

export type TrendingThread = {
  id: number;
  category: string;
  title: string;
  replies: number;
  ups: number;
};

export const TRENDING_THREADS: TrendingThread[] = [
  {
    id: 4,
    category: "💰 給与",
    title: "東京年収1,200万 vs SG SGD 11k、本当の手取り比較",
    replies: 67,
    ups: 156,
  },
  {
    id: 3,
    category: "🛂 ビザ",
    title: "タイのSmart Visa、起業家枠の最新申請プロセス(2026年版)",
    replies: 42,
    ups: 89,
  },
  {
    id: 5,
    category: "🏠 生活",
    title: "SGのコンドミニアム、家族で住むなら結局どのエリア?",
    replies: 31,
    ups: 72,
  },
  {
    id: 2,
    category: "👨‍👩‍👧 家族",
    title: "ホーチミンの IS、月いくらかかってますか?",
    replies: 28,
    ups: 47,
  },
];
