import { Stack } from "expo-router";
import { stackScreenOptions } from "@/theme";

export default function AdminLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: "لوحة التحكم" }} />
      <Stack.Screen name="order/[id]" options={{ title: "" }} />
      <Stack.Screen name="drivers" options={{ title: "المندوبين" }} />
    </Stack>
  );
}
