import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES, CATEGORY_LABEL_KEY, getDict, newItemSchema, type Category } from "@oma/core";
import { alertHoldingLimit, isHoldingLimitError } from "../limits";
import { supabase } from "../supabase";
import { Button, Card } from "./ui";
import { theme } from "../theme";
import { useColors } from "../ThemeProvider";

type Dict = ReturnType<typeof getDict>;

/**
 * Add a catalogue item Browse does not have, then hold it.
 *
 * Runs through the `create_market_item` RPC (migration 0008) rather than an
 * `.insert()`: market_items has no authenticated-write RLS policy on purpose,
 * so a direct insert would fail — that failure is what stops a form on the
 * client from being a second way to write `current_price`.
 */
export function AddItemSheet({
  t,
  userId,
  defaultName = "",
  defaultCategory,
  onClose,
  onAdded,
}: {
  t: Dict;
  userId: string;
  defaultName?: string;
  defaultCategory?: Category | null;
  onClose: () => void;
  onAdded: (itemId: string) => void;
}) {
  const col = useColors();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<Category>(defaultCategory ?? "watch");
  const [name, setName] = useState(defaultName);
  const [detail, setDetail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);

    const parsed = newItemSchema.safeParse({
      category,
      name,
      detail: detail || undefined,
      identifier: identifier || undefined,
    });

    if (!parsed.success) {
      setError(t.mkAddOwnErrName);
      return;
    }

    setBusy(true);

    const { data: itemId, error: rpcError } = await supabase.rpc("create_market_item", {
      p_category: parsed.data.category,
      p_name: parsed.data.name,
      p_detail: parsed.data.detail ?? null,
      p_identifier: parsed.data.identifier ?? null,
    });

    if (rpcError || !itemId) {
      setBusy(false);
      setError(t.txErrGeneric);
      return;
    }

    const { error: holdError } = await supabase
      .from("holdings")
      .insert({ user_id: userId, market_item_id: itemId });

    setBusy(false);

    // The catalogue row was created and is now available to everyone, so it is
    // not rolled back — only the holding was refused. Saying so beats closing
    // the sheet as if it had worked, which is what happened before: the error
    // was discarded and the user was navigated to an item they did not hold.
    if (isHoldingLimitError(holdError)) {
      alertHoldingLimit(t);
      onClose();
      return;
    }
    if (holdError) {
      setError(t.txErrGeneric);
      return;
    }

    onAdded(itemId as string);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}>
        <Pressable style={{ flex: 1 }} accessibilityLabel={t.txCancel} onPress={onClose} />

        <View
          style={{
            backgroundColor: col.canvas,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + theme.space(4),
            maxHeight: "90%",
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: theme.space(4), gap: theme.space(4) }}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700" }}>{t.mkAddOwnTitle}</Text>
              <Text style={{ fontSize: 12, color: col.muted, marginTop: 4 }}>
                {t.mkAddOwnLead}
              </Text>
            </View>

            {error && (
              <Text accessibilityRole="alert" style={{ color: col.loss, fontSize: 13 }}>
                {error}
              </Text>
            )}

            <Card style={{ gap: theme.space(4) }}>
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    marginBottom: 6,
                    color: col.ink,
                  }}
                >
                  {t.mkCategory}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space(2) }}>
                  {CATEGORIES.map((c) => {
                    const active = c === category;
                    return (
                      <Pressable
                        key={c}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => setCategory(c)}
                        style={{
                          minHeight: 40,
                          paddingHorizontal: theme.space(3),
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
                            fontSize: 12,
                            fontWeight: "600",
                            color: active ? "#FFFFFF" : col.ink,
                          }}
                        >
                          {t[CATEGORY_LABEL_KEY[c]]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Field label={t.mkAddOwnName} value={name} onChangeText={setName} />
              <Field
                label={t.mkAddOwnDetail}
                value={detail}
                onChangeText={setDetail}
                placeholder={t.mkAddOwnDetailPlaceholder}
              />
              <Field
                label={t.mkAddOwnIdentifier}
                value={identifier}
                onChangeText={setIdentifier}
              />
            </Card>

            <Text style={{ fontSize: 11, color: col.muted }}>{t.mkAddOwnNote}</Text>

            <View style={{ flexDirection: "row", gap: theme.space(3) }}>
              <Button
                label={t.mkAddOwnSubmit}
                onPress={save}
                busy={busy}
                style={{ flex: 1 }}
              />
              <Button label={t.txCancel} variant="secondary" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const col = useColors();

  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6, color: col.ink }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={col.muted}
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
        {...props}
      />
    </View>
  );
}
