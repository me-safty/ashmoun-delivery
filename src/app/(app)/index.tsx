import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { colors, formatPrice, radius, space } from "@/theme";

export default function Home() {
  const me = useQuery(api.users.me);
  const addresses = useQuery(api.addresses.mine);
  const { signOut } = useAuthActions();
  const address = addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  return (
    <SafeAreaView style={styles.screen}>
      <AppText variant="display">أهلاً {me?.name}</AppText>
      {address ? (
        <View style={styles.card}>
          <AppText variant="caption" tone="muted">
            التوصيل إلى {address.label}
          </AppText>
          <AppText variant="subtitle">
            {address.zoneName} · {address.street}
          </AppText>
          <AppText variant="caption" tone="primary">
            رسوم التوصيل {formatPrice(address.deliveryFee)}
          </AppText>
        </View>
      ) : null}
      <Button kind="secondary" label="تسجيل الخروج" onPress={() => void signOut()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: space.xl, gap: space.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
});
