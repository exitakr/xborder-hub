export type CitySize = "major" | "medium" | "small" | "mini";

export type City = {
  code: string;
  name: string;
  x: number;
  y: number;
  size: CitySize;
  color?: string;
  external?: boolean;
};

export type Flow = {
  from: string;
  to: string;
  volume: number;
  color: string;
};

export type TopFlow = {
  label: string;
  vol: string;
  color: string;
};

export type Region = {
  key: RegionKey;
  emoji: string;
  tabLabel: string;
  label: string;
  weekTotal: number;
  cities: City[];
  flows: Flow[];
  topFlows: TopFlow[];
};

export type RegionKey =
  | "asia"
  | "japan"
  | "namerica"
  | "europe"
  | "oceania"
  | "africa";

export const REGIONS: Record<RegionKey, Region> = {
  asia: {
    key: "asia",
    emoji: "🌏",
    tabLabel: "アジア",
    label: "ASIA-PAC",
    weekTotal: 234,
    cities: [
      { code: "TYO", name: "Tokyo", x: 258, y: 55, size: "major", color: "#0A1F3D" },
      { code: "OSA", name: "Osaka", x: 235, y: 75, size: "small" },
      { code: "SEL", name: "Seoul", x: 265, y: 35, size: "small" },
      { code: "SIN", name: "Singapore", x: 128, y: 195, size: "major", color: "#0055A4" },
      { code: "BKK", name: "Bangkok", x: 88, y: 138, size: "medium", color: "#1FA89E" },
      { code: "HKG", name: "Hong Kong", x: 185, y: 115, size: "small" },
      { code: "TPE", name: "Taipei", x: 218, y: 108, size: "small" },
      { code: "SGN", name: "Ho Chi Minh", x: 82, y: 178, size: "small" },
      { code: "KUL", name: "Kuala Lumpur", x: 115, y: 215, size: "small" },
      { code: "JKT", name: "Jakarta", x: 148, y: 235, size: "small" },
      { code: "MNL", name: "Manila", x: 200, y: 158, size: "small" },
    ],
    flows: [
      { from: "TYO", to: "SIN", volume: 12, color: "#0055A4" },
      { from: "SIN", to: "BKK", volume: 8, color: "#1FA89E" },
      { from: "SIN", to: "TYO", volume: 5, color: "#6B4F8E" },
      { from: "TYO", to: "BKK", volume: 4, color: "#FFC93C" },
      { from: "HKG", to: "TYO", volume: 3, color: "#1FA89E" },
      { from: "SEL", to: "SIN", volume: 2, color: "#0A1F3D" },
    ],
    topFlows: [
      { label: "Tokyo→Singapore", vol: "+12", color: "#0055A4" },
      { label: "Singapore→Bangkok", vol: "+8", color: "#1FA89E" },
      { label: "Singapore→Tokyo", vol: "+5", color: "#6B4F8E" },
      { label: "Hong Kong→Tokyo", vol: "+3", color: "#0A1F3D" },
    ],
  },
  japan: {
    key: "japan",
    emoji: "🇯🇵",
    tabLabel: "日本",
    label: "JAPAN",
    weekTotal: 87,
    cities: [
      { code: "SPK", name: "Sapporo", x: 260, y: 55, size: "small" },
      { code: "TYO", name: "Tokyo", x: 215, y: 120, size: "major", color: "#0055A4" },
      { code: "NGO", name: "Nagoya", x: 185, y: 142, size: "small" },
      { code: "OSA", name: "Osaka", x: 155, y: 158, size: "medium", color: "#1FA89E" },
      { code: "FUK", name: "Fukuoka", x: 80, y: 195, size: "medium", color: "#0A1F3D" },
      { code: "OKA", name: "Okinawa", x: 50, y: 235, size: "small" },
      { code: "SIN", name: "Singapore", x: 25, y: 225, size: "mini", external: true },
      { code: "NYC", name: "New York", x: 315, y: 70, size: "mini", external: true },
    ],
    flows: [
      { from: "OSA", to: "TYO", volume: 8, color: "#1FA89E" },
      { from: "TYO", to: "OSA", volume: 6, color: "#0055A4" },
      { from: "SIN", to: "TYO", volume: 5, color: "#FFC93C" },
      { from: "TYO", to: "FUK", volume: 3, color: "#6B4F8E" },
      { from: "TYO", to: "NYC", volume: 2, color: "#0055A4" },
      { from: "FUK", to: "TYO", volume: 2, color: "#1FA89E" },
    ],
    topFlows: [
      { label: "Osaka→Tokyo", vol: "+8", color: "#1FA89E" },
      { label: "Tokyo→Osaka", vol: "+6", color: "#0055A4" },
      { label: "Singapore→Tokyo", vol: "+5", color: "#FFC93C" },
      { label: "Tokyo→Fukuoka", vol: "+3", color: "#6B4F8E" },
    ],
  },
  namerica: {
    key: "namerica",
    emoji: "🗽",
    tabLabel: "北米",
    label: "NORTH AMERICA",
    weekTotal: 41,
    cities: [
      { code: "YVR", name: "Vancouver", x: 60, y: 65, size: "small" },
      { code: "SEA", name: "Seattle", x: 65, y: 90, size: "small" },
      { code: "SFO", name: "San Francisco", x: 50, y: 140, size: "major", color: "#1FA89E" },
      { code: "LAX", name: "Los Angeles", x: 65, y: 185, size: "medium" },
      { code: "AUS", name: "Austin", x: 155, y: 200, size: "small" },
      { code: "CHI", name: "Chicago", x: 185, y: 115, size: "small" },
      { code: "YYZ", name: "Toronto", x: 230, y: 95, size: "small" },
      { code: "NYC", name: "New York", x: 265, y: 125, size: "major", color: "#0055A4" },
      { code: "BOS", name: "Boston", x: 275, y: 100, size: "small" },
      { code: "MIA", name: "Miami", x: 245, y: 215, size: "small" },
      { code: "TYO", name: "Tokyo", x: 305, y: 225, size: "mini", external: true },
    ],
    flows: [
      { from: "TYO", to: "SFO", volume: 7, color: "#0055A4" },
      { from: "TYO", to: "NYC", volume: 5, color: "#1FA89E" },
      { from: "SFO", to: "NYC", volume: 3, color: "#6B4F8E" },
      { from: "NYC", to: "TYO", volume: 2, color: "#FFC93C" },
      { from: "SFO", to: "SEA", volume: 2, color: "#0A1F3D" },
    ],
    topFlows: [
      { label: "Tokyo→San Francisco", vol: "+7", color: "#0055A4" },
      { label: "Tokyo→New York", vol: "+5", color: "#1FA89E" },
      { label: "SF→New York", vol: "+3", color: "#6B4F8E" },
      { label: "New York→Tokyo", vol: "+2", color: "#FFC93C" },
    ],
  },
  europe: {
    key: "europe",
    emoji: "🏰",
    tabLabel: "ヨーロッパ",
    label: "EUROPE",
    weekTotal: 23,
    cities: [
      { code: "STK", name: "Stockholm", x: 215, y: 35, size: "small" },
      { code: "DUB", name: "Dublin", x: 60, y: 80, size: "small" },
      { code: "LON", name: "London", x: 115, y: 90, size: "major", color: "#0055A4" },
      { code: "AMS", name: "Amsterdam", x: 150, y: 85, size: "small" },
      { code: "BER", name: "Berlin", x: 205, y: 80, size: "medium", color: "#1FA89E" },
      { code: "PAR", name: "Paris", x: 135, y: 125, size: "medium" },
      { code: "ZRH", name: "Zürich", x: 175, y: 130, size: "small" },
      { code: "MIL", name: "Milan", x: 185, y: 148, size: "small" },
      { code: "MAD", name: "Madrid", x: 85, y: 190, size: "small" },
      { code: "TYO", name: "Tokyo", x: 310, y: 135, size: "mini", external: true },
    ],
    flows: [
      { from: "TYO", to: "LON", volume: 4, color: "#0055A4" },
      { from: "LON", to: "PAR", volume: 3, color: "#1FA89E" },
      { from: "TYO", to: "BER", volume: 2, color: "#FFC93C" },
      { from: "PAR", to: "BER", volume: 2, color: "#6B4F8E" },
      { from: "LON", to: "AMS", volume: 1, color: "#0A1F3D" },
    ],
    topFlows: [
      { label: "Tokyo→London", vol: "+4", color: "#0055A4" },
      { label: "London→Paris", vol: "+3", color: "#1FA89E" },
      { label: "Tokyo→Berlin", vol: "+2", color: "#FFC93C" },
      { label: "Paris→Berlin", vol: "+2", color: "#6B4F8E" },
    ],
  },
  oceania: {
    key: "oceania",
    emoji: "🏝",
    tabLabel: "オセアニア",
    label: "OCEANIA",
    weekTotal: 11,
    cities: [
      { code: "TYO", name: "Tokyo", x: 165, y: 30, size: "mini", external: true },
      { code: "PER", name: "Perth", x: 80, y: 165, size: "small" },
      { code: "ADL", name: "Adelaide", x: 180, y: 195, size: "small" },
      { code: "BNE", name: "Brisbane", x: 255, y: 130, size: "small" },
      { code: "SYD", name: "Sydney", x: 240, y: 175, size: "major", color: "#0055A4" },
      { code: "MEL", name: "Melbourne", x: 220, y: 215, size: "medium", color: "#1FA89E" },
      { code: "AKL", name: "Auckland", x: 305, y: 225, size: "small" },
    ],
    flows: [
      { from: "TYO", to: "SYD", volume: 3, color: "#0055A4" },
      { from: "SYD", to: "MEL", volume: 2, color: "#1FA89E" },
      { from: "TYO", to: "MEL", volume: 2, color: "#FFC93C" },
      { from: "SYD", to: "AKL", volume: 1, color: "#6B4F8E" },
    ],
    topFlows: [
      { label: "Tokyo→Sydney", vol: "+3", color: "#0055A4" },
      { label: "Sydney→Melbourne", vol: "+2", color: "#1FA89E" },
      { label: "Tokyo→Melbourne", vol: "+2", color: "#FFC93C" },
      { label: "Sydney→Auckland", vol: "+1", color: "#6B4F8E" },
    ],
  },
  africa: {
    key: "africa",
    emoji: "🦓",
    tabLabel: "アフリカ",
    label: "AFRICA",
    weekTotal: 4,
    cities: [
      { code: "CAS", name: "Casablanca", x: 80, y: 65, size: "small" },
      { code: "CAI", name: "Cairo", x: 220, y: 60, size: "small" },
      { code: "LOS", name: "Lagos", x: 115, y: 135, size: "small" },
      { code: "NBO", name: "Nairobi", x: 240, y: 140, size: "medium", color: "#0055A4" },
      { code: "JNB", name: "Johannesburg", x: 205, y: 205, size: "medium", color: "#1FA89E" },
      { code: "CPT", name: "Cape Town", x: 175, y: 235, size: "small" },
      { code: "TYO", name: "Tokyo", x: 310, y: 85, size: "mini", external: true },
    ],
    flows: [
      { from: "TYO", to: "NBO", volume: 2, color: "#0055A4" },
      { from: "TYO", to: "JNB", volume: 1, color: "#FFC93C" },
      { from: "JNB", to: "CPT", volume: 1, color: "#1FA89E" },
    ],
    topFlows: [
      { label: "Tokyo→Nairobi", vol: "+2", color: "#0055A4" },
      { label: "Tokyo→Johannesburg", vol: "+1", color: "#FFC93C" },
      { label: "Johannesburg→Cape Town", vol: "+1", color: "#1FA89E" },
    ],
  },
};

