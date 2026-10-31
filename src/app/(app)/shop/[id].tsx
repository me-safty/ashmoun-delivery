import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, SectionList, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { EmojiTile } from "@/components/emoji-tile";
import { Unavailable } from "@/components/unavailable";
import { ShopStatusBadge, shopState, todayHoursLabel } from "@/components/shop-status";
import { useNow } from "@/lib/use-now";
import { colors, formatPrice, radius, space } from "@/theme";

export default function Shop() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const data = useQuery(api.catalog.shop, { shopId: id });

  if (data === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (data === null) return <Unavailable message="المحل ده مش متاح دلوقتي" />;

  const { shop, sections } = data;
  const state = shopState(shop, now);

  return (
    <>
      <Stack.Screen options={{ title: shop.name }} />
      <SectionList
        sections={sections.map((s) => ({ key: s._id, title: s.name, data: s.products }))}
        keyExtractor={(p) => p._id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={[styles.hero, { backgroundColor: shop.tint }]}>
            <EmojiTile emoji={shop.emoji} tint={colors.surface} size={72} />
            <AppText variant="display">{shop.name}</AppText>
            <AppText tone="muted">{shop.description}</AppText>
            <View style={styles.metaRow}>
              <ShopStatusBadge state={state} onTint />
              <AppText variant="caption" tone="muted">
                ⭐ {shop.rating.toFixed(1)} · {shop.prepMinutes} دقيقة · {todayHoursLabel(shop, now)}
              </AppText>
            </View>
            {state === "closed" ? (
              <AppText variant="caption" tone="danger">
                المحل مقفول دلوقتي، تقدر تتفرج على المنيو وتطلب لما يفتح.
              </AppText>
            ) : state === "paused" ? (
              <AppText variant="caption" tone="warning">
                المحل واقف استقبال طلبات شوية، جرب كمان شوية.
              </AppText>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="subtitle" style={styles.sectionTitle}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="link"
            disabled={!item.available}
            accessibilityState={{ disabled: !item.available }}
            onPress={() => router.push({ pathname: "/product/[id]", params: { id: item._id } })}
            style={styles.product}>
            <View style={styles.productBody}>
              <AppText variant="subtitle">{item.name}</AppText>
              {item.description ? (
                <AppText variant="caption" tone="muted" numberOfLines={2}>
                  {item.description}
                </AppText>
              ) : null}
              {item.available ? (
                <AppText variant="subtitle" tone="primary">
                  {formatPrice(item.price)}
                </AppText>
              ) : (
                <View style={styles.unavailablePill}>
                  <AppText variant="caption" tone="muted">
                    غير متاح حالياً
                  </AppText>
                </View>
              )}
            </View>
            <View style={!item.available && styles.unavailable}>
              <EmojiTile emoji={item.emoji} tint={shop.tint} size={72} />
            </View>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  list: { paddingBottom: space.xxl },
  hero: { padding: space.xl, gap: space.sm, marginBottom: space.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" },
  sectionTitle: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm },
  product: {
    flexDirection: "row",
    gap: space.md,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unavailable: { opacity: 0.45 },
  unavailablePill: {
    alignSelf: "flex-start",
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  productBody: { flex: 1, gap: 2 },
});
