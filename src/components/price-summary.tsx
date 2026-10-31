import { StyleSheet, View } from "react-native";
import { colors, formatPrice, radius, space } from "@/theme";
import { AppText } from "./app-text";

export function PriceSummary({ subtotal, deliveryFee }: { subtotal: number; deliveryFee: number | undefined }) {
  return (
    <View style={styles.card}>
      <Row label="المجموع" value={formatPrice(subtotal)} />
      <Row label="التوصيل" value={deliveryFee === undefined ? "..." : formatPrice(deliveryFee)} />
      <View style={styles.divider} />
      <Row label="الإجمالي" value={formatPrice(subtotal + (deliveryFee ?? 0))} strong />
    </View>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <AppText variant={strong ? "subtitle" : "body"} tone={strong ? "ink" : "muted"}>
        {label}
      </AppText>
      <AppText variant={strong ? "title" : "subtitle"} tone={strong ? "primary" : "ink"}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  divider: { height: 1, backgroundColor: colors.border },
});
