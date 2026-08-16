import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { CURRENCIES, LOCALES, type Currency, type Locale } from "@oma/core";
import { supabase } from "../../src/supabase";
import { useSession } from "../../src/session";
import { Button, Card, Disclaimer } from "../../src/components/ui";
import { theme } from "../../src/theme";
import { useColors, useTheme } from "../../src/ThemeProvider";

const LOCALE_NAMES: Record<Locale, string> = { ja: "日本語", en: "English" };

export default function AccountScreen() {
  const col = useColors();
  const { scheme, toggle } = useTheme();

  const { userId, profile, t, reloadProfile } = useSession();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [currency, setCurrency] = useState<Currency>(profile.currency);
  const [locale, setLocale] = useState<Locale>(profile.locale);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!userId) return;
    setBusy(true);
    setSaved(false);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), base_currency: currency, locale })
      .eq("id", userId);

    if (!error) {
      await reloadProfile();
      setSaved(true);
    }
    setBusy(false);
  }

  function confirmDelete() {
    // Two-step: the OS dialog states the consequence, and the destructive
    // action is not the default button.
    Alert.alert(t.myDanger, t.myDangerBody, [
      { text: t.txCancel, style: "cancel" },
      {
        text: t.myDeleteAccount,
        style: "destructive",
        onPress: () => void performDelete(),
      },
    ]);
  }

  async function performDelete() {
    if (!userId) return;
    setBusy(true);

    // Storage first: once the auth row is gone the bucket policies no longer
    // match, which would orphan the files.
    const { data: files } = await supabase.storage.from("holding-photos").list(userId);
    if (files && files.length > 0) {
      await supabase.storage
        .from("holding-photos")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }

    const { error } = await supabase.rpc("delete_my_account");
    setBusy(false);
    if (error) return;

    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: theme.space(4), gap: theme.space(4) }}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={{ gap: theme.space(4) }}>
        {saved && <Text style={{ color: col.gain, fontSize: 13 }}>{t.mySaved}</Text>}

        <View>
          <Label>{t.myDisplayName}</Label>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            accessibilityLabel={t.myDisplayName}
            maxLength={60}
            style={{
              minHeight: 48,
              borderWidth: 1,
              borderColor: col.line,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.space(3),
              fontSize: 15,
              color: col.ink,
              backgroundColor: col.surface,
            }}
          />
        </View>

        <View>
          <Label>{t.myCurrency}</Label>
          <Segmented
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            value={currency}
            onChange={setCurrency}
          />
        </View>

        <View>
          <Label>{t.myLanguage}</Label>
          <Segmented
            options={LOCALES.map((l) => ({ value: l, label: LOCALE_NAMES[l] }))}
            value={locale}
            onChange={setLocale}
          />
        </View>

        {/* Applies on tap rather than on save. Everything else in this card is
            a profile field that round-trips to the server; the theme is a
            device setting, and making someone press Save to see a colour
            change would read as the control being broken. */}
        <View>
          <Label>{t.themeLabel}</Label>
          <Segmented
            options={[
              { value: "light" as const, label: t.themeLight },
              { value: "dark" as const, label: t.themeDark },
            ]}
            value={scheme}
            onChange={(next) => {
              if (next !== scheme) toggle();
            }}
          />
        </View>

        <Button
          label={t.mySave}
          onPress={save}
          busy={busy}
          disabled={displayName.trim().length === 0}
        />
      </Card>

      <Button label={t.navLogout} variant="secondary" onPress={() => supabase.auth.signOut()} />

      <Pressable accessibilityRole="link" onPress={() => router.push("/legal")}>
        <Text style={{ fontSize: 13, color: col.accent, textAlign: "center" }}>
          {t.legalTerms} · {t.legalPrivacy}
        </Text>
      </Pressable>

      <Card style={{ borderColor: col.loss, gap: theme.space(3) }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: col.loss }}>
          {t.myDanger}
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 20, color: col.muted }}>
          {t.myDangerBody}
        </Text>
        <Button label={t.myDeleteAccount} variant="danger" onPress={confirmDelete} busy={busy} />
      </Card>

      <Disclaimer text={t.disclaimer} trademark={t.trademarkNotice} />
    </ScrollView>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const col = useColors();

  return (
    <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6, color: col.ink }}>
      {children}
    </Text>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
}) {
  const col = useColors();
  return (
    <View style={{ flexDirection: "row", gap: theme.space(2) }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: active ? col.accent : col.line,
              backgroundColor: active ? col.accent : col.surface,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: active ? "#FFFFFF" : col.ink,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
