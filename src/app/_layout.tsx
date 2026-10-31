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
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { colors, fonts } from "@/theme";

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

  if (!fontsLoaded && fontError === null) return null;

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
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  useEffect(() => {
    if (staleSession) void signOut();
  }, [staleSession, signOut]);

  if (loading) return null;

  const signedIn = isAuthenticated && me != null;
  const hasAddress = me?.hasAddress ?? false;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.ink },
        headerTintColor: colors.ink,
        headerBackButtonDisplayMode: "minimal",
      }}>
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
