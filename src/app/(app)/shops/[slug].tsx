import { AppText } from "@/components/app-text";
import { CART_BAR_SPACE, CartBar } from "@/components/cart-bar";
import { EmojiTile } from "@/components/emoji-tile";
import { shopState, ShopStatusBadge, todayHoursLabel } from "@/components/shop-status";
import { Unavailable } from "@/components/unavailable";
import { api } from "@/convex/_generated/api";
import { useNow } from "@/lib/use-now";
import { colors, fonts, formatPrice, radius, space } from "@/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from "react-native";

const STAR = "#F5B301";

function Stars({ rating }: { rating?: number }) {
  const value = rating ?? 0;
  return (
    <View style={styles.stars}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Ionicons
          key={i}
          name={i < Math.round(value) ? "star" : "star-outline"}
          size={14}
          color={STAR}
        />
      ))}
    </View>
  );
}

export default function Shop() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const now = useNow();
  // "skip" until the route param exists — guards against template paths landing
  // without params on web, which previously sent {} and errored server-side.
  const data = useQuery(api.catalog.shopBySlug, slug ? { slug } : "skip");
  const listRef = useRef<SectionList>(null);

  if (data === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (data === null) return <Unavailable message="هذا المحل غير متاح حاليًا" />;

  const { shop, sections } = data;
  const state = shopState(shop, now);

  const scrollToMenu = () =>
    listRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, viewPosition: 0 });

  return (
    <>
      <Stack.Screen
        options={{
          title: shop.name,
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { fontFamily: fonts.bold, color: colors.onPrimary },
        }}
      />
      <SectionList
        ref={listRef}
        sections={sections.map((s) => ({ key: s._id, title: s.name, data: s.products }))}
        keyExtractor={(p) => p._id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            {/* 1) Hero: dark backdrop with logo card, title, specialties and guidance */}
            <View style={styles.hero}>
              {shop.imageUrl ? (
                <Image
                  source={{ uri: shop.imageUrl }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={styles.logoCard}>
                  {shop.imageUrl ? (
                    <Image
                      source={{ uri: shop.imageUrl }}
                      style={styles.logoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <EmojiTile emoji={shop.emoji} tint={colors.surface} size={84} />
                  )}
                </View>
                <AppText variant="display" tone="onPrimary" style={styles.heroTitle}>
                  {shop.name}
                </AppText>
                <AppText variant="body" style={styles.heroSubtitle} numberOfLines={2}>
                  {shop.description}
                </AppText>
                <View style={styles.heroMeta}>
                  {shop.prepMinutes ? (
                    <AppText variant="caption" style={styles.heroMetaText}>
                      {`وقت تحضير الطلب ${shop.prepMinutes} دقيقة`}
                    </AppText>
                  ) : null}
                  <View style={styles.statusHoursRow}>
                    <ShopStatusBadge state={state} />
                    <AppText variant="caption" style={styles.heroMetaText}>
                      {todayHoursLabel(shop, now)}
                    </AppText>
                  </View>
                </View>

                {/* 3) CTA: jump to the menu */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="عرض قائمة الطعام"
                  onPress={scrollToMenu}
                  style={styles.cta}>
                  <AppText variant="subtitle" tone="onPrimary">
                    قائمة الطعام
                  </AppText>
                  <Ionicons name="arrow-back" size={18} color={colors.onPrimary} />
                </Pressable>

                {shop.rating != null && (
                  <View style={styles.ratingRow}>
                    <View style={styles.ratingBadge}>
                      <AppText variant="caption" tone="onPrimary">
                        {shop.rating.toFixed(1)}
                      </AppText>
                    </View>
                    <Stars rating={shop.rating} />
                    <AppText variant="caption" style={styles.ratingCount}>
                      ( {shop.reviewsCount ?? 0} تقييم )
                    </AppText>
                  </View>
                )}

                {state === "closed" && (
                  <View style={[styles.notice, { backgroundColor: colors.dangerSoft }]}>
                    <AppText variant="caption" tone="dangerInk" style={styles.noticeText}>
                      المحل مغلق حاليًا، يمكنك تصفّح القائمة والطلب عند فتحه.
                    </AppText>
                  </View>
                )}
                {state === "paused" && (
                  <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
                    <AppText variant="caption" tone="warningInk" style={styles.noticeText}>
                      المحل متوقف عن استقبال الطلبات مؤقتًا، يرجى المحاولة لاحقًا.
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="title" style={styles.sectionTitle}>
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
  // Hero
  hero: {
    backgroundColor: colors.ink,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: "hidden",
  },
  heroImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(23, 17, 12, 0.82)",
  },
  heroContent: {
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.xl,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
  },
  logoImage: { width: "100%", height: "100%" },
  heroTitle: { textAlign: "center" },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", textAlign: "center" },
  heroMeta: {
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  statusHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  heroMetaText: { color: "rgba(255,255,255,0.75)" },
  // CTA
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    alignSelf: "stretch",
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: space.xs,
  },
  // Rating row
  ratingRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
  ratingBadge: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  stars: { flexDirection: "row", gap: 2 },
  ratingCount: { color: "rgba(255,255,255,0.8)" },
  // Closed / paused notices
  notice: {
    alignSelf: "stretch",
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  noticeText: { textAlign: "center" },
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