"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { getDict } from "@oma/core";
import { createClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/image";
import { savePhotoPath } from "./actions";

/**
 * Uploads a holding photo. The file is validated and re-encoded in the browser
 * (lib/image.ts) before it ever reaches Storage, and lands under
 * {user_id}/{holding_id}.jpg — the path shape the bucket policies key on.
 */
export function PhotoUploader({
  t,
  holdingId,
  marketItemId,
  hasPhoto,
}: {
  t: ReturnType<typeof getDict>;
  holdingId: string;
  marketItemId: string;
  hasPhoto: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file after an error
    if (!file) return;

    setError(null);

    const prepared = await prepareImage(file);
    if ("error" in prepared) {
      setError(t.txErrGeneric);
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t.txErrGeneric);
        return;
      }

      const path = `${user.id}/${holdingId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("holding-photos")
        .upload(path, prepared.blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) {
        setError(t.txErrGeneric);
        return;
      }

      const form = new FormData();
      form.set("holdingId", holdingId);
      form.set("marketItemId", marketItemId);
      form.set("photoPath", path);
      await savePhotoPath(form);

      router.refresh();
    });
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        className="sr-only"
        id={`photo-${holdingId}`}
      />
      <label
        htmlFor={`photo-${holdingId}`}
        className="btn-secondary cursor-pointer text-xs"
        aria-disabled={pending}
      >
        {pending ? t.loading : hasPhoto ? t.itPhotoReplace : t.itPhotoAdd}
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs text-loss">
          {error}
        </p>
      )}
    </div>
  );
}
