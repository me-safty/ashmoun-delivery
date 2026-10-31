import { useQuery } from "convex/react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { StatusPill } from "@/components/order-status";
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
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: "/order/[id]", params: { id: item._id } })}
          style={styles.card}>
          <View style={styles.row}>
            <AppText variant="subtitle">{item.shopName}</AppText>
            <StatusPill status={item.status} />
          </View>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {item.items.map((i) => `${i.quantity}× ${i.name}`).join("، ")}
          </AppText>
          <View style={styles.row}>
            <AppText variant="caption" tone="muted">
              {dateFormat.format(item._creationTime)}
            </AppText>
            <AppText variant="subtitle" tone="primary">
              {formatPrice(item.total)}
            </AppText>
          </View>
        </Pressable>
      )}
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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm },
});
