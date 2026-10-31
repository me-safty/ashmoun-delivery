import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { priceLine } from "@/convex/lib/pricing";
import { AppText } from "@/components/app-text";
import { EmojiTile } from "@/components/emoji-tile";
import { Unavailable } from "@/components/unavailable";
import { colors, formatPrice, radius, space } from "@/theme";

type Selected = Record<string, string[]>;

export default function Product() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useQuery(api.catalog.product, { productId: id });
  const [selected, setSelected] = useState<Selected>({});
  const [quantity, setQuantity] = useState(1);

  if (data === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (data === null || !data.product.available) return <Unavailable message="المنتج ده مش متاح دلوقتي" />;

  const { product, shop } = data;
  const selections = Object.entries(selected).map(([groupKey, optionKeys]) => ({ groupKey, optionKeys }));
  const priced = priceLine(product, selections);

  function toggle(groupKey: string, optionKey: string, max: number) {
    setSelected((current) => {
      const keys = current[groupKey] ?? [];
      if (keys.includes(optionKey)) return { ...current, [groupKey]: keys.filter((k) => k !== optionKey) };
      if (max === 1) return { ...current, [groupKey]: [optionKey] };
      if (keys.length >= max) return current;
      return { ...current, [groupKey]: [...keys, optionKey] };
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
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
                {group.min > 0 ? "مطلوب" : `اختياري · لحد ${group.max}`}
              </AppText>
            </View>
            {group.options.map((option) => {
              const isOn = (selected[group.key] ?? []).includes(option.key);
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole={group.max === 1 ? "radio" : "checkbox"}
                  accessibilityState={{ checked: isOn }}
                  onPress={() => toggle(group.key, option.key, group.max)}
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

        <View style={styles.quantity}>
          <AppText variant="subtitle">الكمية</AppText>
          <View style={styles.stepper}>
            <StepButton label="−" onPress={() => setQuantity((q) => Math.max(1, q - 1))} />
            <AppText variant="title">{quantity}</AppText>
            <StepButton label="+" onPress={() => setQuantity((q) => Math.min(20, q + 1))} />
          </View>
        </View>

        <View style={styles.total}>
          <AppText variant="subtitle">الإجمالي</AppText>
          <AppText variant="title" tone="primary">
            {priced.kind === "ok" ? formatPrice(priced.unitPrice * quantity) : "اختار المطلوب"}
          </AppText>
        </View>
      </ScrollView>
    </>
  );
}

function StepButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.step}>
      <AppText variant="title" tone="primary">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
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
  quantity: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepper: { flexDirection: "row", alignItems: "center", gap: space.lg },
  step: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  total: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
