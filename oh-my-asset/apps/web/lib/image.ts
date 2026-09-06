/**
 * Client-side image preparation (SPEC §7).
 *
 * The file's declared MIME type is attacker-controlled, so we sniff the magic
 * number instead. Re-encoding through a canvas is the second line of defence:
 * whatever the input claimed to be, what we upload is a JPEG we produced.
 */

export const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_EDGE_PX = 1024;
export const JPEG_QUALITY = 0.8;

export type ImageError = "too_large" | "unsupported_type" | "decode_failed";

/** Sniff the real format from the first bytes of the file. */
export async function detectImageType(
  file: File,
): Promise<"image/jpeg" | "image/png" | "image/webp" | null> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  // JPEG: FF D8 FF
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => header[i] === b)) return "image/png";

  // WebP: "RIFF" .... "WEBP"
  const riff = [0x52, 0x49, 0x46, 0x46];
  const webp = [0x57, 0x45, 0x42, 0x50];
  if (riff.every((b, i) => header[i] === b) && webp.every((b, i) => header[i + 8] === b)) {
    return "image/webp";
  }

  return null;
}

/**
 * Validate, downscale to `MAX_EDGE_PX` on the long edge, and re-encode as JPEG.
 * Returns a Blob ready to upload, or an error code the caller can translate.
 */
export async function prepareImage(
  file: File,
): Promise<{ blob: Blob } | { error: ImageError }> {
  if (file.size > MAX_INPUT_BYTES) return { error: "too_large" };

  const sniffed = await detectImageType(file);
  if (!sniffed) return { error: "unsupported_type" };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: "decode_failed" };
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { error: "decode_failed" };
  }

  // Flatten onto white: JPEG has no alpha, and without this a transparent PNG
  // re-encodes with a black background.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );

  if (!blob) return { error: "decode_failed" };
  return { blob };
}
