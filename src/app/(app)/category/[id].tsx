import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, TextInput, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { ShopCard } from "@/components/shop-card";
import { Unavailable } from "@/components/unavailable";
import { useNow } from "@/lib/use-now";
import { colors, fonts, radius, space } from "@/theme";

const webNoOutline: object = Platform.OS === "web" ? { outlineStyle: "none" } : {};

export default function CategoryShops() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const category = useQuery(api.catalog.category, { categoryId: id });
  const shops = useQuery(api.catalog.shops, { categoryId: id });
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredShops = useMemo(() => {
    if (!shops) return shops;
    const q = search.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((shop) => {
      const name = shop.name.toLowerCase();
      const desc = shop.description.toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [shops, search]);

  if (category === null) return <Unavailable message="القسم ده مش موجود" />;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: category ? `${category.emoji} ${category.name}` : "",
          headerBackTitle: "رجوع",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <View style={styles.container}>
        <View style={styles.searchWrapper}>
          <View style={[styles.search, searchFocused && styles.searchFocused]}>
            <Ionicons name="search" size={20} color={colors.muted} />
            <TextInput
              accessibilityLabel="ابحث عن محلات"
              placeholder="ابحث عن محلات"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              clearButtonMode="while-editing"
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={[styles.searchInput, webNoOutline]}
            />
          </View>
        </View>
        <FlatList
          data={filteredShops ?? []}
          keyExtractor={(s) => s._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ShopCard shop={item} now={now} />}
          ListEmptyComponent={
            filteredShops === undefined ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <AppText tone="muted" style={styles.emptyText}>
                {search.trim() ? "مفيش محلات مطابقة للبحث" : "مفيش محلات في القسم ده لسه"}
              </AppText>
            )
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchWrapper: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    backgroundColor: colors.background,
  },
  search: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchFocused: { borderColor: colors.primary },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    textAlign: "right",
  },
  list: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md },
  emptyText: { textAlign: "center", marginTop: space.xl },
});
