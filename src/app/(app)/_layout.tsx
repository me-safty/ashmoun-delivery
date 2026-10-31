import { Stack } from "expo-router";
import { stackScreenOptions } from "@/theme";

export default function AppLayout() {
  return <Stack screenOptions={{ ...stackScreenOptions, headerShown: false }} />;
}
