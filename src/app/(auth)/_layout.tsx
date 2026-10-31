import { Stack } from "expo-router";
import { stackScreenOptions } from "@/theme";

export default function AuthLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "حساب جديد" }} />
      <Stack.Screen name="forgot-password" options={{ title: "استعادة كلمة المرور" }} />
    </Stack>
  );
}
