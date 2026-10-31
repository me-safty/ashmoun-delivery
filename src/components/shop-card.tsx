import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { Doc } from "@/convex/_generated/dataModel";
import { colors, formatPrice, radius, space } from "@/theme";
import { AppText } from "./app-text";
import { EmojiTile } from "./emoji-tile";
import { ShopStatusBadge, shopState } from "./shop-status";

export function ShopCard({ shop, now }: { shop: Doc<"shops">; now: number }) {
  const state = shopState(shop, now);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: "/shop/[id]", params: { id: shop._id } })}
      style={styles.card}>
      <View style={state !== "open" && styles.dimmed}>
        <EmojiTile emoji={shop.emoji} tint={shop.tint} size={64} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="subtitle" numberOfLines={1} style={styles.name}>
            {shop.name}
          </AppText>
          <ShopStatusBadge state={state} />
        </View>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {shop.description}
        </AppText>
        <AppText variant="caption" tone="muted">
          ⭐ {shop.rating.toFixed(1)} · {shop.prepMinutes} دقيقة
          {shop.minOrder > 0 ? ` · أقل طلب ${formatPrice(shop.minOrder)}` : ""}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dimmed: { opacity: 0.45 },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  name: { flexShrink: 1 },
});
