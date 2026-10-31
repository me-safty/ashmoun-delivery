import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { confirm } from "@/lib/confirm";
import { errorMessage } from "@/lib/errors";
import { colors, formatPrice, radius, space } from "@/theme";

export default function Profile() {
  const me = useQuery(api.users.me);
  const addresses = useQuery(api.addresses.mine);
  const setDefault = useMutation(api.addresses.setDefault);
  const remove = useMutation(api.addresses.remove);
  const { signOut } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const sortedAddresses = [...(addresses ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function onRemove(addressId: Id<"addresses">, label: string) {
    const sure = await confirm({ title: "تمسح العنوان؟", message: `هنمسح عنوان "${label}".`, confirmLabel: "مسح" });
    if (sure) await run(() => remove({ addressId }));
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.card}>
        <AppText variant="title">{me?.name}</AppText>
        <AppText tone="muted">{me?.phone}</AppText>
      </View>

      <View style={styles.sectionRow}>
        <AppText variant="subtitle">عناويني</AppText>
        <Pressable accessibilityRole="button" onPress={() => router.push("/address-new")} hitSlop={8} style={styles.link}>
          <AppText variant="caption" tone="primary">
            + أضف عنوان
          </AppText>
        </Pressable>
      </View>
      {sortedAddresses.map((address) => (
        <View key={address._id} style={[styles.card, address.isDefault && styles.defaultCard]}>
          <View style={styles.sectionRow}>
            <AppText variant="subtitle">
              {address.label} · {address.zoneName}
            </AppText>
            {address.isDefault ? (
              <View style={styles.defaultPill}>
                <AppText variant="caption" style={styles.defaultPillText}>
                  العنوان الأساسي
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText tone="muted">
            {address.street}
            {address.landmark ? ` · ${address.landmark}` : ""}
          </AppText>
          <AppText variant="caption" tone="muted">
            توصيل {formatPrice(address.deliveryFee)}
          </AppText>
          <View style={styles.actions}>
            {address.isDefault ? null : (
              <Pressable
                accessibilityRole="button"
                onPress={() => void run(() => setDefault({ addressId: address._id }))}
                hitSlop={8}
                style={styles.link}>
                <AppText variant="caption" tone="primary">
                  خليه الأساسي
                </AppText>
              </Pressable>
            )}
            {sortedAddresses.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void onRemove(address._id, address.label)}
                hitSlop={8}
                style={[styles.link, styles.remove]}>
                <AppText variant="caption" tone="danger">
                  مسح
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
      {error ? <AppText tone="danger">{error}</AppText> : null}
      {me?.isAdmin ? <Button kind="secondary" label="🛠️ لوحة التحكم" onPress={() => router.push("/admin")} /> : null}
      <Button kind="danger" label="تسجيل الخروج" onPress={() => void signOut()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
  defaultCard: { borderColor: colors.primary },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm },
  actions: { flexDirection: "row", gap: space.sm },
  link: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.sm },
  remove: { marginStart: "auto" },
  defaultPill: { paddingHorizontal: space.sm, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  defaultPillText: { color: colors.primaryInk },
});
