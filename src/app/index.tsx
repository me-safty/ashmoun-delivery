import { useQuery } from "convex/react";
import { Stack } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { colors, formatPrice, radius, space } from "@/theme";

export default function DeliveryZones() {
  const zones = useQuery(api.zones.list);

  return (
    <>
      <Stack.Screen options={{ title: "مناطق التوصيل" }} />
      {zones === undefined ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior="automatic"
          data={zones}
          keyExtractor={(zone) => zone._id}
          ListHeaderComponent={
            <AppText variant="display" style={styles.header}>
              توصيل أشمون والقرى
            </AppText>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <AppText variant="subtitle">{item.name}</AppText>
              <AppText variant="caption" tone="primary">
                التوصيل {formatPrice(item.deliveryFee)}
              </AppText>
            </View>
          )}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  list: { padding: space.lg, gap: space.sm },
  header: { marginBottom: space.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
});
