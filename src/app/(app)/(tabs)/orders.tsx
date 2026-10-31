import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { StatusPill } from "@/components/order-status";
import { orderCode } from "@/lib/order-code";
import { colors, formatPrice, radius, space } from "@/theme";

const dateFormat = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default function Orders() {
  const orders = useQuery(api.orders.mine);

  if (orders === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o._id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <AppText style={styles.emptyEmoji}>🧾</AppText>
          <AppText tone="muted">لسه معملتش أي طلب</AppText>
          <Button kind="secondary" label="اطلب دلوقتي" onPress={() => router.navigate("/")} />
        </View>
      }
      renderItem={({ item }) => {
        const ended = item.status === "cancelled" || item.status === "returned";
        return (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push({ pathname: "/order/[id]", params: { id: item._id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.row}>
              <AppText variant="subtitle">{item.shopName}</AppText>
              <StatusPill status={item.status} />
            </View>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {item.items.map((i) => `${i.quantity}× ${i.name}`).join("، ")}
            </AppText>
            <View style={styles.row}>
              <AppText variant="caption" tone="muted">
                {orderCode(item._id)} · {dateFormat.format(item._creationTime)}
              </AppText>
              <View style={styles.totalRow}>
                <AppText variant="subtitle" tone={ended ? "muted" : "primary"} style={ended && styles.struck}>
                  {formatPrice(item.total)}
                </AppText>
                <Ionicons name="chevron-back" size={16} color={colors.faint} />
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  list: { padding: space.lg, gap: space.md },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl },
  emptyEmoji: { fontSize: 48, lineHeight: 64 },
  card: {
    gap: space.xs,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  totalRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
  struck: { textDecorationLine: "line-through" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm },
});
