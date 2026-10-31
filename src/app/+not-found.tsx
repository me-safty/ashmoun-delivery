import { Stack } from "expo-router";
import { Unavailable } from "@/components/unavailable";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <Unavailable message="الصفحة دي مش موجودة" />
    </>
  );
}
