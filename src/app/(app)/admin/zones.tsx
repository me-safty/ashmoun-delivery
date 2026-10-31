import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { cleanNumber } from "@/lib/number-input";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { errorMessage } from "@/lib/errors";
import { colors, fonts, radius, space } from "@/theme";

export default function Zones() {
  const zones = useQuery(api.adminCatalog.zones);
  if (zones === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText tone="muted">رسوم التوصيل بتتحسب على الطلبات الجديدة بس.</AppText>
      {zones.map((zone) => (
        <ZoneRow key={`${zone._id}-${zone.deliveryFee}`} zone={zone} />
      ))}
    </ScrollView>
  );
}

function ZoneRow({ zone }: { zone: Doc<"zones"> }) {
  const updateZone = useMutation(api.adminCatalog.updateZone);
  const [fee, setFee] = useState(String(zone.deliveryFee));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const parsed = Number(fee);
  const changed = fee !== "" && Number.isFinite(parsed) && parsed !== zone.deliveryFee;

  async function save(change: { deliveryFee: number } | { active: boolean }) {
    setError(null);
    setSaving(true);
    try {
      await updateZone({ zoneId: zone._id, ...change });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.card, !zone.active && styles.inactive]}>
      <View style={styles.row}>
        <AppText variant="subtitle" style={styles.name}>
          {zone.name}
        </AppText>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: zone.active }}
          onPress={() => void save({ active: !zone.active })}
          style={styles.toggle}>
          <AppText variant="caption" tone={zone.active ? "success" : "muted"}>
            {zone.active ? "التوصيل شغال" : "متوقف"}
          </AppText>
        </Pressable>
      </View>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={`رسوم توصيل ${zone.name}`}
          keyboardType="number-pad"
          value={fee}
          onChangeText={(text) => setFee(cleanNumber(text))}
          style={styles.input}
        />
        <AppText tone="muted">ج.م</AppText>
        <Button kind="secondary" label="حفظ" disabled={!changed} loading={saving} onPress={() => void save({ deliveryFee: parsed })} />
      </View>
      {error ? <AppText tone="danger">{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  content: { padding: space.lg, gap: space.md },
  card: {
    gap: space.sm,
    padding: space.lg,
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
    width: 80,
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
