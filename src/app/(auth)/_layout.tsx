import { Stack } from "expo-router";
import { colors, fonts } from "@/theme";

export default function AuthLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "حساب جديد" }} />
      <Stack.Screen name="forgot-password" options={{ title: "استعادة كلمة المرور" }} />
    </Stack>
  );
}
