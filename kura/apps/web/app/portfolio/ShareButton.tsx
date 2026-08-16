"use client";

import { useEffect, useState } from "react";
import { fill, type getDict } from "@oma/core";
import { disableShare, enableShare } from "./share-actions";

/**
 * Share the portfolio, as a picture first.
 *
 * The link came first in the previous version and that had it backwards. What
 * actually circulates is an image: people screenshot the screen and post the
 * crop. Generating the picture ourselves means the thing that travels is
 * composed on purpose rather than accidentally, and it works in every place a
 * link preview does not — a LINE group, a Discord server, a story.
 *
 * The image is fetched rather than drawn here: the figures live on the server,
 * and asking the client to redraw them would be a second implementation of the
 * portfolio maths that could disagree with the first.
 */
export function ShareButton({
  t,
  initialToken,
  shareText,
  origin,
}: {
  t: ReturnType<typeof getDict>;
  initialToken: string | null;
  shareText: string;
  origin: string;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(initialToken);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const url = token ? `${origin}/s/${token}` : "";

  // Built when the panel opens, not on page load: it is a real render on the
  // server and most visits to this screen never share.
  useEffect(() => {
    if (!open || image || loadingImage) return;

    let revoked: string | null = null;
    setLoadingImage(true);
    (async () => {
      try {
        const res = await fetch("/portfolio/snapshot");
        if (!res.ok) return;
        const blob = await res.blob();
        revoked = URL.createObjectURL(blob);
        setImage({ url: revoked, blob });
      } catch {
        // Offline or blocked: the link half of the panel still works.
      } finally {
        setLoadingImage(false);
      }
    })();

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, image, loadingImage]);

  async function shareImage() {
    if (!image) return;
    const file = new File([image.blob], "oh-my-asset.png", { type: "image/png" });

    // The OS sheet where it exists — that is the one path that reaches LINE,
    // Instagram and the camera roll without us integrating any of them.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: shareText });
        return;
      } catch {
        // Cancelled, or refused by the browser. Fall through to a download.
      }
    }

    const a = document.createElement("a");
    a.href = image.url;
    a.download = "oh-my-asset.png";
    a.click();
  }

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
      // Blocked in some in-app browsers; the URL is on screen and selectable.
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
      >
        {t.shareButton}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-line bg-canvas p-3 text-left">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{t.shareImageTitle}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.txCancel}
          className="rounded px-2 text-sm text-muted hover:text-ink"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" className="block w-full" />
        ) : (
          <div className="flex h-56 items-center justify-center text-xs text-muted">
            {t.shareSaving}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-muted">{t.shareImageNote}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={shareImage}
          disabled={!image}
          className="btn-primary px-4 py-2 text-sm"
        >
          {t.shareSystem}
        </button>
        <a
          href={image?.url ?? "#"}
          download="oh-my-asset.png"
          aria-disabled={!image}
          className={`btn-secondary px-4 py-2 text-sm ${image ? "" : "pointer-events-none opacity-50"}`}
        >
          {t.shareSave}
        </a>
      </div>

      {/* The link is still here, below the image, for the places that prefer
          one — and because a link is the only form that can bring somebody
          back to sign up. */}
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-sm font-semibold">{t.shareLinkSection}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t.shareNote}</p>

        {token ? (
          <>
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={t.shareCopy}
              className="field mt-2 text-xs"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={copy} className="btn-secondary px-3 py-1.5 text-xs">
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
            <button
              type="button"
              onClick={() => toggle(false)}
              disabled={busy}
              className="mt-3 rounded text-xs text-loss hover:underline"
            >
              {t.shareOff}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => toggle(true)}
            disabled={busy}
            className="btn-secondary mt-2 w-full text-sm"
          >
            {busy ? t.loading : t.shareOn}
          </button>
        )}
      </div>
    </div>
  );
}
