import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { cleanNumber } from "@/lib/number-input";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { ToggleRow } from "@/components/toggle-row";
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
    <View style={[styles.card, !zone.active && styles.off]}>
      <View style={styles.row}>
        <AppText variant="subtitle" style={styles.name}>
          {zone.name}
        </AppText>
        <ToggleRow
          label={zone.active ? "التوصيل شغال" : "متوقف"}
          value={zone.active}
          onValueChange={(active) => void save({ active })}
        />
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
  off: { borderStyle: "dashed", backgroundColor: colors.background },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  name: { flex: 1 },
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
