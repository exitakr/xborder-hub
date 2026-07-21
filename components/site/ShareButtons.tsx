"use client";

import { useState } from "react";
import { track } from "@/lib/analytics/track";

/**
 * Reusable share row: X (Twitter), LinkedIn, native share, and copy-link.
 * `url` should be a public, crawlable landing page (an SEO salary page) so
 * clicks convert into contributions — that's the share→traffic→post loop.
 * UTM params are appended so the loop is measurable.
 */
export function ShareButtons({
  url,
  text,
  source = "result_card",
}: {
  url: string;
  text: string;
  source?: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = withUtm(url, source);

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text,
  )}&url=${encodeURIComponent(shareUrl)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl,
  )}`;

  function onShare(via: string) {
    track("share_click", { via, source });
  }

  async function nativeShare() {
    onShare("native");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      void copy();
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      onShare("copy");
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onShare("x")}
        className="inline-flex items-center gap-1.5 bg-ink text-cream font-bold text-[12px] px-3.5 py-2 rounded-full hover:bg-blue-deep transition-colors"
      >
        𝕏 でシェア
      </a>
      <a
        href={liHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onShare("linkedin")}
        className="inline-flex items-center gap-1.5 bg-[#0A66C2] text-white font-bold text-[12px] px-3.5 py-2 rounded-full hover:opacity-90 transition-opacity"
      >
        in LinkedIn
      </a>
      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex items-center gap-1.5 bg-cream border border-ink/15 text-ink font-bold text-[12px] px-3.5 py-2 rounded-full hover:border-ink transition-colors"
      >
        {copied ? "✓ コピーしました" : "🔗 リンクをコピー"}
      </button>
    </div>
  );
}

function withUtm(url: string, source: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=share&utm_medium=social&utm_campaign=${source}`;
}
