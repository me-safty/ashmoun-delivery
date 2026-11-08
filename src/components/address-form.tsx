import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/errors";
import { useLocationPicker } from "@/lib/location-picker";
import { colors, space } from "@/theme";
import { useMutation, useQuery } from "convex/react";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText } from "./app-text";
import { Button } from "./button";
import { FormScreen } from "./form-screen";
import { TextField } from "./text-field";

function Step({ n, title }: { n: number; title: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepBadge}>
        <AppText variant="caption" tone="onPrimary">
          {n}
        </AppText>
      </View>
      <AppText variant="subtitle">{title}</AppText>
    </View>
  );
}

export function AddressForm({ onSaved }: { onSaved?: () => void }) {
  const zones = useQuery(api.zones.list);
  const create = useMutation(api.addresses.create);
  const [street, setStreet] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const consume = useLocationPicker((s) => s.consume);
  const zoneId = zones?.[0]?._id ?? null;

  useFocusEffect(
    useCallback(() => {
      const picked = consume();
      if (picked) setLocation({ lat: picked.lat, lng: picked.lng });
    }, [consume]),
  );

  function openMapPicker() {
    router.push(
      location
        ? { pathname: "/select-location", params: { lat: String(location.lat), lng: String(location.lng) } }
        : "/select-location",
    );
  }

  async function save() {
    if (!zoneId) return setError("التوصيل متوقف حاليًا، يرجى المحاولة لاحقًا");
    if (street.trim().length < 1) return setError("اكتب العنوان");
    setError(null);
    setSaving(true);
    try {
      await create({
        zoneId,
        label: "البيت",
        street,
        landmark: "",
        location: location ?? undefined,
      });
      onSaved?.();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  const canSave = street.trim().length >= 1;

  return (
    <FormScreen>
      <Step n={1} title="حدد موقعك على الخريطة" />
      <Button
        kind={location ? "primary" : "secondary"}
        label={location ? "تم تحديد موقعك على الخريطة ✓ (تعديل)" : "تحديد الموقع عبر الخريطة"}
        onPress={openMapPicker}
      />

      <Step n={2} title="اكتب العنوان بالتفصيل" />

      <View style={styles.saveWrap}>
        {error ? <AppText tone="danger">{error}</AppText> : null}
        {zones === undefined ? <ActivityIndicator color={colors.primary} /> : null}
        <Button label="حفظ العنوان" loading={saving} disabled={!canSave} onPress={save} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: "row", alignItems: "center", gap: space.sm },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveWrap: { marginTop: space.lg, gap: space.sm },
});

