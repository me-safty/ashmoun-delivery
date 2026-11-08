import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import type { MapCenter } from "./location-map.native";

type Props = {
  center: MapCenter;
  onCenterChange: (center: MapCenter) => void;
  onReady?: () => void;
};

type LeafletMap = {
  getCenter: () => { lat: number; lng: number };
  getZoom: () => number;
  setView: (center: [number, number], zoom: number) => void;
  on: (event: string, cb: () => void) => void;
  remove: () => void;
};

type LeafletTileLayer = { addTo: (map: LeafletMap) => LeafletTileLayer };

type Leaflet = {
  map: (el: HTMLElement, opts: { zoomControl: boolean; attributionControl: boolean }) => LeafletMap;
  tileLayer: (url: string, opts: { maxZoom: number; attribution?: string }) => LeafletTileLayer;
};

declare global {
  interface Window {
    L?: Leaflet;
  }
}

let leafletReady: Promise<void> | null = null;

function ensureLeaflet() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.L) return Promise.resolve();
  if (leafletReady) return leafletReady;
  leafletReady = new Promise<void>((resolve, reject) => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("leaflet"));
    document.head.appendChild(script);
  });
  return leafletReady;
}

export function LocationMap({ center, onCenterChange, onReady }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const last = useRef(center);
  const ready = useRef(false);
  const onCenterChangeRef = useRef(onCenterChange);
  const onReadyRef = useRef(onReady);
  const initLat = useRef(center.lat);
  const initLng = useRef(center.lng);

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange;
    onReadyRef.current = onReady;
  }, [onCenterChange, onReady]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensureLeaflet();
      } catch {
        return;
      }
      if (cancelled || !hostRef.current || !window.L || mapRef.current) return;
      const L = window.L;
      const map = L.map(hostRef.current, { zoomControl: false, attributionControl: true });
      map.setView([initLat.current, initLng.current], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      map.on("moveend", () => {
        const c = map.getCenter();
        last.current = { lat: c.lat, lng: c.lng };
        onCenterChangeRef.current(last.current);
      });
      mapRef.current = map;
      ready.current = true;
      onReadyRef.current?.();
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      ready.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    if (Math.abs(last.current.lat - center.lat) < 1e-6 && Math.abs(last.current.lng - center.lng) < 1e-6) return;
    last.current = center;
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center]);

  return (
    <View style={styles.wrap}>
      <div
        ref={hostRef}
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 0 }}
      />
      <View pointerEvents="none" style={styles.pinWrap}>
        <View style={styles.pin} />
        <View style={styles.pinDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, position: "relative", overflow: "hidden" },
  pinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -12,
    marginTop: -28,
    alignItems: "center",
    zIndex: 500,
  },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D9480F",
    borderWidth: 3,
    borderColor: "#fff",
  },
  pinDot: {
    width: 4,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#D9480F",
    marginTop: -2,
  },
});
