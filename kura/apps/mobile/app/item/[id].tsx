import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  CATEGORY_LABEL_KEY,
  fill,
  formatMoney,
  formatPercent,
  loadItemDetail,
  netQuantity,
  sourceLabel,
  type ItemDetail,
} from "@oma/core";
import { supabase } from "../../src/supabase";
import { useSession } from "../../src/session";
import { Button, Card, Disclaimer, Thumb } from "../../src/components/ui";
import { PriceChart, type TradeMarker } from "../../src/components/PriceChart";
import { TransactionSheet } from "../../src/components/TransactionSheet";
import { PriceReportSheet } from "../../src/components/PriceReportSheet";
import { ValuationSheet } from "../../src/components/ValuationSheet";
import { usePhotoUrls } from "../../src/usePhotoUrls";
import { numericFont, theme, toneColor } from "../../src/theme";
import { intlLocale } from "../../src/i18n";
import { useColors } from "../../src/ThemeProvider";

export default function ItemScreen() {
  const col = useColors();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, profile, t } = useSession();
  const navigation = useNavigation();

  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [sheet, setSheet] = useState<"buy" | "sell" | null>(null);
  const [reporting, setReporting] = useState(false);
  const [valuing, setValuing] = useState(false);
  const [editing, setEditing] = useState<ItemDetail["transactions"][number] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !id) return;
    const next = await loadItemDetail(supabase, id, userId, profile.currency);
    setDetail(next);
    if (next) navigation.setOptions({ title: next.item.name });
  }, [id, userId, profile.currency, navigation]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const [photoUrl] = usePhotoUrls([detail?.photoPath ?? null]);

  if (!detail) {
    return (
      <View style={{ flex: 1, padding: theme.space(6) }}>
        <Text style={{ color: col.muted, fontSize: 13 }}>{t.loading}</Text>
      </View>
    );
  }

  const { item, price, holdingId, transactions, summary } = detail;

  const markers: TradeMarker[] = detail.trades;

  async function addToHoldings() {
    if (!userId || !id) return;
    setBusy(true);
    const { error } = await supabase
      .from("holdings")
      .insert({ user_id: userId, market_item_id: id });
    if (!error || error.code === "23505") await load();
    setBusy(false);
  }

  async function pickPhoto() {
    if (!holdingId || !userId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (picked.canceled || !picked.assets[0]) return;

    setBusy(true);
    try {
      // Downscale and re-encode before upload (SPEC §7): the phone original can
      // be 10 MB, and what we store should be a JPEG we produced.
      const context = ImageManipulator.ImageManipulator.manipulate(picked.assets[0].uri);
      context.resize({ width: 1024 });
      const rendered = await context.renderAsync();
      const output = await rendered.saveAsync({
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const bytes = await (await fetch(output.uri)).arrayBuffer();
      const path = `${userId}/${holdingId}.jpg`;

      const { error } = await supabase.storage
        .from("holding-photos")
        .upload(path, bytes, { contentType: "image/jpeg", upsert: true });

      if (!error) {
        await supabase
          .from("holdings")
          .update({ photo_path: path })
          .eq("id", holdingId)
          .eq("user_id", userId);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(txId: string) {
    Alert.alert(t.txDeleteConfirm, "", [
      { text: t.txCancel, style: "cancel" },
      {
        text: t.txDelete,
        style: "destructive",
        onPress: async () => {
          if (!userId) return;
          await supabase.from("transactions").delete().eq("id", txId).eq("user_id", userId);
          await load();
        },
      },
    ]);
  }

  const heldNow = netQuantity(
    transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      tradedOn: tx.traded_on,
      quantity: tx.quantity,
      unitPrice: tx.unit_price,
    })),
  );

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: theme.space(4), gap: theme.space(4) }}>
        <View style={{ flexDirection: "row", gap: theme.space(4) }}>
          <Thumb uri={photoUrl ?? null} artUri={item.image_url} category={item.category} size={88} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 11, color: col.muted }}>
              {t[CATEGORY_LABEL_KEY[item.category]]}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "700", marginTop: 2 }}>{item.name}</Text>
            {item.detail && (
              <Text style={{ fontSize: 13, color: col.muted, marginTop: 2 }}>
                {item.detail}
              </Text>
            )}
            <Text style={[{ fontSize: 22, fontWeight: "700", marginTop: 8 }, numericFont]}>
              {price === null ? (
                <Text style={{ fontSize: 15, color: col.muted }}>{t.mkNoPrice}</Text>
              ) : (
                formatMoney(price, profile.currency, profile.locale)
              )}
            </Text>
            {/* Labelled at the number itself, not only in a footnote: the badge
                is what stops a self-reported figure reading as a market quote. */}
            {detail.selfReported && (
              <Text style={{ fontSize: 11, color: col.muted, marginTop: 4 }}>
                {t.srBadge} ·{" "}
                {fill(t.srNote, {
                  asOf: detail.selfReported.asOf,
                  source: detail.selfReported.source,
                })}
              </Text>
            )}
          </View>
        </View>

        {/* Provenance directly under the price: a number without a source is
            exactly what this product refuses to show. */}
        <Card style={{ gap: 4 }}>
          <Meta label={t.itSource}>
            {sourceLabel(item.source_type, profile.locale)}
            {hostOf(item.source_url) ? ` · ${hostOf(item.source_url)}` : ""}
          </Meta>
          <Meta label={t.itUpdatedAt}>
            {item.price_updated_at
              ? new Date(item.price_updated_at).toLocaleDateString(intlLocale(profile.locale))
              : t.noData}
          </Meta>
          <Meta label={t.itConfidence}>{confidenceLabel(t, item.data_confidence)}</Meta>

          {(item.data_confidence === "low" || item.data_confidence === "insufficient") && (
            <Text
              style={{
                fontSize: 11,
                lineHeight: 16,
                color: col.muted,
                backgroundColor: col.canvas,
                padding: theme.space(3),
                borderRadius: theme.radius.sm,
                marginTop: 4,
              }}
            >
              {t.itLowConfidenceWarn}
            </Text>
          )}
        </Card>

        <Card>
          <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: theme.space(2) }}>
            {t.itChart}
          </Text>
          <PriceChart
            points={detail.snapshots}
            community={detail.communitySeries}
            markers={markers}
            currency={profile.currency}
            locale={profile.locale}
            labels={{
              buy: t.itMarkerBuy,
              sell: t.itMarkerSell,
              empty: t.itNoChart,
              asking: t.cmAsking,
              realised: t.cmRealised,
            }}
          />
        </Card>

        {/* Realised prices get their own card rather than sitting beside the
            asking price: different question, different source, and merging the
            two would imply a single figure nobody actually quoted. */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: "600" }}>{t.cmTitle}</Text>
          <Text style={{ fontSize: 11, color: col.muted, marginTop: 4 }}>{t.cmLead}</Text>

          {detail.community ? (
            <>
              <Text
                style={[
                  { fontSize: 22, fontWeight: "600", marginTop: theme.space(3) },
                  numericFont,
                ]}
              >
                {formatMoney(detail.community.price, profile.currency, profile.locale)}
              </Text>
              <Text style={{ fontSize: 11, color: col.muted, marginTop: 4 }}>
                {t.cmContributors}: {detail.community.contributors} · {t.cmReports}:{" "}
                {detail.community.reports}
              </Text>
            </>
          ) : (
            <>
              <Text
                style={{ fontSize: 13, color: col.muted, marginTop: theme.space(3) }}
              >
                {t.cmNone}
              </Text>
              <Text style={{ fontSize: 11, color: col.muted, marginTop: 4 }}>
                {t.cmWhyThreshold}
              </Text>
            </>
          )}

          <Button
            label={t.cmReport}
            variant="secondary"
            onPress={() => setReporting(true)}
            style={{ marginTop: theme.space(3) }}
          />
        </Card>

        {/* Offered only where no feed answers. An item that already has a market
            price does not need a second one, and two figures side by side would
            just raise the question of which the portfolio total used. */}
        {item.current_price === null && (
          <Card>
            <Text style={{ fontSize: 13, fontWeight: "600" }}>{t.srTitle}</Text>
            <Text style={{ fontSize: 11, color: col.muted, marginTop: 4 }}>
              {t.srLead}
            </Text>
            <Button
              label={detail.selfReported ? t.srEdit : t.srAdd}
              variant="secondary"
              onPress={() => setValuing(true)}
              style={{ marginTop: theme.space(3) }}
            />
          </Card>
        )}

        {holdingId ? (
          <>
            <View style={{ flexDirection: "row", gap: theme.space(3) }}>
              <Stat label={t.pfQty} value={String(summary.quantity)} />
              <Stat
                label={t.pfAvgCost}
                value={formatMoney(summary.avgCost, profile.currency, profile.locale)}
              />
            </View>

            <Card>
              <Text style={{ fontSize: 11, color: col.muted }}>{t.pfPl}</Text>
              <Text
                style={[
                  {
                    fontSize: 16,
                    fontWeight: "600",
                    marginTop: 2,
                    color: toneColor(col, summary.unrealized),
                  },
                  numericFont,
                ]}
              >
                {formatMoney(summary.unrealized, profile.currency, profile.locale)} (
                {formatPercent(summary.unrealizedPct, profile.locale)})
              </Text>
            </Card>

            <View style={{ flexDirection: "row", gap: theme.space(3) }}>
              <Button
                label={t.itRecordBuy}
                onPress={() => {
                  setEditing(null);
                  setSheet("buy");
                }}
                style={{ flex: 1 }}
              />
              {summary.quantity > 0 && (
                <Button
                  label={t.itRecordSell}
                  variant="secondary"
                  onPress={() => {
                    setEditing(null);
                    setSheet("sell");
                  }}
                  style={{ flex: 1 }}
                />
              )}
            </View>

            <Button
              label={detail.photoPath ? t.itPhotoReplace : t.itPhotoAdd}
              variant="secondary"
              onPress={pickPhoto}
              busy={busy}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", marginTop: theme.space(2) }}>
              {t.itTransactions}
            </Text>

            {transactions.length === 0 ? (
              <Card>
                <Text style={{ fontSize: 13, color: col.muted }}>
                  {t.itNoTransactions}
                </Text>
              </Card>
            ) : (
              transactions.map((tx) => (
                <Card
                  key={tx.id}
                  style={{ flexDirection: "row", alignItems: "center", gap: theme.space(3) }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: tx.type === "buy" ? col.buy : col.sell,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>
                      {tx.type === "buy" ? "B" : "S"}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600" }}>
                      {tx.type === "buy" ? t.txBuy : t.txSell} ×{tx.quantity}
                    </Text>
                    <Text style={[{ fontSize: 11, color: col.muted }, numericFont]}>
                      {tx.traded_on} · {formatMoney(tx.unit_price, tx.currency, profile.locale)}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t.txEdit} ${tx.traded_on}`}
                    onPress={() => {
                      setEditing(tx);
                      setSheet(tx.type);
                    }}
                    style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: "center" }}
                  >
                    <Text style={{ fontSize: 12, color: col.accent }}>{t.txEdit}</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t.txDelete} ${tx.traded_on}`}
                    onPress={() => confirmDelete(tx.id)}
                    style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: "center" }}
                  >
                    <Text style={{ fontSize: 12, color: col.loss }}>{t.txDelete}</Text>
                  </Pressable>
                </Card>
              ))
            )}
          </>
        ) : (
          <Button label={t.itAddToHoldings} onPress={addToHoldings} busy={busy} />
        )}

        <Disclaimer text={t.disclaimer} />
      </ScrollView>

      {sheet && holdingId && (
        <TransactionSheet
          t={t}
          type={sheet}
          holdingId={holdingId}
          defaultCurrency={profile.currency}
          editing={editing}
          heldQuantity={heldNow}
          onClose={() => {
            setSheet(null);
            setEditing(null);
          }}
          onSaved={async () => {
            setSheet(null);
            setEditing(null);
            await load();
          }}
        />
      )}

      {reporting && (
        <PriceReportSheet
          t={t}
          marketItemId={id}
          defaultCurrency={profile.currency}
          onClose={() => setReporting(false)}
          onSaved={async () => {
            setReporting(false);
            // Reload rather than patch state: this report may be the third one,
            // which is what makes the published figure appear at all.
            await load();
          }}
        />
      )}

      {valuing && (
        <ValuationSheet
          t={t}
          marketItemId={id}
          defaultCurrency={profile.currency}
          existing={detail.selfReported}
          onClose={() => setValuing(false)}
          onSaved={async () => {
            setValuing(false);
            await load();
          }}
        />
      )}
    </>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  const col = useColors();

  return (
    <Text style={{ fontSize: 11, color: col.muted }}>
      {label}: {children}
    </Text>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const col = useColors();

  return (
    <Card style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: col.muted }}>{label}</Text>
      <Text style={[{ fontSize: 14, fontWeight: "600", marginTop: 2 }, numericFont]}>
        {value}
      </Text>
    </Card>
  );
}

function confidenceLabel(
  t: ReturnType<typeof import("@oma/core").getDict>,
  confidence: string | null,
): string {
  switch (confidence) {
    case "high":
      return t.confidenceHigh;
    case "medium":
      return t.confidenceMedium;
    case "low":
      return t.confidenceLow;
    case "insufficient":
      return t.confidenceInsufficient;
    default:
      return t.noData;
  }
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
