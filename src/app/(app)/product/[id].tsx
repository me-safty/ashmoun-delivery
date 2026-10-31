import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { isShopOpen } from "@/convex/lib/hours";
import { MAX_QUANTITY, priceLine } from "@/convex/lib/pricing";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { EmojiTile } from "@/components/emoji-tile";
import { StepButton } from "@/components/step-button";
import { todayHoursLabel } from "@/components/shop-status";
import { Unavailable } from "@/components/unavailable";
import { useCart } from "@/lib/cart";
import { confirm } from "@/lib/confirm";
import { useNow } from "@/lib/use-now";
import { colors, formatPrice, radius, space } from "@/theme";

type Selected = Record<string, string[]>;

export default function Product() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useQuery(api.catalog.product, { productId: id });
  const [selected, setSelected] = useState<Selected>({});
  const [quantity, setQuantity] = useState(1);
  const now = useNow();
  const narrow = useWindowDimensions().width < 360;

  if (data === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (data === null || !data.product.available) return <Unavailable message="المنتج ده مش متاح دلوقتي" />;

  const { product, shop } = data;
  // Keep only keys that still exist, so an option removed while the sheet is open can't block pricing.
  const selections = product.optionGroups.map((group) => ({
    groupKey: group.key,
    optionKeys: (selected[group.key] ?? []).filter((key) => group.options.some((o) => o.key === key)),
  }));
  const priced = priceLine(product, selections);
  const shopOpen = isShopOpen(shop, now);

  function toggle(group: (typeof product.optionGroups)[number], optionKey: string) {
    setSelected((current) => {
      const keys = current[group.key] ?? [];
      if (group.max === 1) {
        const clearing = group.min === 0 && keys.includes(optionKey);
        return { ...current, [group.key]: clearing ? [] : [optionKey] };
      }
      if (keys.includes(optionKey)) return { ...current, [group.key]: keys.filter((k) => k !== optionKey) };
      if (keys.length >= group.max) return current;
      return { ...current, [group.key]: [...keys, optionKey] };
    });
  }

  async function addToCart() {
    if (priced.kind !== "ok") return;
    const cart = useCart.getState();
    if (cart.shop && cart.shop.id !== shop._id) {
      const replace = await confirm({
        title: "تبدأ سلة جديدة؟",
        message: `السلة فيها طلب من ${cart.shop.name}. الطلب الواحد بيكون من محل واحد، فلو كملت السلة هتتفضى.`,
        confirmLabel: "ابدأ سلة جديدة",
      });
      if (!replace) return;
    }
    cart.add(
      { id: shop._id, name: shop.name },
      {
        productId: product._id,
        name: product.name,
        emoji: product.emoji,
        optionsLabel: priced.optionsLabel,
        selections: selections.filter((s) => s.optionKeys.length > 0),
        unitPrice: priced.unitPrice,
        quantity,
      },
    );
    router.dismissTo({ pathname: "/shop/[id]", params: { id: shop._id } });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <EmojiTile emoji={product.emoji} tint={shop.tint} size={96} />
          <AppText variant="display">{product.name}</AppText>
          {product.description ? <AppText tone="muted">{product.description}</AppText> : null}
          <AppText variant="title" tone="primary">
            {formatPrice(product.price)}
          </AppText>
        </View>

        {product.optionGroups.map((group) => (
          <View key={group.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <AppText variant="subtitle">{group.name}</AppText>
              <AppText variant="caption" tone={group.min > 0 ? "primary" : "muted"}>
                {groupHint(group)}
              </AppText>
            </View>
            {group.options.map((option) => {
              const isOn = (selected[group.key] ?? []).includes(option.key);
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole={group.max === 1 ? "radio" : "checkbox"}
                  accessibilityState={{ checked: isOn }}
                  onPress={() => toggle(group, option.key)}
                  style={[styles.option, isOn && styles.optionOn]}>
                  <View style={[styles.mark, group.max === 1 && styles.markRound, isOn && styles.markOn]} />
                  <AppText style={styles.optionName}>{option.name}</AppText>
                  {option.priceDelta !== 0 ? (
                    <AppText variant="caption" tone="muted">
                      {option.priceDelta > 0 ? "+" : ""}
                      {formatPrice(option.priceDelta)}
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}

      </ScrollView>
      {shopOpen ? (
        <View style={[styles.footer, narrow && styles.footerNarrow]}>
          <View style={[styles.stepper, narrow && styles.stepperNarrow]}>
            <StepButton
              icon="remove"
              label="قلل الكمية"
              disabled={quantity <= 1}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            />
            <AppText variant="title">{quantity}</AppText>
            <StepButton
              icon="add"
              label="زود الكمية"
              disabled={quantity >= MAX_QUANTITY}
              onPress={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            />
          </View>
          <Button
            style={styles.addButton}
            disabled={priced.kind !== "ok"}
            label={priced.kind === "ok" ? `أضف للسلة · ${formatPrice(priced.unitPrice * quantity)}` : "اختار المطلوب"}
            onPress={addToCart}
          />
        </View>
      ) : (
        <View style={styles.footer}>
          <View style={styles.closedNotice}>
            <AppText variant="subtitle" tone="warningInk">
              {shop.paused
                ? "المحل واقف استقبال طلبات مؤقتاً"
                : `المحل مقفول دلوقتي · مواعيد النهارده ${todayHoursLabel(shop, now)}`}
            </AppText>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function groupHint({ min, max }: { min: number; max: number }) {
  if (min === 0) return `اختياري · لحد ${max}`;
  if (min === max) return min === 1 ? "مطلوب" : `مطلوب · اختار ${min}`;
  return `مطلوب · من ${min} لحد ${max}`;
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  screen: { flex: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  addButton: { flex: 1 },
  footerNarrow: { gap: space.sm, paddingHorizontal: space.lg },
  stepperNarrow: { gap: space.sm },
  closedNotice: {
    flex: 1,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  content: { padding: space.xl, gap: space.xl },
  header: { gap: space.sm, alignItems: "flex-start" },
  group: { gap: space.sm },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionName: { flex: 1 },
  mark: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: colors.faint },
  markRound: { borderRadius: 10 },
  markOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepper: { flexDirection: "row", alignItems: "center", gap: space.lg },
});
