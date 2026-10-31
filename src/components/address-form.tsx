import { useMutation, useQuery } from "convex/react";
import * as Location from "expo-location";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { errorMessage } from "@/lib/errors";
import { colors, formatPrice, radius, space } from "@/theme";
import { AppText } from "./app-text";
import { Button } from "./button";
import { FormScreen } from "./form-screen";
import { TextField } from "./text-field";

const labels = ["البيت", "الشغل", "أخرى"];

type LocationState =
  | { kind: "none" }
  | { kind: "locating" }
  | { kind: "set"; lat: number; lng: number }
  | { kind: "denied" };

export function AddressForm({ onSaved }: { onSaved?: () => void }) {
  const zones = useQuery(api.zones.list);
  const create = useMutation(api.addresses.create);
  const [zoneId, setZoneId] = useState<Id<"zones"> | null>(null);
  const [label, setLabel] = useState(labels[0]);
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [location, setLocation] = useState<LocationState>({ kind: "none" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function locate() {
    setLocation({ kind: "locating" });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return setLocation({ kind: "denied" });
    try {
      const { coords } = await Location.getCurrentPositionAsync({});
      setLocation({ kind: "set", lat: coords.latitude, lng: coords.longitude });
    } catch {
      setLocation({ kind: "denied" });
    }
  }

  async function save() {
    if (!zoneId) return setError("اختار منطقتك");
    if (street.trim().length < 3) return setError("اكتب العنوان بالتفصيل");
    setError(null);
    setSaving(true);
    try {
      await create({
        zoneId,
        label,
        street,
        landmark,
        location: location.kind === "set" ? { lat: location.lat, lng: location.lng } : undefined,
      });
      onSaved?.();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<Button label="حفظ العنوان" loading={saving} onPress={save} />}>
      <AppText variant="subtitle">المنطقة</AppText>
      {zones === undefined ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.zones}>
          {zones.map((zone) => {
            const selected = zone._id === zoneId;
            return (
              <Pressable
                key={zone._id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setZoneId(zone._id)}
                style={[styles.zone, selected && styles.zoneSelected]}>
                <AppText variant="subtitle">{zone.name}</AppText>
                <AppText variant="caption" tone={selected ? "primary" : "muted"}>
                  توصيل {formatPrice(zone.deliveryFee)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      <AppText variant="subtitle">تفاصيل العنوان</AppText>
      <View style={styles.chips}>
        {labels.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: option === label }}
            onPress={() => setLabel(option)}
            style={[styles.chip, option === label && styles.chipSelected]}>
            <AppText variant="caption" tone={option === label ? "onPrimary" : "ink"}>
              {option}
            </AppText>
          </Pressable>
        ))}
      </View>
      <TextField label="الشارع ورقم البيت والدور" value={street} onChangeText={setStreet} />
      <TextField label="علامة مميزة (اختياري)" placeholder="جنب مسجد..." value={landmark} onChangeText={setLandmark} />

      <Pressable onPress={locate} style={styles.locate} disabled={location.kind === "locating"}>
        <AppText variant="subtitle" tone="primary">
          📍 {location.kind === "set" ? "تم تحديد موقعك" : "حدد موقعي الحالي (اختياري)"}
        </AppText>
        <AppText variant="caption" tone="muted">
          {location.kind === "locating"
            ? "جاري تحديد الموقع..."
            : location.kind === "denied"
              ? "مقدرناش نوصل لموقعك، العنوان المكتوب كفاية"
              : "بيساعد المندوب يوصلك أسرع"}
        </AppText>
      </Pressable>

      {error ? <AppText tone="danger">{error}</AppText> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  zones: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  zone: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  zoneSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chips: { flexDirection: "row", gap: space.sm },
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  locate: {
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    gap: space.xs,
  },
});
