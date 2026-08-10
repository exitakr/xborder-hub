"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale } from "@oma/core";
import { LOCALE_COOKIE } from "./i18n-server";

/**
 * Switch display language for a visitor who has no profile to save it to.
 *
 * Signed-in users set this in /mypage, where it is stored on the account and
 * follows them between devices. Someone reading the landing or signup page has
 * no account yet — and deciding whether to create one is exactly when being
 * able to read the page matters most — so their choice lives in a cookie until
 * there is somewhere better to put it.
 */
export async function switchLocale(formData: FormData) {
  const next = formData.get("locale");
  if (typeof next !== "string" || !isLocale(next)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, next, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
}
