import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
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
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <Link href={{ pathname: "/category/[id]", params: { id: item._id } }} asChild>
          <Pressable style={[styles.tile, { backgroundColor: item.tint }]}>
            <AppText style={styles.emoji}>{item.emoji}</AppText>
            <AppText variant="subtitle">{item.name}</AppText>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  list: { padding: space.lg, gap: space.md },
  row: { gap: space.md },
  tile: { flex: 1, minHeight: 120, borderRadius: radius.lg, padding: space.lg, justifyContent: "space-between" },
  emoji: { fontSize: 40, lineHeight: 56 },
});
