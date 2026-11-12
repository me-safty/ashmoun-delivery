import { Modal, Pressable, StyleSheet, View } from "react-native";
import { colors, radius, space } from "@/theme";
import { AppText } from "./app-text";
import { Button } from "./button";

type Props = {
  visible: boolean;
  onSignIn: () => void;
  onGuest: () => void;
};

// Ask a guest to sign in before ordering, or let them keep browsing as a guest.
export function AuthPromptDialog({ visible, onSignIn, onGuest }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onGuest}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onGuest} accessibilityLabel="إغلاق" />
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <AppText variant="title" style={styles.title}>
            سجّل الدخول أو تابع كزائر
          </AppText>
          <AppText variant="body" tone="muted" style={styles.message}>
            سجّل الدخول لمتابعة طلبك وحفظ عناوينك، أو تابع التصفّح كزائر.
          </AppText>
          <View style={styles.actions}>
            <Button label="تسجيل الدخول" onPress={onSignIn} />
            <Button kind="secondary" label="المتابعة كزائر" onPress={onGuest} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,26,23,0.45)",
    padding: space.xl,
  },
  dismiss: StyleSheet.absoluteFill,
  card: {
    width: "100%",
    maxWidth: 400,
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  title: { textAlign: "center" },
  message: { textAlign: "center" },
  actions: { gap: space.sm, marginTop: space.sm },
});