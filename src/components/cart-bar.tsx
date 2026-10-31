import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart";
import { colors, formatPrice, radius, space } from "@/theme";
import { AppText } from "./app-text";

export function CartBar() {
  const lines = useCart((s) => s.lines);
  const shop = useCart((s) => s.shop);
  if (!shop || lines.length === 0) return null;

  return (
    <Pressable style={styles.bar} accessibilityRole="button" onPress={() => router.push("/cart")}>
      <View style={styles.count}>
        <AppText variant="subtitle" tone="primary">
          {cartCount(lines)}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="subtitle" tone="onPrimary">
          عرض السلة
        </AppText>
        <AppText variant="caption" tone="onPrimary" numberOfLines={1}>
          {shop.name}
        </AppText>
      </View>
      <AppText variant="subtitle" tone="onPrimary">
        {formatPrice(cartSubtotal(lines))}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  count: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
});
