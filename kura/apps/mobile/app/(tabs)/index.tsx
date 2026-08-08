import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  CATEGORY_LABEL_KEY,
  fill,
  formatMoney,
  formatPercent,
  loadPortfolio,
  loadPortfolioSeries,
  type PortfolioPoint,
  type PortfolioView,
} from "@kura/core";
import { supabase } from "../../src/supabase";
import { useSession } from "../../src/session";
import { Button, Card, Disclaimer, Sparkline, Thumb } from "../../src/components/ui";
import { PriceChart } from "../../src/components/PriceChart";
import { numericFont, theme, toneColor } from "../../src/theme";
import { usePhotoUrls } from "../../src/usePhotoUrls";

export default function PortfolioScreen() {
  const { userId, profile, t } = useSession();
  const router = useRouter();

  const [view, setView] = useState<PortfolioView | null>(null);
  const [series, setSeries] = useState<PortfolioPoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setFailed(false);
      const [portfolio, points] = await Promise.all([
        loadPortfolio(supabase, userId, profile.currency),
        loadPortfolioSeries(supabase, userId, profile.currency),
      ]);
      setView(portfolio);
      setSeries(points);
    } catch {
      // A failed load must not blank the screen or crash; show a retry instead.
      setFailed(true);
    }
  }, [userId, profile.currency]);

  // Re-run whenever the tab regains focus, so a trade recorded on the item
  // screen is reflected the moment the user comes back here.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const photos = usePhotoUrls(view?.holdings.map((h) => h.photoPath) ?? []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (failed) {
    return (
      <View style={{ flex: 1, padding: theme.space(6), justifyContent: "center" }}>
        <Text style={{ fontSize: 16, fontWeight: "600", textAlign: "center" }}>
          {t.errorTitle}
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            color: theme.color.muted,
            textAlign: "center",
          }}
        >
          {t.errorBody}
        </Text>
        <Button label={t.retry} onPress={load} style={{ marginTop: theme.space(5) }} />
      </View>
    );
  }

  const totals = view?.totals;
  const isEmpty = view !== null && view.holdings.length === 0 && totals?.realized === 0;

  return (
    <ScrollView
      contentContainerStyle={{ padding: theme.space(4), gap: theme.space(4) }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.color.accent} />
      }
    >
      {isEmpty ? (
        <View style={{ paddingVertical: theme.space(16), alignItems: "center" }}>
          <Text style={{ fontSize: 17, fontWeight: "600" }}>{t.pfEmptyTitle}</Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 13,
              lineHeight: 20,
              color: theme.color.muted,
              textAlign: "center",
            }}
          >
            {t.pfEmptyBody}
          </Text>
          <Button
            label={t.pfEmptyCta}
            onPress={() => router.push("/(tabs)/market")}
            style={{ marginTop: theme.space(6), alignSelf: "stretch" }}
          />
        </View>
      ) : (
        <>
          <Card>
            <Text style={{ fontSize: 13, color: theme.color.muted }}>{t.pfTotalValue}</Text>
            <Text
              style={[
                { fontSize: 30, fontWeight: "700", marginTop: 4, color: theme.color.ink },
                numericFont,
              ]}
            >
              {formatMoney(totals?.totalValue ?? null, profile.currency, profile.locale)}
            </Text>
            <Text
              style={[
                { fontSize: 14, fontWeight: "600", marginTop: 4, color: toneColor(totals?.unrealized) },
                numericFont,
              ]}
            >
              {formatMoney(totals?.unrealized ?? null, profile.currency, profile.locale)} (
              {formatPercent(totals?.unrealizedPct ?? null, profile.locale)})
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: theme.space(4),
                marginTop: theme.space(5),
                paddingTop: theme.space(4),
                borderTopWidth: 1,
                borderTopColor: theme.color.line,
              }}
            >
              <Stat
                label={t.pfCost}
                value={formatMoney(totals?.totalCost ?? null, profile.currency, profile.locale)}
              />
              <Stat
                label={t.pfRealized}
                value={formatMoney(totals?.realized ?? null, profile.currency, profile.locale)}
                color={toneColor(totals?.realized)}
              />
            </View>

            {(totals?.excludedCount ?? 0) > 0 && (
              <Text style={{ fontSize: 11, color: theme.color.muted, marginTop: theme.space(4) }}>
                {t.pfExcluded}
              </Text>
            )}

            {/* The total is one number built from more than one kind of evidence.
                Saying so where the number is, rather than in a footer nobody
                reads, is the difference between a caveat and a disclosure. */}
            {(view?.selfReportedCount ?? 0) > 0 && (
              <Text style={{ fontSize: 11, color: theme.color.muted, marginTop: theme.space(2) }}>
                {fill(t.srPortfolioNotice, { count: view?.selfReportedCount ?? 0 })}
              </Text>
            )}
          </Card>

          {series.length > 0 && (
            <Card>
              <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: theme.space(2) }}>
                {t.pfValueChart}
              </Text>
              <PriceChart
                points={series.map((p) => ({ ts: p.ts, price: p.value }))}
                markers={[]}
                currency={profile.currency}
                locale={profile.locale}
                labels={{
                  buy: t.itMarkerBuy,
                  sell: t.itMarkerSell,
                  empty: t.itNoChart,
                  asking: t.pfValueChart,
                  realised: t.cmRealised,
                }}
                height={160}
              />
            </Card>
          )}

          {view && view.byCategory.length > 0 && (
            <Card>
              <Text style={{ fontSize: 13, fontWeight: "600" }}>{t.pfBreakdown}</Text>
              <View
                style={{
                  flexDirection: "row",
                  height: 10,
                  borderRadius: 999,
                  overflow: "hidden",
                  marginTop: theme.space(3),
                  backgroundColor: theme.color.canvas,
                }}
              >
                {view.byCategory.map((c, i) => (
                  <View
                    key={c.category}
                    style={{ flex: c.share, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: theme.space(3),
                  marginTop: theme.space(3),
                }}
              >
                {view.byCategory.map((c, i) => (
                  <View
                    key={c.category}
                    style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                      }}
                    />
                    <Text style={{ fontSize: 11, color: theme.color.muted }}>
                      {t[CATEGORY_LABEL_KEY[c.category]]} {c.share.toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          <Text style={{ fontSize: 13, fontWeight: "600", marginTop: theme.space(2) }}>
            {t.pfHoldings}
          </Text>

          {view?.holdings.map((h, i) => (
            <Pressable
              key={h.holdingId}
              accessibilityRole="button"
              onPress={() => router.push(`/item/${h.item.id}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Card style={{ flexDirection: "row", alignItems: "center", gap: theme.space(3) }}>
                <Thumb uri={photos[i] ?? null} category={h.item.category} />

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600" }}>
                    {h.item.name}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 11, color: theme.color.muted }}>
                    {h.item.detail ?? t[CATEGORY_LABEL_KEY[h.item.category]]} ×{h.summary.quantity}
                  </Text>
                </View>

                <Sparkline values={h.spark} />

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[{ fontSize: 14, fontWeight: "600" }, numericFont]}>
                    {formatMoney(h.summary.marketValue, profile.currency, profile.locale)}
                  </Text>
                  {/* Marked per row so the notice above resolves to specific
                      holdings rather than leaving the reader to guess which. */}
                  {h.selfReported && (
                    <Text style={{ fontSize: 10, color: theme.color.muted }}>{t.srBadge}</Text>
                  )}
                  <Text
                    style={[
                      { fontSize: 11, color: toneColor(h.summary.unrealized) },
                      numericFont,
                    ]}
                  >
                    {h.summary.unrealizedPct === null
                      ? t.mkNoPrice
                      : formatPercent(h.summary.unrealizedPct, profile.locale)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      <Disclaimer text={t.disclaimer} />
    </ScrollView>
  );
}

const BAR_COLORS = ["#1F6FEB", "#0E9F6E", "#F59E0B", "#6B4F8E", "#E02424"];

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: theme.color.muted }}>{label}</Text>
      <Text
        style={[
          { fontSize: 14, fontWeight: "600", marginTop: 2, color: color ?? theme.color.ink },
          numericFont,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
