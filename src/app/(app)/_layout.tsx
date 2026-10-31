import { useQuery } from "convex/react";
import { Stack } from "expo-router";
import { api } from "@/convex/_generated/api";
import { stackScreenOptions } from "@/theme";

// Screens opened from a link still get the tabs underneath, so back always leads somewhere.
export const unstable_settings = { anchor: "(tabs)" };

export default function AppLayout() {
  const me = useQuery(api.users.me);
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="shop/[id]" options={{ title: "" }} />
      <Stack.Screen name="order/[id]/index" options={{ title: "" }} />
      <Stack.Protected guard={me?.isAdmin ?? false}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen
        name="product/[id]"
        options={{ presentation: "formSheet", sheetAllowedDetents: [0.9], sheetGrabberVisible: true, title: "" }}
      />
    </Stack>
  );
}
