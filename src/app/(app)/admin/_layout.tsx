import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { colors, space, stackScreenOptions } from "@/theme";

export default function AdminLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "لوحة التحكم",
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="رجوع للتطبيق"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/profile"))}
              hitSlop={12}
              style={styles.back}>
              <Ionicons name="arrow-forward" size={24} color={colors.ink} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="order/[id]" options={{ title: "" }} />
      <Stack.Screen name="drivers" options={{ title: "المندوبين" }} />
      <Stack.Screen name="zones" options={{ title: "مناطق التوصيل" }} />
      <Stack.Screen name="shops" options={{ title: "المحلات" }} />
      <Stack.Screen name="shop/[id]" options={{ title: "" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  back: { padding: space.sm },
});
