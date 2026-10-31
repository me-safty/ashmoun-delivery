import { Stack } from "expo-router";
import { stackScreenOptions } from "@/theme";

export default function AppLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="shop/[id]" options={{ title: "" }} />
      <Stack.Screen
        name="product/[id]"
        options={{ presentation: "formSheet", sheetAllowedDetents: [0.9], sheetGrabberVisible: true, title: "" }}
      />
    </Stack>
  );
}
