import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { EmojiTile } from "@/components/emoji-tile";
import { ShopStatusBadge, shopState, todayHoursLabel } from "@/components/shop-status";
import { errorMessage } from "@/lib/errors";
import { useNow } from "@/lib/use-now";
import { colors, radius, space } from "@/theme";

export default function AdminShops() {
  const shops = useQuery(api.catalog.shops, {});
  const [error, setError] = useState<string | null>(null);
  const setPaused = useMutation(api.adminCatalog.setShopPaused);
  const now = useNow();
  if (shops === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {error ? <AppText tone="danger">{error}</AppText> : null}
      {shops.map((shop) => (
        <View key={shop._id} style={styles.card}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push({ pathname: "/admin/shop/[id]", params: { id: shop._id } })}
            style={styles.row}>
            <EmojiTile emoji={shop.emoji} tint={shop.tint} size={48} />
            <View style={styles.body}>
              <AppText variant="subtitle">{shop.name}</AppText>
              <AppText variant="caption" tone="muted">
                {todayHoursLabel(shop, now)}
              </AppText>
            </View>
            <ShopStatusBadge state={shopState(shop, now)} />
          </Pressable>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: !shop.paused }}
            onPress={() =>
              void setPaused({ shopId: shop._id, paused: !shop.paused }).catch((e) => setError(errorMessage(e)))
            }
            style={styles.toggle}>
            <AppText variant="caption" tone={shop.paused ? "primary" : "danger"}>
              {shop.paused ? "شغل استقبال الطلبات" : "وقف استقبال الطلبات مؤقتاً"}
            </AppText>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  content: { padding: space.lg, gap: space.md },
  card: {
    gap: space.xs,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  body: { flex: 1 },
  toggle: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start", paddingHorizontal: space.sm },
});
