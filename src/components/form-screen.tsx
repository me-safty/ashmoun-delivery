import type { PropsWithChildren, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, space } from "@/theme";

type Props = PropsWithChildren<{ footer?: ReactNode }>;

export function FormScreen({ children, footer }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={Platform.OS === "web" ? [] : ["bottom"]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.safe}
          contentContainerStyle={[styles.content, Platform.OS === "web" && styles.contentWeb]}
          contentInsetAdjustmentBehavior={Platform.OS === "web" ? "never" : "automatic"}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer ? <View style={[styles.footer, Platform.OS === "web" && styles.footerWeb]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: space.xl, gap: space.lg },
  contentWeb: { paddingTop: space.lg, paddingBottom: space.lg },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerWeb: { paddingBottom: space.md },
});
