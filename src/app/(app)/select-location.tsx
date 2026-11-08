import { router, Stack, useLocalSearchParams } from "expo-router";
import * as ExpoLocation from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { LocationMap, type MapCenter } from "@/components/location-map";
import { useLocationPicker } from "@/lib/location-picker";
import { colors, fonts, radius, space } from "@/theme";

const FALLBACK: MapCenter = { lat: 30.0444, lng: 31.2357 };

export default function SelectLocation() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const setPicked = useLocationPicker((s) => s.setPicked);
  const initialLat = params.lat ? Number(params.lat) : NaN;
  const initialLng = params.lng ? Number(params.lng) : NaN;
  const hasInitial = Number.isFinite(initialLat) && Number.isFinite(initialLng);
  const [center, setCenter] = useState<MapCenter>(() =>
    hasInitial ? { lat: initialLat, lng: initialLng } : FALLBACK,
  );
  const [mapSelected, setMapSelected] = useState(hasInitial);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (hasInitial) return;
    if (mounted.current) return;
    mounted.current = true;
    void locateMe(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once to prefill GPS when no coords passed
  }, []);

  function pickMap(next: MapCenter) {
    setCenter(next);
    setMapSelected(true);
  }

  async function locateMe(silent = false) {
    if (!silent) Keyboard.dismiss();
    setLocating(true);
    setSearchError(null);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!silent) setSearchError("اسمح بالوصول للموقع لتحديد مكانك");
        return;
      }
      const { coords } = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      pickMap({ lat: coords.latitude, lng: coords.longitude });
    } catch {
      if (!silent) setSearchError("تعذر تحديد موقعك الحالي");
    } finally {
      setLocating(false);
    }
  }

  async function search() {
    const q = query.trim();
    if (q.length < 2) return;
    Keyboard.dismiss();
    setSearching(true);
    setSearchError(null);
    try {
      if (Platform.OS === "web") {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
          { headers: { "Accept-Language": "ar" } },
        );
        const data = (await res.json()) as { lat?: string; lon?: string }[];
        if (data[0]?.lat && data[0]?.lon) {
          pickMap({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
        } else {
          setSearchError("لم يتم العثور على المكان");
        }
      } else {
        const results = await ExpoLocation.geocodeAsync(q);
        if (results[0]) {
          pickMap({ lat: results[0].latitude, lng: results[0].longitude });
        } else {
          setSearchError("لم يتم العثور على المكان");
        }
      }
    } catch {
      setSearchError("تعذر البحث عن المكان");
    } finally {
      setSearching(false);
    }
  }

  function confirm() {
    if (!mapSelected) return;
    setPicked(center);
    router.back();
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "تحديد الموقع", headerTransparent: false }} />

      <View style={styles.mapWrap}>
        <View style={styles.searchWrap} pointerEvents="box-none">
          <View style={styles.searchBar}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث عن مكان أو عنوان..."
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              returnKeyType="search"
              onSubmitEditing={search}
              textAlign={Platform.OS === "web" ? "right" : undefined}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="بحث"
              onPress={search}
              disabled={searching}
              style={styles.searchBtn}
              hitSlop={8}>
              {searching ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <AppText variant="caption" tone="onPrimary">
                  بحث
                </AppText>
              )}
            </Pressable>
          </View>
          {searchError ? (
            <View style={styles.errorPill}>
              <AppText variant="caption" tone="danger">
                {searchError}
              </AppText>
            </View>
          ) : null}
        </View>

        <LocationMap center={center} onCenterChange={pickMap} />

        <View style={styles.mapStatus} pointerEvents="none">
          <AppText variant="caption" tone={mapSelected ? "success" : "muted"}>
            {mapSelected ? "تم تحديد الموقع على الخريطة ✓" : "حرّك الخريطة لتحديد الموقع"}
          </AppText>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <View style={styles.actions}>
          <Button
            kind="secondary"
            label={locating ? "جارٍ تحديد موقعك..." : "موقعي الحالي"}
            loading={locating}
            onPress={() => void locateMe()}
            style={styles.actionBtn}
          />
          <Button
            label="تأكيد الموقع"
            onPress={confirm}
            disabled={!mapSelected}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  mapWrap: { flex: 1, position: "relative" },
  searchWrap: {
    position: "absolute",
    top: space.md,
    left: space.lg,
    right: space.lg,
    zIndex: 10,
    gap: space.xs,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingStart: space.md,
    paddingEnd: space.xs,
    minHeight: 52,
    gap: space.sm,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: space.sm,
  },
  searchBtn: {
    minHeight: 40,
    minWidth: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.md,
  },
  errorPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  mapStatus: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: space.sm,
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actions: { flexDirection: "row", gap: space.sm },
  actionBtn: { flex: 1 },
});
