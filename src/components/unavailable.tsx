import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { space } from "@/theme";
import { AppText } from "./app-text";
import { Button } from "./button";

export function Unavailable({ message }: { message: string }) {
  return (
    <View style={styles.screen}>
      <AppText variant="title">{message}</AppText>
      <Button kind="secondary" label="رجوع" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.lg, padding: space.xl },
});
