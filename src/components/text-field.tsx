import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radius, space } from "@/theme";
import { AppText } from "./app-text";

type Props = TextInputProps & { label: string };

export function TextField({ label, style, ...props }: Props) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <TextInput placeholderTextColor={colors.faint} style={[styles.input, style]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
    textAlign: "right",
  },
});
