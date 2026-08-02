import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getDict, isCurrency, isLocale, type Currency, type Locale } from "@kura/core";
import { supabase } from "./supabase";
import { deviceLocale } from "./i18n";

export interface Profile {
  displayName: string | null;
  currency: Currency;
  locale: Locale;
  isAdmin: boolean;
}

interface SessionValue {
  session: Session | null;
  userId: string | null;
  profile: Profile;
  /** True until the stored session has been read — gates the first navigation. */
  loading: boolean;
  t: ReturnType<typeof getDict>;
  reloadProfile: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({
    displayName: null,
    currency: "JPY",
    // Until the profile loads, follow the device rather than defaulting to
    // Japanese for an English-speaking user.
    locale: deviceLocale(),
    isAdmin: false,
  });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const reloadProfile = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("profiles")
      .select("display_name, base_currency, locale, is_admin")
      .eq("id", userId)
      .maybeSingle();

    const currency = data?.base_currency;
    const savedLocale = data?.locale;

    setProfile({
      displayName: data?.display_name ?? null,
      currency: isCurrency(currency) ? currency : "JPY",
      locale: isLocale(savedLocale) ? savedLocale : deviceLocale(),
      isAdmin: Boolean(data?.is_admin),
    });
  }, [userId]);

  useEffect(() => {
    void reloadProfile();
  }, [reloadProfile]);

  const value = useMemo<SessionValue>(
    () => ({
      session,
      userId,
      profile,
      loading,
      t: getDict(profile.locale),
      reloadProfile,
    }),
    [session, userId, profile, loading, reloadProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
