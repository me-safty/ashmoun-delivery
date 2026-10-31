import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { nextStatuses, statusLabels, type OrderStatus } from "@/convex/lib/orderStatus";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { OrderTimeline, StatusPill } from "@/components/order-status";
import { PriceSummary } from "@/components/price-summary";
import { Unavailable } from "@/components/unavailable";
import { confirm } from "@/lib/confirm";
import { errorMessage } from "@/lib/errors";
import { orderCode } from "@/lib/order-code";
import { colors, formatPrice, radius, space } from "@/theme";

const actionLabels: Record<OrderStatus, string> = {
  created: "",
  confirmed: "تأكيد الطلب",
  with_driver: "تسليم للمندوب",
  delivered: "تم التسليم",
  returned: "مرتجع",
  cancelled: "إلغاء الطلب",
};

export default function AdminOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useQuery(api.admin.order, { orderId: id });
  const drivers = useQuery(api.admin.drivers);
  const setStatus = useMutation(api.admin.setStatus);
  const [driverId, setDriverId] = useState<Id<"drivers"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (order === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (order === null) return <Unavailable message="الطلب ده مش موجود" />;

  const next = nextStatuses[order.status];
  const activeDrivers = drivers?.filter((d) => d.active) ?? [];

  async function move(status: OrderStatus) {
    if (!order) return;
    if (status === "cancelled" || status === "returned") {
      const sure = await confirm({
        title: `${statusLabels[status]}؟`,
        message: `الطلب ${orderCode(order._id)} من ${order.shopName}.`,
        confirmLabel: actionLabels[status],
      });
      if (!sure) return;
    }
    setError(null);
    setBusy(true);
    try {
      await setStatus({ orderId: order._id, status, driverId: status === "with_driver" ? (driverId ?? undefined) : undefined });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const openUrl = (url: string) => Linking.openURL(url).catch(() => setError("الجهاز ده مش بيدعم الاتصال"));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: orderCode(order._id) }} />
      <View style={styles.card}>
        <View style={styles.row}>
          <AppText variant="title">{order.shopName}</AppText>
          <StatusPill status={order.status} />
        </View>
        <OrderTimeline order={order} />
      </View>

      <View style={styles.card}>
        <AppText variant="caption" tone="muted">
          العميل
        </AppText>
        <View style={styles.row}>
          <AppText variant="subtitle">{order.customerName}</AppText>
          <Button kind="secondary" label={`اتصل ${order.customerPhone}`} onPress={() => void openUrl(`tel:${order.customerPhone}`)} />
        </View>
        <AppText>
          {order.address.label} · {order.address.zoneName} — {order.address.street}
          {order.address.landmark ? ` · ${order.address.landmark}` : ""}
        </AppText>
        {order.address.location ? (
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void openUrl(`https://maps.google.com/?q=${order.address.location?.lat},${order.address.location?.lng}`)
            }
            style={styles.link}>
            <AppText variant="caption" tone="primary">
              📍 افتح الموقع على الخريطة
            </AppText>
          </Pressable>
        ) : null}
        {order.driver ? (
          <AppText variant="caption" tone="muted">
            المندوب: {order.driver.name} · {order.driver.phone}
          </AppText>
        ) : null}
      </View>

      <View style={styles.card}>
        {order.items.map((item, index) => (
          <View key={`${item.productId}-${index}`} style={styles.row}>
            <View style={styles.itemBody}>
              <AppText>
                {item.quantity}× {item.name}
              </AppText>
              {item.optionsLabel ? (
                <AppText variant="caption" tone="muted">
                  {item.optionsLabel}
                </AppText>
              ) : null}
            </View>
            <AppText>{formatPrice(item.unitPrice * item.quantity)}</AppText>
          </View>
        ))}
        {order.note ? (
          <AppText variant="caption" tone="warning">
            ملاحظات: {order.note}
          </AppText>
        ) : null}
      </View>
      <PriceSummary subtotal={order.subtotal} deliveryFee={order.deliveryFee} />

      {next.includes("with_driver") ? (
        <View style={styles.card}>
          <AppText variant="subtitle">اختار المندوب</AppText>
          {activeDrivers.length === 0 ? <AppText tone="muted">مفيش مندوبين متاحين</AppText> : null}
          {activeDrivers.map((driver) => (
            <Pressable
              key={driver._id}
              accessibilityRole="radio"
              accessibilityState={{ selected: driver._id === driverId }}
              onPress={() => setDriverId(driver._id)}
              style={[styles.option, driver._id === driverId && styles.optionOn]}>
              <AppText variant="subtitle">🛵 {driver.name}</AppText>
              <AppText variant="caption" tone="muted">
                {driver.phone}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {next.map((status) => (
        <Button
          key={status}
          kind={status === "cancelled" || status === "returned" ? "danger" : "primary"}
          label={actionLabels[status]}
          loading={busy}
          disabled={status === "with_driver" && driverId === null}
          onPress={() => void move(status)}
        />
      ))}
      {error ? <AppText tone="danger">{error}</AppText> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  card: {
    gap: space.sm,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm },
  itemBody: { flex: 1 },
  link: { paddingVertical: space.sm },
  option: {
    gap: 2,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
