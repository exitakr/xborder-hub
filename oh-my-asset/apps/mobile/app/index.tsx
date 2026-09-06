import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "../src/session";
import { useColors } from "../src/ThemeProvider";

/**
 * Entry route. Holds a spinner only for as long as it takes to read the stored
 * session, so a returning user never sees the login screen flash before their
 * portfolio appears.
 */
export default function Index() {
  const col = useColors();

  const { session, loading } = useSession();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: col.canvas,
        }}
      >
        <ActivityIndicator color={col.accent} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}
