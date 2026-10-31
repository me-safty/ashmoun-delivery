import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormScreen } from "@/components/form-screen";
import { TextField } from "@/components/text-field";
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
    <FormScreen footer={<Button label="إضافة مندوب" loading={saving} onPress={add} />}>
      {drivers?.map((driver) => (
        <View key={driver._id} style={[styles.card, !driver.active && styles.inactive]}>
          <View style={styles.body}>
            <AppText variant="subtitle">🛵 {driver.name}</AppText>
            <AppText variant="caption" tone="muted">
              {driver.phone}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: driver.active }}
            onPress={() =>
              void setActive({ driverId: driver._id, active: !driver.active }).catch((e) => setError(errorMessage(e)))
            }
            style={styles.toggle}>
            <AppText variant="caption" tone={driver.active ? "success" : "muted"}>
              {driver.active ? "متاح" : "مش متاح"}
            </AppText>
          </Pressable>
        </View>
      ))}
      <AppText variant="subtitle">مندوب جديد</AppText>
      <TextField label="الاسم" value={name} onChangeText={setName} />
      <TextField label="رقم الموبايل" placeholder="01xxxxxxxxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      {error ? <AppText tone="danger">{error}</AppText> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inactive: { opacity: 0.6 },
  body: { flex: 1 },
  toggle: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.md },
});
