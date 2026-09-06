import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../src/session";
import { supabase } from "../src/supabase";
import { ThemeProvider, useColors, useTheme } from "../src/ThemeProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Outside the session provider: the theme applies to the login screen
          too, and a signed-out user is still a user with a preference. */}
      <ThemeProvider>
        <SessionProvider>
          <AuthGate />
          <ThemedStatusBar />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * The clock and battery icons are drawn by the OS over our background, so they
 * have to be told which way to contrast — left on `dark` they vanish into a
 * dark canvas.
 */
function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

/**
 * Routes the user based on session state, and completes auth deep links.
 *
 * Magic-link and OAuth flows return to the app via the `oma://` scheme with a
 * code in the URL. Supabase's web client picks that up from `window.location`,
 * which does not exist here, so the exchange is done explicitly.
 */
function AuthGate() {
  const col = useColors();

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
        headerStyle: { backgroundColor: col.surface },
        headerTitleStyle: { fontSize: 16, fontWeight: "600", color: col.ink },
        headerTintColor: col.accent,
        contentStyle: { backgroundColor: col.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="item/[id]" options={{ title: "" }} />
      <Stack.Screen name="legal" options={{ title: "" }} />
    </Stack>
  );
}
