"use client";

import { useState } from "react";
import { fill, type getDict } from "@oma/core";
import { disableShare, enableShare } from "./share-actions";

/**
 * Share the portfolio.
 *
 * Off by default and explicitly switched on, because the thing being shared is
 * a statement about how much money someone has. The panel says what leaves and
 * what does not before the link exists, rather than in a policy afterwards —
 * consent given without knowing the contents is not consent.
 *
 * The link is plain text with a copy button rather than only platform buttons:
 * most sharing in Japan happens in LINE and DMs that no share API covers, and
 * a copyable URL works everywhere including the places we did not think of.
 */
export function ShareButton({
  t,
  initialToken,
  shareText,
  origin,
}: {
  t: ReturnType<typeof getDict>;
  initialToken: string | null;
  /** Pre-rendered summary line — the numbers live on the server. */
  shareText: string;
  origin: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = token ? `${origin}/s/${token}` : "";

  async function toggle(on: boolean) {
    setBusy(true);
    const result = on ? await enableShare() : await disableShare();
    setBusy(false);
    if (!result.error) setToken(result.token ?? null);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard is blocked in some in-app browsers; the URL is on screen and
      // selectable, so there is still a way through.
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary px-3 py-1.5 text-xs">
        {t.shareButton}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-line bg-canvas p-3 text-left">
      <p className="text-sm font-semibold">{t.shareTitle}</p>
      {/* Before the link exists, not after. */}
      <p className="mt-1 text-xs leading-relaxed text-muted">{t.shareNote}</p>

      {token ? (
        <>
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={t.shareCopy}
            className="field mt-3 text-xs"
          />

          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="btn-primary px-3 py-1.5 text-xs">
              {copied ? t.shareCopied : t.shareCopy}
            </button>
            <a
              href={`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              {t.shareX}
            </a>
            <a
              href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              {t.shareLine}
            </a>
          </div>

          <p className="mt-3 text-xs text-muted">{t.shareOffNote}</p>
          <button
            type="button"
            onClick={() => toggle(false)}
            disabled={busy}
            className="mt-1 rounded text-xs text-loss hover:underline"
          >
            {t.shareOff}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => toggle(true)}
          disabled={busy}
          className="btn-primary mt-3 w-full text-sm"
        >
          {busy ? t.loading : t.shareOn}
        </button>
      )}
    </div>
  );
}
