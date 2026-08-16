import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import type { Category } from "@oma/core";
import { theme } from "../theme";
import { useColors } from "../ThemeProvider";

/** Card surface, matching the web app's `.card`. */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const col = useColors();

  return (
    <View
      style={[
        {
          backgroundColor: col.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: col.line,
          padding: theme.space(4),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  busy,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
}) {
  const col = useColors();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || busy) }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 48, // comfortably above the 44pt touch-target minimum
          paddingHorizontal: theme.space(5),
          borderRadius: theme.radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isPrimary ? col.accent : col.surface,
          borderWidth: isPrimary ? 0 : 1,
          borderColor: isDanger ? col.loss : col.line,
          opacity: disabled || busy ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={isPrimary ? "#FFFFFF" : col.ink} />
      ) : (
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isPrimary ? "#FFFFFF" : isDanger ? col.loss : col.ink,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * SPEC §1.3: this text must appear on every screen. Each screen renders it at
 * the end of its scroll content.
 */
export function Disclaimer({ text }: { text: string }) {
  const col = useColors();

  return (
    <Text
      style={{
        fontSize: 11,
        lineHeight: 16,
        color: col.muted,
        marginTop: theme.space(6),
        marginBottom: theme.space(4),
      }}
    >
      {text}
    </Text>
  );
}

/**
 * Original category artwork — the app never ships brand imagery (SPEC §1.2).
 * Paths are shared with the web app's CategoryGlyph.
 */
const GLYPHS: Record<Category, string> = {
  pokemon:
    "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 4h8M8 11h8M8 15h5",
  tcg: "M9 4h9a2 2 0 0 1 2 2v11M6 7h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z",
  watch: "M12 8v4l2.5 1.5M9 3h6l-.5 3.2M9 21h6l-.5-3.2M12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
  bag: "M4 8h16l-1.2 12H5.2L4 8Zm4 0V6a4 4 0 0 1 8 0v2",
  sneaker: "M3 15h12l4-2.5a3 3 0 0 1 2 2.8V18H3v-3Zm0 0V9l3 1 2 3m2-1.6 2 1.2",
  car: "M4 16v-3.5L6 8h12l2 4.5V16M4 16h16M4 16a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Zm13 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0ZM7 8l1-2h8l1 2",
  other: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18m8-13.5L4 16.5m16 0L4 7.5",
};

export function CategoryGlyph({
  category,
  size = 20,
  color,
}: {
  category: Category;
  size?: number;
  color?: string;
}) {
  // Defaulted in the body rather than in the signature: the fallback comes from
  // the active theme, and a default parameter is evaluated before any hook can
  // run.
  const col = useColors();
  const stroke = color ?? col.muted;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={GLYPHS[category]}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Thumbnail, in order of preference: the user's own photo, the card's artwork,
 * then the category glyph.
 *
 * Still never a brand's product image — a marketplace listing photo belongs to
 * its seller. Card art is different: Scryfall and pokemontcg.io publish it so
 * collection software can show it, both are credited on the item screen, and
 * the picture is how you recognise the card. Cards therefore have `artUri`;
 * every other category passes null and keeps the glyph.
 */
export function Thumb({
  uri,
  artUri = null,
  category,
  size = 44,
}: {
  uri: string | null;
  artUri?: string | null;
  category: Category;
  size?: number;
}) {
  const col = useColors();
  const source = uri ?? artUri;

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        accessibilityIgnoresInvertColors
        style={{
          width: size,
          height: size,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: col.line,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: col.line,
        backgroundColor: col.canvas,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CategoryGlyph category={category} size={size * 0.45} />
    </View>
  );
}

/** Inline price-shape indicator for list rows. */
export function Sparkline({
  values,
  width = 56,
  height = 22,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const col = useColors();

  if (values.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const rising = values[values.length - 1] >= values[0];

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={rising ? col.gain : col.loss}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
