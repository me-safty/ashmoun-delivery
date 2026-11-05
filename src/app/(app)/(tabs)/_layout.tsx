import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform } from "react-native";
import { colors, fonts } from "@/theme";

function icon(activeName: ComponentProps<typeof Ionicons>["name"], inactiveName: ComponentProps<typeof Ionicons>["name"]) {
  return function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return (
      <Ionicons
        name={focused ? activeName : inactiveName}
        color={focused ? colors.primary : colors.muted}
        size={size - 2}
      />
    );
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.ink },
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
        // Cairo's tall line box overflows the default web tab bar; native bars size with the safe area.
        tabBarStyle: [
          { backgroundColor: colors.surface, borderTopColor: colors.border },
          Platform.OS === "web" && { height: 60, paddingBottom: 6 },
        ],
      }}>
      <Tabs.Screen name="index" options={{ title: "الرئيسية", headerShown: false, tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="categories" options={{ title: "الأقسام", tabBarIcon: icon("grid", "grid-outline") }} />
      <Tabs.Screen name="orders" options={{ title: "طلباتي", tabBarIcon: icon("receipt", "receipt-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "حسابي", tabBarIcon: icon("person", "person-outline") }} />
    </Tabs>
  );
}
