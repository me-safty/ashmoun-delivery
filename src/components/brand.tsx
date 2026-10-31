import { StyleSheet, View } from "react-native";
import { colors, radius, space } from "@/theme";
import { AppText } from "./app-text";

export function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.mark}>
        <AppText style={styles.emoji}>🛵</AppText>
      </View>
      <AppText variant="display">توصيل أشمون</AppText>
      <AppText tone="muted">أكلك وطلباتك من محلات أشمون والقرى لحد باب البيت، والدفع عند الاستلام.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { gap: space.sm, paddingTop: space.xxl, paddingBottom: space.lg },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 38, lineHeight: 52 },
});
