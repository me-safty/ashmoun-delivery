import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AdminGrid, adminPage } from "@/components/admin-grid";
import { AppText } from "@/components/app-text";
import { StatusPill } from "@/components/order-status";
import { orderCode } from "@/lib/order-code";
import { colors, formatPrice, radius, space } from "@/theme";

const timeFormat = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default function AdminOrders() {
  const [view, setView] = useState<"active" | "done">("active");
  const orders = useQuery(api.admin.orders, { view });

  return (
    <ScrollView contentContainerStyle={[styles.list, adminPage]}>
      <View style={styles.header}>
        <View style={styles.segments}>
          <Segment label="طلبات شغالة" selected={view === "active"} onPress={() => setView("active")} />
          <Segment label="خلصت" selected={view === "done"} onPress={() => setView("done")} />
        </View>
        <View style={styles.links}>
          <AdminLink label="🛵 المندوبين" onPress={() => router.push("/admin/drivers")} />
          <AdminLink label="📍 المناطق" onPress={() => router.push("/admin/zones")} />
          <AdminLink label="🏪 المحلات" onPress={() => router.push("/admin/shops")} />
        </View>
      </View>
      {orders === undefined ? (
        <ActivityIndicator color={colors.primary} />
      ) : orders.length === 0 ? (
        <AppText tone="muted">مفيش طلبات هنا</AppText>
      ) : (
        <AdminGrid>
          {orders.map((order) => (
            <Pressable
              key={order._id}
              accessibilityRole="link"
              onPress={() => router.push({ pathname: "/admin/order/[id]", params: { id: order._id } })}
              style={styles.card}>
              <View style={styles.row}>
                <AppText variant="subtitle">
                  {orderCode(order._id)} · {order.shopName}
                </AppText>
                <StatusPill status={order.status} />
              </View>
              <AppText variant="caption" tone="muted">
                {order.customerName} · {order.address.zoneName} · {timeFormat.format(order._creationTime)}
              </AppText>
              <AppText variant="subtitle" tone="primary">
                {formatPrice(order.total)}
              </AppText>
            </Pressable>
          ))}
        </AdminGrid>
      )}
    </ScrollView>
  );
}

function AdminLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.link}>
      <AppText variant="caption" tone="primaryInk">
        {label}
      </AppText>
    </Pressable>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.segment, selected && styles.segmentOn]}>
      <AppText variant="caption" tone={selected ? "onPrimary" : "ink"}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: space.md },
  header: { gap: space.sm },
  links: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  segments: { flexDirection: "row", gap: space.sm },
  segment: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  link: { minHeight: 44, justifyContent: "center" },
  card: {
    flexGrow: 1,
    gap: space.xs,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm },
});
