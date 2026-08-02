import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CURRENCIES,
  getDict,
  transactionSchema,
  type Currency,
  type TransactionRow,
} from "@kura/core";
import { supabase } from "../supabase";
import { Button, Card } from "./ui";
import { numericFont, theme } from "../theme";

type Dict = ReturnType<typeof getDict>;

/**
 * Record or edit a trade.
 *
 * Validation runs through the same Zod schema the web app uses, so the two
 * clients cannot disagree about what a valid trade is. The oversell rule is
 * additionally enforced by a database trigger (migration 0004), because a
 * client-side check is not a constraint.
 */
export function TransactionSheet({
  t,
  type,
  holdingId,
  defaultCurrency,
  editing,
  heldQuantity,
  onClose,
  onSaved,
}: {
  t: Dict;
  type: "buy" | "sell";
  holdingId: string;
  defaultCurrency: Currency;
  editing: TransactionRow | null;
  heldQuantity: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();

  const today = new Date().toISOString().slice(0, 10);
  const [tradedOn, setTradedOn] = useState(editing?.traded_on ?? today);
  const [quantity, setQuantity] = useState(String(editing?.quantity ?? 1));
  const [unitPrice, setUnitPrice] = useState(
    editing ? String(editing.unit_price) : "",
  );
  const [currency, setCurrency] = useState<Currency>(editing?.currency ?? defaultCurrency);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);

    const parsed = transactionSchema.safeParse({
      holdingId,
      type,
      tradedOn,
      quantity,
      unitPrice,
      currency,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.message === "future_date") setError(t.txErrFuture);
      else if (issue?.path.includes("quantity")) setError(t.txErrQty);
      else if (issue?.path.includes("unitPrice")) setError(t.txErrPrice);
      else setError(t.txErrGeneric);
      return;
    }

    // Selling more than is held would drive the position negative.
    const available = editing && editing.type === "sell"
      ? heldQuantity + editing.quantity
      : heldQuantity;
    if (type === "sell" && parsed.data.quantity > available) {
      setError(t.txErrOversell);
      return;
    }

    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBusy(false);
      setError(t.txErrGeneric);
      return;
    }

    const row = {
      holding_id: holdingId,
      user_id: user.id,
      type,
      traded_on: parsed.data.tradedOn,
      quantity: parsed.data.quantity,
      unit_price: parsed.data.unitPrice,
      currency: parsed.data.currency,
    };

    const { error: dbError } = editing
      ? await supabase.from("transactions").update(row).eq("id", editing.id).eq("user_id", user.id)
      : await supabase.from("transactions").insert(row);

    setBusy(false);

    if (dbError) {
      // The oversell trigger raises a named exception; surface the specific
      // message rather than a generic failure.
      setError(dbError.message.includes("oversell") ? t.txErrOversell : t.txErrGeneric);
      return;
    }

    onSaved();
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}>
        <Pressable style={{ flex: 1 }} accessibilityLabel={t.txCancel} onPress={onClose} />

        <View
          style={{
            backgroundColor: theme.color.canvas,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + theme.space(4),
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: theme.space(4), gap: theme.space(4) }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ fontSize: 16, fontWeight: "700" }}>
              {type === "buy" ? t.itRecordBuy : t.itRecordSell}
            </Text>

            {error && (
              <Text accessibilityRole="alert" style={{ color: theme.color.loss, fontSize: 13 }}>
                {error}
              </Text>
            )}

            <Card style={{ gap: theme.space(4) }}>
              <Field
                label={t.txDate}
                value={tradedOn}
                onChangeText={setTradedOn}
                placeholder="YYYY-MM-DD"
                keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                autoCapitalize="none"
              />
              <Field
                label={t.txQty}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
              <Field
                label={t.txUnitPrice}
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="decimal-pad"
              />

              <View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    marginBottom: 6,
                    color: theme.color.ink,
                  }}
                >
                  {t.myCurrency}
                </Text>
                <View style={{ flexDirection: "row", gap: theme.space(2) }}>
                  {CURRENCIES.map((c) => {
                    const active = c === currency;
                    return (
                      <Pressable
                        key={c}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => setCurrency(c)}
                        style={{
                          flex: 1,
                          minHeight: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: theme.radius.md,
                          borderWidth: 1,
                          borderColor: active ? theme.color.accent : theme.color.line,
                          backgroundColor: active ? theme.color.accent : theme.color.surface,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: active ? "#FFFFFF" : theme.color.ink,
                          }}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Card>

            <View style={{ flexDirection: "row", gap: theme.space(3) }}>
              <Button label={t.txSave} onPress={save} busy={busy} style={{ flex: 1 }} />
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
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6, color: theme.color.ink }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.color.muted}
        style={[
          {
            minHeight: 48,
            borderWidth: 1,
            borderColor: theme.color.line,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space(3),
            fontSize: 15,
            color: theme.color.ink,
            backgroundColor: theme.color.surface,
          },
          numericFont,
        ]}
        {...props}
      />
    </View>
  );
}
