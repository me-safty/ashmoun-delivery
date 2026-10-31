import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { api } from "@/convex/_generated/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function getPushToken() {
  if (Platform.OS === "web" || !Device.isDevice) return null;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "حالة الطلبات",
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const status = current.granted ? "granted" : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

// Registers this device for order-status pushes and opens the order when a push is tapped.
export function usePushNotifications(enabled: boolean) {
  const savePushToken = useMutation(api.users.savePushToken);

  useEffect(() => {
    if (!enabled) return;
    getPushToken()
      .then((token) => (token ? savePushToken({ token }) : undefined))
      .catch(() => {});
  }, [enabled, savePushToken]);

  useEffect(() => {
    if (!enabled || Platform.OS === "web") return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const orderId = response.notification.request.content.data?.orderId;
      if (typeof orderId === "string") router.push({ pathname: "/order/[id]", params: { id: orderId } });
    });
    return () => subscription.remove();
  }, [enabled]);
}
