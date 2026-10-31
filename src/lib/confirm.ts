import { Alert, Platform } from "react-native";

// react-native-web's Alert ignores buttons, so the web falls back to window.confirm.
export function confirm({ title, message, confirmLabel }: { title: string; message: string; confirmLabel: string }) {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: "لا، رجوع", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]),
  );
}
