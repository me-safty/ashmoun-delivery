import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { ScrollView, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { colors, formatPrice, radius, space } from "@/theme";

export default function Profile() {
  const me = useQuery(api.users.me);
  const addresses = useQuery(api.addresses.mine);
  const { signOut } = useAuthActions();

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.card}>
        <AppText variant="title">{me?.name}</AppText>
        <AppText tone="muted">{me?.phone}</AppText>
      </View>
      <AppText variant="subtitle">عناويني</AppText>
      {addresses?.map((address) => (
        <View key={address._id} style={styles.card}>
          <AppText variant="subtitle">
            {address.label} · {address.zoneName}
          </AppText>
          <AppText tone="muted">{address.street}</AppText>
          <AppText variant="caption" tone="primary">
            توصيل {formatPrice(address.deliveryFee)}
          </AppText>
        </View>
      ))}
      <Button kind="danger" label="تسجيل الخروج" onPress={() => void signOut()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
});
