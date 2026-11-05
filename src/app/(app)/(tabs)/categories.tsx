import { useQuery } from "convex/react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { CategoryArt } from "@/components/category-art";
import { colors, radius, space } from "@/theme";

export default function Categories() {
  const categories = useQuery(api.catalog.categories);

  if (categories === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <FlatList
      data={categories}
      numColumns={2}
      keyExtractor={(c) => c._id}
      contentContainerStyle={styles.list}
      // The app is RTL, so a plain row already fills from the right edge.
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: "/category/[id]", params: { id: item._id } })}
          style={[styles.tile, { backgroundColor: item.tint }]}>
          <CategoryArt emoji={item.emoji} />
          <AppText variant="subtitle" style={styles.name}>
            {item.name}
          </AppText>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  list: { padding: space.lg, gap: space.md },
  row: { gap: space.md },
  tile: {
    flex: 1,
    minHeight: 120,
    borderRadius: radius.lg,
    padding: space.lg,
    justifyContent: "space-between",
  },
  name: { textAlign: "right" },
});
