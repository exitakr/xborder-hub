import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../src/session";
import { supabase } from "../src/supabase";
import { theme } from "../src/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <AuthGate />
        <StatusBar style="dark" />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

/**
 * Routes the user based on session state, and completes auth deep links.
 *
 * Magic-link and OAuth flows return to the app via the `oma://` scheme with a
 * code in the URL. Supabase's web client picks that up from `window.location`,
 * which does not exist here, so the exchange is done explicitly.
 */
function AuthGate() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function completeSignIn(url: string) {
      const { queryParams } = Linking.parse(url);
      const code = typeof queryParams?.code === "string" ? queryParams.code : null;
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        return;
      }

      // Implicit-flow links carry the tokens in the fragment instead.
      const fragment = url.split("#")[1];
      if (!fragment) return;
      const params = new URLSearchParams(fragment);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    }

    // A link that launched the app from cold start.
    Linking.getInitialURL().then((url) => {
      if (url) void completeSignIn(url);
    });

    const sub = Linking.addEventListener("url", ({ url }) => {
      void completeSignIn(url);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inApp = segments[0] === "(tabs)" || segments[0] === "item";

    if (!session && inApp) {
      router.replace("/login");
    } else if (session && !inApp) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.surface },
        headerTitleStyle: { fontSize: 16, fontWeight: "600", color: theme.color.ink },
        headerTintColor: theme.color.accent,
        contentStyle: { backgroundColor: theme.color.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="item/[id]" options={{ title: "" }} />
      <Stack.Screen name="legal" options={{ title: "" }} />
    </Stack>
  );
}