export const REGION_ORDER: RegionKey[] = [
  "asia",
  "japan",
  "namerica",
  "europe",
  "oceania",
  "africa",
];

export type TrendItem = {
  flag: string;
  name: string;
  count: number;
  change: number;
};

export type TrendKey = "country" | "industry" | "role";

export const TRENDS: Record<TrendKey, TrendItem[]> = {
  country: [
    { flag: "🇸🇬", name: "Singapore", count: 234, change: 18 },
    { flag: "🇯🇵", name: "Japan", count: 187, change: 12 },
    { flag: "🇭🇰", name: "Hong Kong", count: 96, change: -5 },
    { flag: "🇹🇭", name: "Thailand", count: 72, change: 3 },
    { flag: "🇻🇳", name: "Vietnam", count: 58, change: 22 },
    { flag: "🇺🇸", name: "United States", count: 51, change: 8 },
    { flag: "🇮🇩", name: "Indonesia", count: 41, change: 14 },
  ],
  industry: [
    { flag: "💻", name: "Tech", count: 445, change: 14 },
    { flag: "🏦", name: "Finance", count: 312, change: -3 },
    { flag: "🚀", name: "Startup", count: 220, change: 32 },
    { flag: "🏭", name: "Manufacturing", count: 156, change: 2 },
    { flag: "🛍", name: "Consumer", count: 141, change: 8 },
    { flag: "🏥", name: "Healthcare", count: 88, change: 11 },
    { flag: "🎓", name: "Education", count: 54, change: -2 },
  ],
  role: [
    { flag: "📐", name: "Product Manager", count: 189, change: 21 },
    { flag: "⚙️", name: "Engineer", count: 167, change: 9 },
    { flag: "💼", name: "BD / Sales", count: 152, change: -2 },
    { flag: "📣", name: "Marketing", count: 98, change: 6 },
    { flag: "🎨", name: "Designer", count: 61, change: 15 },
    { flag: "📊", name: "Finance / Accounting", count: 54, change: -1 },
    { flag: "👥", name: "HR / People", count: 38, change: 5 },
    { flag: "🏠", name: "駐在帯同(無職)", count: 42, change: 18 },
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
