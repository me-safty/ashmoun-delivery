import { useAuthActions } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import { Pressable } from "react-native";
import { AddressForm } from "@/components/address-form";
import { AppText } from "@/components/app-text";

export default function WelcomeAddress() {
  const { signOut } = useAuthActions();
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={() => void signOut()} hitSlop={8}>
              <AppText variant="caption" tone="primary">
                تسجيل الخروج
              </AppText>
            </Pressable>
          ),
        }}
      />
      <AddressForm />
    </>
  );
}
