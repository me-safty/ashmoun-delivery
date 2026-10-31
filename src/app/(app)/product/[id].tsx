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
  // Keep only keys that still exist, so an option removed while the sheet is open can't block pricing.
  const selections = product.optionGroups.map((group) => ({
    groupKey: group.key,
    optionKeys: (selected[group.key] ?? []).filter((key) => group.options.some((o) => o.key === key)),
  }));
  const priced = priceLine(product, selections);

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

function groupHint({ min, max }: { min: number; max: number }) {
  if (min === 0) return `اختياري · لحد ${max}`;
  if (min === max) return min === 1 ? "مطلوب" : `مطلوب · اختار ${min}`;
  return `مطلوب · من ${min} لحد ${max}`;
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
