import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { brand, wordmark } from "@kura/core";
import { supabase } from "../src/supabase";
import { useSession } from "../src/session";
import { Button, Card, Disclaimer } from "../src/components/ui";
import { theme } from "../src/theme";

type Mode = "signIn" | "signUp" | "magic";

export default function LoginScreen() {
  const { t, profile } = useSession();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectTo = Linking.createURL("/");

  async function submit() {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        // One generic message for both unknown address and wrong password, so
        // the form cannot be used to discover who has an account.
        if (error) setError(t.txErrGeneric);
      } else if (mode === "signUp") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName }, emailRedirectTo: redirectTo },
        });
        if (error) setError(t.txErrGeneric);
        else setNotice(t.authMagicSent);
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) setError(t.txErrGeneric);
        else setNotice(t.authMagicSent);
      }
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    email.includes("@") &&
    (mode === "magic" || password.length >= 8) &&
    (mode !== "signUp" || displayName.trim().length > 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          padding: theme.space(5),
          paddingTop: insets.top + theme.space(10),
          paddingBottom: insets.bottom + theme.space(6),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 26, fontWeight: "700", color: theme.color.ink }}>
          {wordmark(profile.locale)}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 14, color: theme.color.muted }}>
          {brand.tagline[profile.locale]}
        </Text>

        <Card style={{ marginTop: theme.space(8), gap: theme.space(4) }}>
          {error && (
            <Text accessibilityRole="alert" style={{ color: theme.color.loss, fontSize: 13 }}>
              {error}
            </Text>
          )}
          {notice && (
            <Text style={{ color: theme.color.gain, fontSize: 13 }}>{notice}</Text>
          )}

          {mode === "signUp" && (
            <Field
              label={t.authDisplayName}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              textContentType="nickname"
            />
          )}

          <Field
            label={t.authEmail}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          {mode !== "magic" && (
            <Field
              label={t.authPassword}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              textContentType={mode === "signUp" ? "newPassword" : "password"}
              hint={mode === "signUp" ? t.authPasswordHint : undefined}
            />
          )}

          <Button
            label={
              mode === "signIn" ? t.authSignIn : mode === "signUp" ? t.authSignUp : t.authMagic
            }
            onPress={submit}
            busy={busy}
            disabled={!canSubmit}
          />
        </Card>

        <View style={{ marginTop: theme.space(5), gap: theme.space(3) }}>
          <LinkText
            label={mode === "signUp" ? t.authToSignIn : t.authToSignUp}
            onPress={() => {
              setMode(mode === "signUp" ? "signIn" : "signUp");
              setError(null);
              setNotice(null);
            }}
          />
          <LinkText
            label={mode === "magic" ? t.authSignIn : t.authMagic}
            onPress={() => {
              setMode(mode === "magic" ? "signIn" : "magic");
              setError(null);
              setNotice(null);
            }}
          />
        </View>

        <Disclaimer text={t.disclaimer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; hint?: string }) {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6, color: theme.color.ink }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.color.muted}
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: theme.color.line,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.space(3),
          fontSize: 15,
          color: theme.color.ink,
          backgroundColor: theme.color.surface,
        }}
        {...props}
      />
      {hint && (
        <Text style={{ fontSize: 11, color: theme.color.muted, marginTop: 4 }}>{hint}</Text>
      )}
    </View>
  );
}

function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Text
      accessibilityRole="button"
      onPress={onPress}
      style={{ color: theme.color.accent, fontSize: 14, textAlign: "center" }}
    >
      {label}
    </Text>
  );
}
