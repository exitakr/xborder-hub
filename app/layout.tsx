import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://xborder-hub.example.com"),
  title: {
    default: "X Border Hub — 海外で働く前に、答え合わせができる場所",
    template: "%s — X Border Hub",
  },
  description:
    "先に行った人が、道を残す。次に何を積めば海外で勝てるのか — その答えを見つけるコミュニティ。",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "X Border Hub",
    locale: "ja_JP",
    title: "X Border Hub — 海外で働く前に、答え合わせができる場所",
    description:
      "先に行った人が、道を残す。次に何を積めば海外で勝てるのか — その答えを、リアルに歩いた人から見つける。",
  },
  twitter: {
    card: "summary_large_image",
    title: "X Border Hub — 海外で働く前に、答え合わせができる場所",
    description:
      "先に行った人が、道を残す。crossing borders, one career at a time.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF6E8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" style={{ colorScheme: "light" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link href={GOOGLE_FONTS} rel="stylesheet" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="noise">{children}</body>
    </html>
  );
}
