import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { cleanNumber } from "@/lib/number-input";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
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
  const changed = price !== "" && parsed !== product.price;

  async function save(price: number, available: boolean) {
    setError(null);
    setSaving(true);
    try {
      await updateProduct({ productId: product._id, price, available });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.card, !product.available && styles.inactive]}>
      <View style={styles.row}>
        <AppText variant="subtitle" style={styles.name}>
          {product.emoji} {product.name}
        </AppText>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: product.available }}
          onPress={() => void save(product.price, !product.available)}
          style={styles.toggle}>
          <AppText variant="caption" tone={product.available ? "success" : "muted"}>
            {product.available ? "متاح" : "غير متاح"}
          </AppText>
        </Pressable>
      </View>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={`سعر ${product.name}`}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={(text) => setPrice(cleanNumber(text))}
          style={styles.input}
        />
        <AppText tone="muted">ج.م</AppText>
        <Button kind="secondary" label="حفظ" disabled={!changed} loading={saving} onPress={() => void save(parsed, product.available)} />
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
  inactive: { opacity: 0.7 },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  name: { flex: 1 },
  toggle: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.sm },
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
