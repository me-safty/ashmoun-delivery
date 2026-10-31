import { useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { EmojiTile } from "@/components/emoji-tile";
import { PriceSummary } from "@/components/price-summary";
import { StepButton } from "@/components/step-button";
import { MAX_QUANTITY } from "@/convex/lib/pricing";
import { useCart, useCartQuote } from "@/lib/cart";
import { colors, formatPrice, radius, space } from "@/theme";

export default function Cart() {
  const { shop, lines, setQuantity } = useCart();
  const addresses = useQuery(api.addresses.mine);
  const quote = useCartQuote();
  const address = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const priced = quote?.kind === "ok" ? quote : undefined;
  const belowMinimum = priced !== undefined && priced.subtotal < priced.minOrder;

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
        {lines.map((line, index) => (
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
                {formatPrice((priced?.unitPrices[index] ?? line.unitPrice) * line.quantity)}
              </AppText>
            </View>
            <View style={styles.stepper}>
              <StepButton
                icon={line.quantity === 1 ? "trash-outline" : "remove"}
                label={line.quantity === 1 ? "شيل من السلة" : "قلل الكمية"}
                onPress={() => setQuantity(line.key, line.quantity - 1)}
              />
              <AppText variant="subtitle">{line.quantity}</AppText>
              <StepButton
                icon="add"
                label="زود الكمية"
                disabled={line.quantity >= MAX_QUANTITY}
                onPress={() => setQuantity(line.key, line.quantity + 1)}
              />
            </View>
          </View>
        ))}
        <PriceSummary subtotal={priced?.subtotal} deliveryFee={address?.deliveryFee} />
        {quote?.kind === "invalid" ? <AppText tone="danger">{quote.message}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}>
        {priced && belowMinimum ? (
          <View style={styles.minimum}>
            <AppText variant="caption" tone="warning" style={styles.minimumText}>
              ضيف {formatPrice(priced.minOrder - priced.subtotal)} كمان عشان توصل لأقل طلب ({formatPrice(priced.minOrder)})
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
              <AppText variant="caption" tone="primary">
                ضيف حاجات
              </AppText>
            </Pressable>
          </View>
        ) : null}
        <Button
          label={priced && address ? `إتمام الطلب · ${formatPrice(priced.subtotal + address.deliveryFee)}` : "إتمام الطلب"}
          disabled={!priced || belowMinimum}
          onPress={() => router.push("/checkout")}
        />
      </View>
    </SafeAreaView>
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
  footer: { padding: space.lg, gap: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  minimum: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  minimumText: { flex: 1 },
});
