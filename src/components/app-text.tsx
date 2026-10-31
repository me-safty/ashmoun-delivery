import { StyleSheet, Text, type TextProps } from "react-native";
import { colors, fonts } from "@/theme";

// Strings with only digits or emoji would otherwise resolve to LTR on web (dir="auto").
const styles = StyleSheet.create({ base: { writingDirection: "rtl" } });

const variants = StyleSheet.create({
  display: { fontFamily: fonts.black, fontSize: 28, lineHeight: 42 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 32 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 20 },
});

type Props = TextProps & {
  variant?: keyof typeof variants;
  tone?: "ink" | "muted" | "primary" | "danger" | "success" | "onPrimary";
};

export function AppText({ variant = "body", tone = "ink", style, ...props }: Props) {
  return (
    <Text
      {...props}
      style={[styles.base, variants[variant], { color: colors[tone] }, style]}
    />
  );
}
