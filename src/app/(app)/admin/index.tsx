import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
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
    <FlatList
      data={orders ?? []}
      keyExtractor={(o) => o._id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
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
      }
      ListEmptyComponent={
        orders === undefined ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <AppText tone="muted">مفيش طلبات هنا</AppText>
        )
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: "/admin/order/[id]", params: { id: item._id } })}
          style={styles.card}>
          <View style={styles.row}>
            <AppText variant="subtitle">
              {orderCode(item._id)} · {item.shopName}
            </AppText>
            <StatusPill status={item.status} />
          </View>
          <AppText variant="caption" tone="muted">
            {item.customerName} · {item.address.zoneName} · {timeFormat.format(item._creationTime)}
          </AppText>
          <AppText variant="subtitle" tone="primary">
            {formatPrice(item.total)}
          </AppText>
        </Pressable>
      )}
    />
  );
}

function AdminLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.link}>
      <AppText variant="caption" tone="primary">
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
    minHeight: 40,
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
    gap: space.xs,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm },
});
