import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSession } from "../../src/session";
import { useColors } from "../../src/ThemeProvider";

const ICONS = {
  portfolio: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  market: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm5.5 12.5L21 21",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
} as const;

function TabIcon({
  name,
  color,
}: {
  name: keyof typeof ICONS;
  // expo-router hands the tint through as ColorValue, not string.
  color: ColorValue;
}) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d={ICONS[name]}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Three tabs, deliberately. The whole product is "what do I own, what can I
 * add, and my settings" — more tabs would only make the first one harder to find.
 */
export default function TabsLayout() {
  const col = useColors();

  const { t } = useSession();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: col.accent,
        tabBarInactiveTintColor: col.muted,
        tabBarStyle: { backgroundColor: col.surface, borderTopColor: col.line },
        headerStyle: { backgroundColor: col.surface },
        headerTitleStyle: { fontSize: 16, fontWeight: "600", color: col.ink },
        sceneStyle: { backgroundColor: col.canvas },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.pfTitle,
          tabBarIcon: ({ color }) => <TabIcon name="portfolio" color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: t.mkTitle,
          tabBarIcon: ({ color }) => <TabIcon name="market" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t.myTitle,
          tabBarIcon: ({ color }) => <TabIcon name="account" color={color} />,
        }}
      />
    </Tabs>
  );
}
