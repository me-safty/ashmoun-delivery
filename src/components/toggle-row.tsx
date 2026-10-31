import { Pressable, StyleSheet, View } from "react-native";
import { colors, space } from "@/theme";
import { AppText } from "./app-text";

type Props = { label: string; value: boolean; onValueChange: (value: boolean) => void };

// A drawn switch: react-native-web's Switch misplaces its "on" thumb under dir="rtl".
export function ToggleRow({ label, value, onValueChange }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={styles.row}>
      <AppText variant="caption" tone={value ? "successInk" : "dangerInk"}>
        {label}
      </AppText>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={styles.thumb} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 44 },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    flexDirection: "row",
    justifyContent: "flex-start",
    backgroundColor: colors.border,
  },
  trackOn: { justifyContent: "flex-end", backgroundColor: colors.success },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
