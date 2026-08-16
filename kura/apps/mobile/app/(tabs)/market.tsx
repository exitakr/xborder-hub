import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  CATEGORIES,
  CATEGORY_LABEL_KEY,
  convert,
  formatMoney,
  heldItemIds,
  loadFxRates,
  searchItems,
  type Category,
  type FxTable,
  type MarketItem,
} from "@oma/core";
import { supabase } from "../../src/supabase";
import { useSession } from "../../src/session";
import { Button, Card, CategoryGlyph, Disclaimer, Thumb } from "../../src/components/ui";
import { AddItemSheet } from "../../src/components/AddItemSheet";
import { alertHoldingLimit, isHoldingLimitError } from "../../src/limits";
import { numericFont, theme } from "../../src/theme";
import { useColors } from "../../src/ThemeProvider";

export default function MarketScreen() {
  const col = useColors();

  const { userId, profile, t } = useSession();
  const router = useRouter();

  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [held, setHeld] = useState<Set<string>>(new Set());
  const [fx, setFx] = useState<FxTable>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    // Debounced so typing does not fire a query per keystroke.
    const timer = setTimeout(async () => {
      try {
        const [results, rates] = await Promise.all([
          searchItems(supabase, { term, category }),
          loadFxRates(supabase),
        ]);
        if (!active) return;
        setItems(results);
        setFx(rates);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term, category]);

  // Refresh ownership badges on focus: the user may have just added an item.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void heldItemIds(supabase, userId).then(setHeld);
    }, [userId]),
  );

  async function add(itemId: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("holdings")
      .insert({ user_id: userId, market_item_id: itemId });

    // A refused add used to do nothing at all — no message, no navigation —
    // which reads as a broken button rather than as a limit.
    if (isHoldingLimitError(error)) {
      alertHoldingLimit(t);
      return;
    }

    // 23505 = already held; navigating on is the right outcome either way.
    if (!error || error.code === "23505") router.push(`/item/${itemId}`);
    else Alert.alert(t.errorTitle, t.errorBody);
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: theme.space(4), gap: theme.space(3) }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Above the search box: someone who already knows Browse is missing
          something should not have to search first and find nothing. */}
      <Button
        label={t.mkAddOwn}
        variant="secondary"
        onPress={() => setAdding(true)}
      />

      <TextInput
        value={term}
        onChangeText={setTerm}
        placeholder={t.mkSearch}
        accessibilityLabel={t.mkSearch}
        placeholderTextColor={col.muted}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.space(2), paddingVertical: 2 }}
      >
        <Chip label={t.mkAll} active={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t[CATEGORY_LABEL_KEY[c]]}
            active={category === c}
            onPress={() => setCategory(category === c ? null : c)}
            category={c}
          />
        ))}
      </ScrollView>

      {loading ? (
        <Text style={{ color: col.muted, fontSize: 13, paddingVertical: theme.space(8), textAlign: "center" }}>
          {t.loading}
        </Text>
      ) : items.length === 0 ? (
        <View style={{ paddingVertical: theme.space(4), gap: theme.space(3) }}>
          <Text style={{ color: col.muted, fontSize: 13, textAlign: "center" }}>
            {t.mkNoResults}
          </Text>
          {term.trim().length > 0 && (
            <Button label={t.mkAddOwnSubmit} onPress={() => setAdding(true)} />
          )}
        </View>
      ) : (
        items.map((item) => {
          const price = convert(item.current_price, item.currency, profile.currency, fx);
          const owned = held.has(item.id);

          return (
            <Card
              key={item.id}
              style={{ flexDirection: "row", alignItems: "center", gap: theme.space(3) }}
            >
              {/* Artwork where the source publishes it, glyph otherwise. In a
                  list of same-named printings the picture is what tells them
                  apart, which is the whole reason to show one here. */}
              <Thumb uri={null} artUri={item.image_url} category={item.category} />

              <Pressable
                accessibilityRole="button"
                style={{ flex: 1, minWidth: 0 }}
                onPress={() => router.push(`/item/${item.id}`)}
              >
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600" }}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 11, color: col.muted }}>
                  {item.detail ?? item.identifier ?? ""}
                </Text>
                <Text style={[{ fontSize: 14, marginTop: 2 }, numericFont]}>
                  {price === null ? (
                    <Text style={{ color: col.muted }}>{t.mkNoPrice}</Text>
                  ) : (
                    formatMoney(price, profile.currency, profile.locale)
                  )}
                </Text>
              </Pressable>

              {owned ? (
                <Text style={{ fontSize: 11, color: col.muted }}>{t.mkAdded}</Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t.mkAdd} ${item.name}`}
                  onPress={() => add(item.id)}
                  style={({ pressed }) => ({
                    minHeight: 44,
                    paddingHorizontal: theme.space(3),
                    justifyContent: "center",
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: col.line,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: col.accent }}>
                    {t.mkAdd}
                  </Text>
                </Pressable>
              )}
            </Card>
          );
        })
      )}

      <Disclaimer text={t.disclaimer} />

      {adding && userId && (
        <AddItemSheet
          t={t}
          userId={userId}
          defaultName={term}
          defaultCategory={category}
          onClose={() => setAdding(false)}
          onAdded={(itemId) => {
            setAdding(false);
            router.push(`/item/${itemId}`);
          }}
        />
      )}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
  category,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  category?: Category;
}) {
  const col = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        minHeight: 36,
        paddingHorizontal: theme.space(3),
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: active ? col.accent : col.line,
        backgroundColor: active ? col.accent : col.surface,
      }}
    >
      {category && (
        <CategoryGlyph
          category={category}
          size={14}
          color={active ? "#FFFFFF" : col.muted}
        />
      )}
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: active ? "#FFFFFF" : col.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
