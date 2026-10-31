import { StyleSheet, Switch, View } from "react-native";
import { colors, space } from "@/theme";
import { AppText } from "./app-text";

type Props = { label: string; value: boolean; onValueChange: (value: boolean) => void };

export function ToggleRow({ label, value, onValueChange }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" tone={value ? "successInk" : "dangerInk"}>
        {label}
      </AppText>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.success, false: colors.border }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 44 },
});
