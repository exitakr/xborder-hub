import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Supabase client for the native app.
 *
 * Sessions are kept in the OS keychain (Keychain on iOS, EncryptedSharedPreferences
 * on Android) rather than AsyncStorage. AsyncStorage is unencrypted plaintext on
 * disk, and this app's refresh token grants access to a user's full holdings —
 * which is exactly the sensitive data SPEC §8 says to protect.
 *
 * SecureStore rejects values over ~2 KB, and a Supabase session with a large JWT
 * can exceed that, so values are transparently chunked.
 */

const CHUNK_SIZE = 1800;
/** Stored under the base key to say how many chunks follow. */
const chunkKey = (key: string, index: number) => `${key}.${index}`;

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const head = await SecureStore.getItemAsync(key);
    if (head === null) return null;

    // Plain (unchunked) value.
    if (!head.startsWith("__chunks__:")) return head;

    const count = Number(head.slice("__chunks__:".length));
    if (!Number.isInteger(count) || count <= 0) return null;

    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      // A missing chunk means a corrupted write; treat the whole value as absent
      // so the user is asked to sign in again rather than seeing a crash.
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    await clearChunks(key);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(
        chunkKey(key, i),
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
    // Written last: until the header exists, a partial write reads as absent.
    await SecureStore.setItemAsync(key, `__chunks__:${count}`);
  },

  async removeItem(key: string): Promise<void> {
    await clearChunks(key);
    await SecureStore.deleteItemAsync(key);
  },
};

async function clearChunks(key: string): Promise<void> {
  const head = await SecureStore.getItemAsync(key);
  if (head?.startsWith("__chunks__:")) {
    const count = Number(head.slice("__chunks__:".length));
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(chunkKey(key, i));
    }
  }
}

/**
 * Configuration lookup.
 *
 * `process.env.EXPO_PUBLIC_*` MUST be referenced literally: Expo inlines these
 * at build time by textual substitution, so a computed key like
 * `process.env[name]` resolves to undefined in a release build even though it
 * works in development. `extra` from app.json is the fallback for values
 * injected through EAS.
 */
function required(name: string, value: string | undefined): string {
  const resolved =
    value && value.length > 0
      ? value
      : (Constants.expoConfig?.extra?.[name] as string | undefined);

  if (!resolved) {
    throw new Error(
      `${name} is not configured. Set EXPO_PUBLIC_${name} in apps/mobile/.env, ` +
        `or provide it via EAS build env.`,
    );
  }
  return resolved;
}

const SUPABASE_URL = required("SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = required(
  "SUPABASE_ANON_KEY",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // SecureStore is unavailable when rendering on web; fall back to the
    // default storage there rather than crashing at import time.
    storage: Platform.OS === "web" ? undefined : secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Native apps receive the auth code through a deep link, which we hand to
    // Supabase explicitly; letting it parse window.location would do nothing.
    detectSessionInUrl: false,
  },
});
