import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { canCustomerCancel } from "@/convex/lib/orderStatus";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { OrderTimeline, StatusPill } from "@/components/order-status";
import { PriceSummary } from "@/components/price-summary";
import { Unavailable } from "@/components/unavailable";
import { confirm } from "@/lib/confirm";
import { errorMessage } from "@/lib/errors";
import { colors, formatPrice, radius, space } from "@/theme";

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useQuery(api.orders.get, { orderId: id });
  const cancel = useMutation(api.orders.cancel);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  if (order === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (order === null) return <Unavailable message="الطلب ده مش موجود" />;

  async function onCancel() {
    if (!order) return;
    const sure = await confirm({
      title: "تلغي الطلب؟",
      message: `هنلغي طلبك من ${order.shopName}.`,
      confirmLabel: "إلغاء الطلب",
    });
    if (!sure) return;
    setError(null);
    setCancelling(true);
    try {
      await cancel({ orderId: order._id });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `طلب #${order._id.slice(-6).toUpperCase()}` }} />
      <View style={styles.card}>
        <View style={styles.row}>
          <AppText variant="title">{order.shopName}</AppText>
          <StatusPill status={order.status} />
        </View>
        <OrderTimeline order={order} />
      </View>

      {order.driver ? (
        <View style={styles.card}>
          <AppText variant="caption" tone="muted">
            المندوب
          </AppText>
          <View style={styles.row}>
            <AppText variant="subtitle">🛵 {order.driver.name}</AppText>
            <Button kind="secondary" label="اتصل" onPress={() => void Linking.openURL(`tel:${order.driver?.phone}`)} />
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <AppText variant="subtitle">الطلب</AppText>
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
          <AppText variant="caption" tone="muted">
            ملاحظات: {order.note}
          </AppText>
        ) : null}
      </View>

      <View style={styles.card}>
        <AppText variant="caption" tone="muted">
          التوصيل إلى {order.address.label} · {order.address.zoneName}
        </AppText>
        <AppText>
          {order.address.street}
          {order.address.landmark ? ` · ${order.address.landmark}` : ""}
        </AppText>
        <AppText variant="caption" tone="muted">
          💵 الدفع كاش عند الاستلام
        </AppText>
      </View>

      <PriceSummary subtotal={order.subtotal} deliveryFee={order.deliveryFee} />

      {canCustomerCancel(order.status) ? (
        <Button kind="danger" label="إلغاء الطلب" loading={cancelling} onPress={onCancel} />
      ) : null}
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
});
