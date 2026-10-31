import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_900Black,
  useFonts,
} from "@expo-google-fonts/cairo";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { LocaleProvider, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/lib/cart";
import { usePushNotifications } from "@/lib/push";
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
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_900Black,
  });

  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <ConvexAuthProvider client={convex} storage={Platform.OS === "web" ? undefined : secureStorage}>
      <View style={styles.root}>
        <StatusBar style="dark" />
        <RootStack />
      </View>
    </ConvexAuthProvider>
  );
}

function RootStack() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const { signOut } = useAuthActions();
  const loading = isLoading || (isAuthenticated && me === undefined);
  const staleSession = isAuthenticated && me === null;

  useEffect(() => {
    if (staleSession) void signOut();
  }, [staleSession, signOut]);

  // The cart is stored per device, so it must not carry over to the next account.
  useEffect(() => {
    if (!loading && !isAuthenticated) useCart.getState().clear();
  }, [loading, isAuthenticated]);

  const signedIn = isAuthenticated && me != null;
  usePushNotifications(signedIn);

  if (loading) return <ActivityIndicator style={styles.root} color={colors.primary} />;

  const hasAddress = me?.hasAddress ?? false;

  return (
    <LocaleProvider direction="rtl">
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !hasAddress}>
          <Stack.Screen name="welcome-address" options={{ title: "عنوان التوصيل" }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && hasAddress}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </LocaleProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
