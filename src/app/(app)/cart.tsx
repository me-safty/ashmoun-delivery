import { useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { EmojiTile } from "@/components/emoji-tile";
import { PriceSummary } from "@/components/price-summary";
import { cartSubtotal, useCart } from "@/lib/cart";
import { colors, formatPrice, radius, space } from "@/theme";

export default function Cart() {
  const { shop, lines, setQuantity } = useCart();
  const addresses = useQuery(api.addresses.mine);
  const shopData = useQuery(api.catalog.shop, shop ? { shopId: shop.id } : "skip");
  const address = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const subtotal = cartSubtotal(lines);
  const minOrder = shopData?.shop.minOrder ?? 0;

  if (!shop || lines.length === 0) {
    return (
      <View style={styles.empty}>
        <Stack.Screen options={{ title: "السلة" }} />
        <AppText style={styles.emptyEmoji}>🛒</AppText>
        <AppText variant="title">السلة فاضية</AppText>
        <AppText tone="muted">اختار محل وضيف اللي نفسك فيه.</AppText>
        <Button kind="secondary" label="تصفح المحلات" onPress={() => router.dismissTo("/")} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <Stack.Screen options={{ title: `السلة · ${shop.name}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        {lines.map((line) => (
          <View key={line.key} style={styles.line}>
            <EmojiTile emoji={line.emoji} tint={colors.primarySoft} size={52} />
            <View style={styles.lineBody}>
              <AppText variant="subtitle">{line.name}</AppText>
              {line.optionsLabel ? (
                <AppText variant="caption" tone="muted">
                  {line.optionsLabel}
                </AppText>
              ) : null}
              <AppText variant="caption" tone="primary">
                {formatPrice(line.unitPrice * line.quantity)}
              </AppText>
            </View>
            <View style={styles.stepper}>
              <Step label="−" onPress={() => setQuantity(line.key, line.quantity - 1)} />
              <AppText variant="subtitle">{line.quantity}</AppText>
              <Step label="+" onPress={() => setQuantity(line.key, line.quantity + 1)} />
            </View>
          </View>
        ))}
        <PriceSummary subtotal={subtotal} deliveryFee={address?.deliveryFee} />
        {subtotal < minOrder ? (
          <AppText tone="danger">
            أقل طلب من {shop.name} هو {formatPrice(minOrder)}، ضيف {formatPrice(minOrder - subtotal)} كمان.
          </AppText>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="إتمام الطلب" disabled={subtotal < minOrder} onPress={() => router.push("/checkout")} />
      </View>
    </SafeAreaView>
  );
}

function Step({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.step}>
      <AppText variant="subtitle" tone="primary">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: space.lg, gap: space.md },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.sm, padding: space.xl },
  emptyEmoji: { fontSize: 56, lineHeight: 72 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineBody: { flex: 1, gap: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: space.sm },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { padding: space.lg },
});
