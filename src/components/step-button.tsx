import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme";

type Props = {
  icon: "add" | "remove" | "trash-outline";
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function StepButton({ icon, label, disabled = false, onPress }: Props) {
  const destructive = icon === "trash-outline";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, destructive && styles.destructive, disabled && styles.disabled]}>
      <Ionicons name={icon} size={20} color={destructive ? colors.danger : colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  step: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  destructive: { backgroundColor: colors.dangerSoft },
  disabled: { opacity: 0.4 },
});
