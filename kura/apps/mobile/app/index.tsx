import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "../src/session";
import { theme } from "../src/theme";

/**
 * Entry route. Holds a spinner only for as long as it takes to read the stored
 * session, so a returning user never sees the login screen flash before their
 * portfolio appears.
 */
export default function Index() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.color.canvas,
        }}
      >
        <ActivityIndicator color={theme.color.accent} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}
