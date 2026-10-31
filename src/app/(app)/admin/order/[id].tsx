import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [busy, setBusy] = useState<OrderStatus | null>(null);

  if (order === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (order === null) return <Unavailable message="الطلب ده مش موجود" />;

  const next = nextStatuses[order.status];
  const activeDrivers = drivers?.filter((d) => d.active) ?? [];
  const selectedDriverId = activeDrivers.some((d) => d._id === driverId)
    ? driverId
    : activeDrivers.length === 1
      ? activeDrivers[0]._id
      : null;
  const forward = next.filter((s) => s !== "cancelled" && s !== "returned");
  const destructive = next.filter((s) => s === "cancelled" || s === "returned");

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
    setBusy(status);
    try {
      await setStatus({ orderId: order._id, status, driverId: status === "with_driver" ? (selectedDriverId ?? undefined) : undefined });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const openUrl = (url: string, failure: string) => Linking.openURL(url).catch(() => setError(failure));

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <Stack.Screen options={{ title: orderCode(order._id) }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <AppText variant="title">{order.shopName}</AppText>
            <StatusPill status={order.status} />
          </View>
          <View style={styles.row}>
            <AppText variant="subtitle" style={styles.flex}>
              {order.customerName}
            </AppText>
            <Button
              kind="secondary"
              label="اتصل"
              onPress={() =>
                void openUrl(`tel:${order.customerPhone}`, `الجهاز ده مش بيدعم الاتصال، رقم العميل ${order.customerPhone}`)
              }
            />
          </View>
          <AppText>
            <AppText variant="subtitle">{order.address.zoneName}</AppText> — {order.address.label} ·{" "}
            {order.address.street}
            {order.address.landmark ? ` · ${order.address.landmark}` : ""}
          </AppText>
          {order.address.location ? (
            <Button
              kind="secondary"
              label="📍 افتح الموقع على الخريطة"
              onPress={() =>
                void openUrl(
                  `https://maps.google.com/?q=${order.address.location?.lat},${order.address.location?.lng}`,
                  "مقدرناش نفتح الخريطة",
                )
              }
            />
          ) : null}
          {order.driver ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void openUrl(`tel:${order.driver?.phone}`, `رقم المندوب ${order.driver?.phone}`)}
              style={styles.link}>
              <AppText variant="caption" tone="primaryInk">
                🛵 {order.driver.name} · {order.driver.phone}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {order.note ? (
          <View style={styles.note}>
            <AppText variant="subtitle" tone="warningInk">
              ملاحظة العميل
            </AppText>
            <AppText tone="warningInk">{order.note}</AppText>
          </View>
        ) : null}

        <View style={styles.card}>
          {order.items.map((item, index) => (
            <View key={`${item.productId}-${index}`} style={styles.row}>
              <View style={styles.flex}>
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
        </View>
        <PriceSummary subtotal={order.subtotal} deliveryFee={order.deliveryFee} />

        {next.includes("with_driver") ? (
          <View style={styles.card}>
            <AppText variant="subtitle">اختار المندوب</AppText>
            {activeDrivers.length === 0 ? <AppText tone="muted">مفيش مندوبين متاحين</AppText> : null}
            {activeDrivers.map((driver) => {
              const selected = driver._id === selectedDriverId;
              return (
                <Pressable
                  key={driver._id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setDriverId(driver._id)}
                  style={[styles.option, selected && styles.optionOn]}>
                  <View style={[styles.radio, selected && styles.radioOn]} />
                  <View style={styles.flex}>
                    <AppText variant="subtitle">🛵 {driver.name}</AppText>
                    <AppText variant="caption" tone="muted">
                      {driver.phone}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.card}>
          <OrderTimeline order={order} />
        </View>

        {destructive.map((status) => (
          <Button
            key={status}
            kind="danger"
            label={actionLabels[status]}
            loading={busy === status}
            disabled={busy !== null}
            onPress={() => void move(status)}
          />
        ))}
      </ScrollView>
      {forward.length > 0 || error ? (
        <View style={styles.footer}>
          {error ? <AppText tone="danger">{error}</AppText> : null}
          {forward.includes("with_driver") && selectedDriverId === null ? (
            <AppText variant="caption" tone="mutedInk">
              اختار مندوب الأول
            </AppText>
          ) : null}
          {forward.map((status) => (
            <Button
              key={status}
              label={actionLabels[status]}
              loading={busy === status}
              disabled={busy !== null || (status === "with_driver" && selectedDriverId === null)}
              onPress={() => void move(status)}
            />
          ))}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  screen: { flex: 1 },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  card: {
    gap: space.sm,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  note: { gap: space.xs, padding: space.lg, borderRadius: radius.md, backgroundColor: colors.warningSoft },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm },
  flex: { flex: 1 },
  link: { minHeight: 44, justifyContent: "center" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.faint },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  footer: {
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
