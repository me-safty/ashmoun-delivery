import { Pressable, StyleSheet, View } from "react-native";
import { colors, space } from "@/theme";
import { AppText } from "./app-text";

// `warn` is for switches whose "on" state is the exceptional one (e.g. pausing a shop).
type Props = { label: string; value: boolean; onValueChange: (value: boolean) => void; warn?: boolean };

// A drawn switch: react-native-web's Switch misplaces its "on" thumb under dir="rtl".
export function ToggleRow({ label, value, onValueChange, warn = false }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={styles.row}>
      <AppText variant="caption" tone={warn ? (value ? "dangerInk" : "mutedInk") : value ? "successInk" : "dangerInk"}>
        {label}
      </AppText>
      <View style={[styles.track, value && (warn ? styles.trackWarn : styles.trackOn)]}>
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
  trackWarn: { justifyContent: "flex-end", backgroundColor: colors.danger },
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
