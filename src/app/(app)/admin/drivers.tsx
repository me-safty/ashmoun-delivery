import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { normalizePhone } from "@/convex/lib/phone";
import { AdminGrid, adminPage } from "@/components/admin-grid";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { ToggleRow } from "@/components/toggle-row";
import { errorMessage } from "@/lib/errors";
import { colors, radius, space } from "@/theme";

export default function Drivers() {
  const drivers = useQuery(api.admin.drivers);
  const addDriver = useMutation(api.admin.addDriver);
  const setActive = useMutation(api.admin.setDriverActive);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function add() {
    setError(null);
    setSaving(true);
    try {
      await addDriver({ name, phone });
      setName("");
      setPhone("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, adminPage]} keyboardShouldPersistTaps="handled">
      <AdminGrid>
        {drivers?.map((driver) => (
          <View key={driver._id} style={[styles.card, !driver.active && styles.off]}>
            <View style={styles.body}>
              <AppText variant="subtitle">🛵 {driver.name}</AppText>
              <AppText variant="caption" tone="muted">
                {driver.phone}
              </AppText>
            </View>
            <ToggleRow
              label={driver.active ? "متاح" : "مش متاح"}
              value={driver.active}
              onValueChange={(active) =>
                void setActive({ driverId: driver._id, active }).catch((e) => setError(errorMessage(e)))
              }
            />
          </View>
        ))}
      </AdminGrid>
      <View style={styles.form}>
        <AppText variant="subtitle">مندوب جديد</AppText>
        <TextField label="الاسم" value={name} onChangeText={setName} />
        <TextField label="رقم الموبايل" placeholder="01xxxxxxxxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        {error ? <AppText tone="danger">{error}</AppText> : null}
        <Button
          label="إضافة مندوب"
          loading={saving}
          disabled={name.trim().length < 2 || normalizePhone(phone) === null}
          onPress={add}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md },
  form: { gap: space.md, width: "100%", maxWidth: 480 },
  card: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  off: { borderStyle: "dashed", backgroundColor: colors.background },
  body: { flex: 1 },
});
