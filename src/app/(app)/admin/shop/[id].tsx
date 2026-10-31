import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { cleanNumber } from "@/lib/number-input";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { ToggleRow } from "@/components/toggle-row";
import { Unavailable } from "@/components/unavailable";
import { errorMessage } from "@/lib/errors";
import { colors, fonts, radius, space } from "@/theme";

export default function AdminShopMenu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useQuery(api.catalog.shop, { shopId: id });
  if (data === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (data === null) return <Unavailable message="المحل ده مش موجود" />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: data.shop.name }} />
      {data.sections.map((section) => (
        <View key={section._id} style={styles.section}>
          <AppText variant="subtitle">{section.name}</AppText>
          {section.products.map((product) => (
            <ProductRow key={`${product._id}-${product.price}`} product={product} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function ProductRow({ product }: { product: Doc<"products"> }) {
  const updateProduct = useMutation(api.adminCatalog.updateProduct);
  const [price, setPrice] = useState(String(product.price));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const parsed = Number(price);
  const changed = price !== "" && Number.isFinite(parsed) && parsed !== product.price;

  async function save(change: { price: number } | { available: boolean }) {
    setError(null);
    setSaving(true);
    try {
      await updateProduct({ productId: product._id, ...change });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.card, !product.available && styles.off]}>
      <View style={styles.row}>
        <AppText variant="subtitle" style={styles.name}>
          {product.emoji} {product.name}
        </AppText>
        <ToggleRow
          label={product.available ? "متاح" : "غير متاح"}
          value={product.available}
          onValueChange={(available) => void save({ available })}
        />
      </View>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={`سعر ${product.name}`}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={(text) => setPrice(cleanNumber(text))}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (changed) void save({ price: parsed });
          }}
          style={styles.input}
        />
        <AppText tone="muted">ج.م</AppText>
        {changed ? (
          <Button kind="secondary" label="حفظ" loading={saving} onPress={() => void save({ price: parsed })} />
        ) : null}
      </View>
      {error ? <AppText tone="danger">{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  content: { padding: space.lg, gap: space.lg },
  section: { gap: space.sm },
  card: {
    gap: space.sm,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  off: { borderStyle: "dashed", backgroundColor: colors.background },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  name: { flex: 1 },
  input: {
    width: 90,
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
    textAlign: "center",
  },
});
