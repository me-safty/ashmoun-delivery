import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { api } from "@/convex/_generated/api";

// This device's token, remembered so sign-out can detach it from the account.
let deviceToken: string | null = null;

// expo-notifications throws on web when reading the last response.
const useLastNotificationResponse =
  Platform.OS === "web" ? () => null : Notifications.useLastNotificationResponse;

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

// Registers this device for order-status pushes and opens the order when a push is tapped,
// including the tap that launched a closed app.
export function usePushNotifications(enabled: boolean) {
  const savePushToken = useMutation(api.users.savePushToken);
  const lastResponse = useLastNotificationResponse();

  useEffect(() => {
    if (!enabled) return;
    getPushToken()
      .then(async (token) => {
        if (!token) return;
        deviceToken = token;
        await savePushToken({ token });
      })
      .catch(() => {});
  }, [enabled, savePushToken]);

  useEffect(() => {
    if (!enabled || !lastResponse) return;
    const orderId = lastResponse.notification.request.content.data?.orderId;
    if (typeof orderId === "string") router.push({ pathname: "/order/[id]", params: { id: orderId } });
    Notifications.clearLastNotificationResponse();
  }, [enabled, lastResponse]);
}

export function useSignOut() {
  const { signOut } = useAuthActions();
  const removePushToken = useMutation(api.users.removePushToken);
  return useCallback(async () => {
    if (deviceToken) await removePushToken({ token: deviceToken }).catch(() => {});
    deviceToken = null;
    await signOut();
  }, [removePushToken, signOut]);
}
