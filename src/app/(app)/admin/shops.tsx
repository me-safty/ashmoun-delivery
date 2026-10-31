import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AdminGrid, adminPage } from "@/components/admin-grid";
import { AppText } from "@/components/app-text";
import { EmojiTile } from "@/components/emoji-tile";
import { ToggleRow } from "@/components/toggle-row";
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
    <ScrollView contentContainerStyle={[styles.content, adminPage]}>
      {error ? <AppText tone="danger">{error}</AppText> : null}
      <AdminGrid>
        {shops.map((shop) => (
          <View key={shop._id} style={styles.card}>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push({ pathname: "/admin/shop/[id]", params: { id: shop._id } })}
              style={styles.row}>
              <EmojiTile emoji={shop.emoji} tint={shop.tint} size={48} />
              <View style={styles.body}>
                <AppText variant="subtitle">{shop.name}</AppText>
                <AppText variant="caption" tone="mutedInk">
                  {todayHoursLabel(shop, now)} · تعديل المنيو
                </AppText>
              </View>
              <ShopStatusBadge state={shopState(shop, now)} />
              <Ionicons name="chevron-back" size={16} color={colors.faint} />
            </Pressable>
            <ToggleRow
              label={shop.paused ? "واقف مؤقتاً" : "بيستقبل طلبات"}
              value={!shop.paused}
              onValueChange={(receiving) => {
                setError(null);
                void setPaused({ shopId: shop._id, paused: !receiving }).catch((e) => setError(errorMessage(e)));
              }}
            />
          </View>
        ))}
      </AdminGrid>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  content: { padding: space.lg, gap: space.md },
  card: {
    flexGrow: 1,
    gap: space.xs,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  body: { flex: 1 },
});
