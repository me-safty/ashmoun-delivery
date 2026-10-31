import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { colors, formatPrice, radius, space } from "@/theme";

export default function OrderSuccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useQuery(api.orders.get, { orderId: id });

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View style={styles.badge}>
        <AppText style={styles.check}>✓</AppText>
      </View>
      <AppText variant="display">تم تأكيد طلبك</AppText>
      <AppText tone="muted" style={styles.center}>
        {order ? `طلبك من ${order.shopName} وصل للمحل. هنبلغك أول ما يتأكد.` : "..."}
      </AppText>
      {order ? (
        <View style={styles.card}>
          <AppText variant="caption" tone="muted">
            رقم الطلب #{order._id.slice(-6).toUpperCase()}
          </AppText>
          <AppText variant="title" tone="primary">
            {formatPrice(order.total)} كاش عند الاستلام
          </AppText>
          <AppText variant="caption" tone="muted">
            التوصيل إلى {order.address.label} · {order.address.zoneName}
          </AppText>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button kind="secondary" label="رجوع للرئيسية" onPress={() => router.replace("/")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, padding: space.xl },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  check: { fontSize: 48, lineHeight: 64, color: colors.success },
  center: { textAlign: "center" },
  card: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: { alignSelf: "stretch", gap: space.sm },
});
