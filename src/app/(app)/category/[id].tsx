import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { ShopCard } from "@/components/shop-card";
import { useNow } from "@/lib/use-now";
import { colors, space } from "@/theme";

export default function CategoryShops() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const category = useQuery(api.catalog.category, { categoryId: id });
  const shops = useQuery(api.catalog.shops, { categoryId: id });

  return (
    <>
      <Stack.Screen options={{ title: category ? `${category.emoji} ${category.name}` : "" }} />
      <FlatList
        data={shops ?? []}
        keyExtractor={(s) => s._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ShopCard shop={item} now={now} />}
        ListEmptyComponent={
          shops === undefined ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <AppText tone="muted">مفيش محلات في القسم ده لسه</AppText>
          )
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: space.md },
});
