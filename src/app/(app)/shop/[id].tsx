import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Image, Pressable, SectionList, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { CART_BAR_SPACE, CartBar } from "@/components/cart-bar";
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
  if (data === null) return <Unavailable message="هذا المحل غير متاح حاليًا" />;

  const { shop, sections } = data;
  const state = shopState(shop, now);

  return (
    <>
      <Stack.Screen options={{ headerStyle: { backgroundColor: shop.tint } }} />
      <SectionList
        sections={sections.map((s) => ({ key: s._id, title: s.name, data: s.products }))}
        keyExtractor={(p) => p._id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
ListHeaderComponent={
          <View style={styles.card}>
            {shop.imageUrl ? (
              <Image
                source={{ uri: shop.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cardImage, { backgroundColor: shop.tint }]}>
                <EmojiTile emoji={shop.emoji} tint={colors.surface} size={80} />
              </View>
            )}
            <View style={styles.cardContent}>
              <AppText variant="display" style={styles.cardTitle}>
                {shop.name}
              </AppText>
              <AppText tone="muted" style={styles.cardDescription} numberOfLines={3}>
                {shop.description}
              </AppText>
              <View style={styles.cardMeta}>
                <ShopStatusBadge state={state} />
                <AppText variant="caption" tone="muted">
                  {shop.rating ? '⭐ ' + shop.rating.toFixed(1) : ''}{' '}
                  {shop.rating && '· '}{shop.prepMinutes} دقيقة{' '}
                  {todayHoursLabel(shop, now)}
                </AppText>
              </View>
              {state === "closed" && (
                <AppText variant="caption" tone="danger" style={styles.statusText}>
                  المحل مغلق حاليًا، يمكنك تصفّح القائمة والطلب عند فتحه.
                </AppText>
              )}
              {state === "paused" && (
                <AppText variant="caption" tone="warningInk" style={styles.statusText}>
                  المحل متوقف عن استقبال الطلبات مؤقتًا، يرجى المحاولة لاحقًا.
                </AppText>
              )}
            </View>
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
      <CartBar overSafeArea />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  list: { paddingBottom: CART_BAR_SPACE },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: space.lg,
    marginTop: space.lg,
    marginBottom: space.md,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: space.lg,
    gap: space.md,
  },
  cardTitle: {
    fontWeight: "700",
  },
  cardDescription: {
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusText: {
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
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
