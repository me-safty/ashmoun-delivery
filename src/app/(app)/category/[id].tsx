import { AppText } from "@/components/app-text";
import { ShopCard } from "@/components/shop-card";
import { Unavailable } from "@/components/unavailable";
import { api } from "@/convex/_generated/api";
import { useNow } from "@/lib/use-now";
import { colors, fonts, radius, space } from "@/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

const webNoOutline: object = Platform.OS === "web" ? { outlineStyle: "none" } : {};

export default function CategoryShops() {
  // This is the legacy id-based route: the param is `id`, not `slug`, and both
  // resolve fine server-side (resolveCategory accepts a slug or a row id).
  const { id } = useLocalSearchParams<{ id: string }>();
  const slugParam = Array.isArray(id) ? id[0] : id;
  const now = useNow();
  // "skip" until the route param exists — guards against template paths landing
  // without params on web, which previously sent {} and errored server-side.
  const category = useQuery(api.catalog.categoryBySlug, slugParam ? { slug: slugParam } : "skip");
  const shops = useQuery(api.catalog.shopsByCategorySlug, slugParam ? { categorySlug: slugParam } : "skip");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredShops = useMemo(() => {
    if (!shops) return shops;
    const q = search.trim().toLowerCase();
    let filtered = q
      ? shops.filter((shop) => {
          const name = shop.name.toLowerCase();
          const desc = shop.description.toLowerCase();
          return name.includes(q) || desc.includes(q);
        })
      : shops;
    return filtered;
  }, [shops, search]);

  if (category === null) return <Unavailable message="هذا القسم غير موجود" />;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: category ? `${category.emoji} ${category.name}` : "",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: "#FFFFFF" },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            numColumns={2}
            keyExtractor={(s) => s._id}
            contentContainerStyle={styles.list}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({ pathname: "/shop/[slug]", params: { slug: item.slug ?? item._id } })}
                style={styles.shopWrapper}>
                <ShopCard shop={item} now={now} />
              </Pressable>
            )}
            ListEmptyComponent={
              filteredShops === undefined ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <AppText tone="muted" style={styles.emptyText}>
                  {search.trim() ? "لا توجد محلات مطابقة للبحث" : "لا توجد محلات في هذا القسم بعد"}
                </AppText>
              )
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { flexGrow: 1, paddingBottom: space.lg },
  searchWrapper: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    backgroundColor: "#FFFFFF",
  },
  search: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
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
  row: { justifyContent: "space-between" },
  shopWrapper: { borderRadius: radius.lg, overflow: "hidden", width: "49%" },
  emptyText: { textAlign: "center" },
});