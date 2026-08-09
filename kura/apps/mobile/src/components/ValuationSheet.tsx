import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CURRENCIES,
  getDict,
  selfReportedPriceSchema,
  type Currency,
  type SelfReportedPrice,
} from "@oma/core";
import { supabase } from "../supabase";
import { Button, Card } from "./ui";
import { numericFont, theme } from "../theme";

type Dict = ReturnType<typeof getDict>;

/**
 * The holder's own valuation, for items nothing prices automatically.
 *
 * Validation runs through the same Zod schema the web app uses, so the two
 * clients cannot disagree about what a valid entry is — in particular that a
 * source is mandatory, which is what keeps the figure judgeable later.
 */
export function ValuationSheet({
  t,
  marketItemId,
  defaultCurrency,
  existing,
  onClose,
  onSaved,
}: {
  t: Dict;
  marketItemId: string;
  defaultCurrency: Currency;
  existing: SelfReportedPrice | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();

  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [source, setSource] = useState(existing?.source ?? "");
  const [asOf, setAsOf] = useState(existing?.asOf ?? new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);

    const parsed = selfReportedPriceSchema.safeParse({
      marketItemId,
      price,
      currency,
      source,
      asOf,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.message === "future_date") setError(t.txErrFuture);
      else if (issue?.path.includes("price")) setError(t.txErrPrice);
      else if (issue?.path.includes("source")) setError(t.srErrSource);
      else setError(t.txErrGeneric);
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

    const { error: dbError } = await supabase.from("self_reported_prices").upsert(
      {
        user_id: user.id,
        market_item_id: marketItemId,
        price: parsed.data.price,
        currency: parsed.data.currency,
        source: parsed.data.source,
        as_of: parsed.data.asOf,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,market_item_id" },
    );

    setBusy(false);

    if (dbError) {
      setError(t.txErrGeneric);
      return;
    }

    onSaved();
  }

  async function remove() {
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("self_reported_prices")
        .delete()
        .eq("user_id", user.id)
        .eq("market_item_id", marketItemId);
    }
    setBusy(false);
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
            maxHeight: "90%",
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: theme.space(4), gap: theme.space(4) }}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700" }}>
                {existing ? t.srEdit : t.srAdd}
              </Text>
              <Text style={{ fontSize: 12, color: theme.color.muted, marginTop: 4 }}>
                {t.srLead}
              </Text>
            </View>

            {error && (
              <Text accessibilityRole="alert" style={{ color: theme.color.loss, fontSize: 13 }}>
                {error}
              </Text>
            )}

            <Card style={{ gap: theme.space(4) }}>
              <Field
                label={t.srPrice}
                value={price}
                onChangeText={setPrice}
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

              <Field
                label={t.srSource}
                value={source}
                onChangeText={setSource}
                placeholder={t.srSourcePlaceholder}
                maxLength={120}
                help={t.srSourceHelp}
              />

              <Field
                label={t.srAsOf}
                value={asOf}
                onChangeText={setAsOf}
                placeholder="YYYY-MM-DD"
                keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                autoCapitalize="none"
              />
            </Card>

            <Text style={{ fontSize: 11, color: theme.color.muted }}>{t.srPrivate}</Text>

            <View style={{ flexDirection: "row", gap: theme.space(3) }}>
              <Button label={t.srSave} onPress={save} busy={busy} style={{ flex: 1 }} />
              <Button label={t.txCancel} variant="secondary" onPress={onClose} />
            </View>

            {existing && (
              <Button label={t.srRemove} variant="danger" onPress={remove} busy={busy} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  help,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; help?: string }) {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6, color: theme.color.ink }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={help}
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
      {help && (
        <Text style={{ fontSize: 11, color: theme.color.muted, marginTop: 4 }}>{help}</Text>
      )}
    </View>
  );
}
