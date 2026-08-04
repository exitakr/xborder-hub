import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CONDITIONS,
  CURRENCIES,
  VENUES,
  getDict,
  priceReportSchema,
  type Currency,
} from "@kura/core";
import { supabase } from "../supabase";
import { Button, Card } from "./ui";
import { numericFont, theme } from "../theme";

type Dict = ReturnType<typeof getDict>;

const VENUE_KEY = {
  mercari: "cmVenueMercari",
  yahoo_auction: "cmVenueYahoo",
  store: "cmVenueStore",
  other: "cmVenueOther",
} as const;

const CONDITION_KEY = {
  new: "cmConditionNew",
  used: "cmConditionUsed",
  graded: "cmConditionGraded",
} as const;

/**
 * Contribute a realised trade to the community price.
 *
 * Validation runs through the same Zod schema the web app uses, so the two
 * clients cannot disagree about what a valid report is. The three-contributor
 * floor that decides whether a figure is published at all lives in the database
 * (migration 0006), not here — a client is not where that rule can be enforced.
 */
export function PriceReportSheet({
  t,
  marketItemId,
  defaultCurrency,
  onClose,
  onSaved,
}: {
  t: Dict;
  marketItemId: string;
  defaultCurrency: Currency;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();

  const [kind, setKind] = useState<"sold" | "bought">("sold");
  const [tradedOn, setTradedOn] = useState(new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [venue, setVenue] = useState<(typeof VENUES)[number]>("other");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("used");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);

    const parsed = priceReportSchema.safeParse({
      marketItemId,
      kind,
      price,
      currency,
      tradedOn,
      venue,
      condition,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.message === "future_date") setError(t.txErrFuture);
      else if (issue?.path.includes("price")) setError(t.txErrPrice);
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

    const { error: dbError } = await supabase.from("price_reports").insert({
      market_item_id: marketItemId,
      user_id: user.id,
      kind: parsed.data.kind,
      price: parsed.data.price,
      currency: parsed.data.currency,
      traded_on: parsed.data.tradedOn,
      venue: parsed.data.venue,
      condition: parsed.data.condition,
    });

    setBusy(false);

    if (dbError) {
      setError(t.txErrGeneric);
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
            maxHeight: "90%",
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: theme.space(4), gap: theme.space(4) }}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700" }}>{t.cmReportTitle}</Text>
              <Text style={{ fontSize: 12, color: theme.color.muted, marginTop: 4 }}>
                {t.cmReportLead}
              </Text>
            </View>

            {error && (
              <Text accessibilityRole="alert" style={{ color: theme.color.loss, fontSize: 13 }}>
                {error}
              </Text>
            )}

            <Card style={{ gap: theme.space(4) }}>
              <Choice
                label={t.cmKind}
                options={[
                  { value: "sold" as const, label: t.cmKindSold },
                  { value: "bought" as const, label: t.cmKindBought },
                ]}
                selected={kind}
                onSelect={setKind}
              />

              <Field
                label={t.txDate}
                value={tradedOn}
                onChangeText={setTradedOn}
                placeholder="YYYY-MM-DD"
                keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                autoCapitalize="none"
              />

              <Field
                label={t.txUnitPrice}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />

              <Choice
                label={t.myCurrency}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                selected={currency}
                onSelect={setCurrency}
              />

              <Choice
                label={t.cmVenue}
                options={VENUES.map((v) => ({ value: v, label: t[VENUE_KEY[v]] }))}
                selected={venue}
                onSelect={setVenue}
              />

              <Choice
                label={t.cmCondition}
                options={CONDITIONS.map((c) => ({ value: c, label: t[CONDITION_KEY[c]] }))}
                selected={condition}
                onSelect={setCondition}
              />
            </Card>

            <Text style={{ fontSize: 11, color: theme.color.muted }}>{t.cmPrivacyNote}</Text>

            <View style={{ flexDirection: "row", gap: theme.space(3) }}>
              <Button label={t.cmSubmit} onPress={save} busy={busy} style={{ flex: 1 }} />
              <Button label={t.txCancel} variant="secondary" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Segmented selector. Wraps, because venue labels are longer than a currency code. */
function Choice<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6, color: theme.color.ink }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space(2) }}>
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(option.value)}
              style={{
                minHeight: 44,
                paddingHorizontal: theme.space(4),
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
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
