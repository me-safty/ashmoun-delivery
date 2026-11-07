import "react-native-gesture-handler";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BalooBhaijaan2_400Regular,
  BalooBhaijaan2_500Medium,
  BalooBhaijaan2_600SemiBold,
  BalooBhaijaan2_700Bold,
  BalooBhaijaan2_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/baloo-bhaijaan-2";
import { ConvexReactClient } from "convex/react";
import { LocaleProvider, Stack, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, type PropsWithChildren } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { colors, stackScreenOptions } from "@/theme";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

if (Platform.OS === "web") {
  document.documentElement.dir = "rtl";
  document.documentElement.lang = "ar";
}

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("EXPO_PUBLIC_CONVEX_URL is not set; run `pnpm exec convex dev`.");
const convex = new ConvexReactClient(convexUrl, { unsavedChangesWarning: false });

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BalooBhaijaan2_400Regular,
    BalooBhaijaan2_500Medium,
    BalooBhaijaan2_600SemiBold,
    BalooBhaijaan2_700Bold,
    BalooBhaijaan2_800ExtraBold,
    ...Ionicons.font,
  });

  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <ConvexAuthProvider client={convex} storage={Platform.OS === "web" ? undefined : secureStorage}>
      <WebFrame>
        <StatusBar style="dark" />
        <RootStack />
      </WebFrame>
    </ConvexAuthProvider>
  );
}

import { PHONE_MAX } from "@/lib/responsive";

const PHONE_WIDTH = PHONE_MAX;

function WebFrame({ children }: PropsWithChildren) {
  const segments: readonly string[] = useSegments();
  const { width } = useWindowDimensions();
  const framed = Platform.OS === "web" && width > PHONE_WIDTH && !segments.includes("admin");
  return (
    <View style={[styles.root, framed && styles.backdrop]}>
      <View style={[styles.root, framed && styles.column]}>{children}</View>
    </View>
  );
}

function RootStack() {
  return (
    <LocaleProvider direction="rtl">
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </LocaleProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  backdrop: { backgroundColor: colors.border, alignItems: "center" },
  column: { width: "100%", maxWidth: PHONE_WIDTH },
});
