import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { PROVIDER_DEFAULT, Region } from "react-native-maps";
import { colors } from "@/theme";

export type MapCenter = { lat: number; lng: number };

type Props = {
  center: MapCenter;
  onCenterChange: (center: MapCenter) => void;
  onReady?: () => void;
};

const DEFAULT_DELTA = 0.008;

export function LocationMap({ center, onCenterChange, onReady }: Props) {
  const mapRef = useRef<MapView>(null);
  const last = useRef(center);
  const programmatic = useRef(false);
  const initial: Region = {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };

  useEffect(() => {
    if (Math.abs(last.current.lat - center.lat) < 1e-6 && Math.abs(last.current.lng - center.lng) < 1e-6) return;
    last.current = center;
    programmatic.current = true;
    mapRef.current?.animateToRegion(
      { latitude: center.lat, longitude: center.lng, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA },
      350,
    );
  }, [center]);

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initial}
        onRegionChangeComplete={(r) => {
          if (programmatic.current) {
            programmatic.current = false;
            last.current = { lat: r.latitude, lng: r.longitude };
            return;
          }
          const next = { lat: r.latitude, lng: r.longitude };
          if (Math.abs(last.current.lat - next.lat) < 1e-6 && Math.abs(last.current.lng - next.lng) < 1e-6) return;
          last.current = next;
          onCenterChange(next);
        }}
        onMapReady={onReady}
        showsUserLocation
        showsMyLocationButton={false}
      />
      <View pointerEvents="none" style={styles.pinWrap}>
        <View style={styles.pin} />
        <View style={styles.pinDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1 },
  pinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -12,
    marginTop: -28,
    alignItems: "center",
  },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  pinDot: {
    width: 4,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: -2,
  },
});
