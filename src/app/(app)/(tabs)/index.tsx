import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isShopOpen } from "@/convex/lib/hours";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { CartBar } from "@/components/cart-bar";
import { ShopCard } from "@/components/shop-card";
import { useNow } from "@/lib/use-now";
import { colors, fonts, formatPrice, radius, space } from "@/theme";

export default function Home() {
  const now = useNow();
  const me = useQuery(api.users.me);
  const addresses = useQuery(api.addresses.mine);
  const categories = useQuery(api.catalog.categories);
  const shops = useQuery(api.catalog.shops, {});
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(null);
  const [search, setSearch] = useState("");
  const address = addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  const visibleShops = useMemo(() => {
    const term = normalizeSearch(search.trim());
    return (shops ?? [])
      .filter((s) => (categoryId ? s.categoryId === categoryId : true))
      .filter((s) => (term ? normalizeSearch(`${s.name} ${s.description}`).includes(term) : true))
      .sort((a, b) => Number(isShopOpen(b, now)) - Number(isShopOpen(a, now)));
  }, [shops, categoryId, search, now]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={visibleShops}
        keyExtractor={(shop) => shop._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ShopCard shop={item} now={now} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <AppText variant="caption" tone="muted">
                التوصيل إلى {address ? `${address.label} · ${address.zoneName}` : "..."}
              </AppText>
              <AppText variant="title">أهلاً {me?.name} 👋</AppText>
              {address ? (
                <AppText variant="caption" tone="primary">
                  رسوم التوصيل {formatPrice(address.deliveryFee)}
                </AppText>
              ) : null}
            </View>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.faint} />
              <TextInput
                accessibilityLabel="دور على مطعم أو محل"
                placeholder="دور على مطعم أو محل"
                placeholderTextColor={colors.faint}
                returnKeyType="search"
                clearButtonMode="while-editing"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="الكل" selected={categoryId === null} onPress={() => setCategoryId(null)} />
              {categories?.map((c) => (
                <Chip
                  key={c._id}
                  label={`${c.emoji} ${c.name}`}
                  selected={categoryId === c._id}
                  onPress={() => setCategoryId(c._id)}
                />
              ))}
            </ScrollView>
            <View style={styles.sectionRow}>
              <AppText variant="subtitle">المحلات</AppText>
              <Link href="/categories">
                <AppText variant="caption" tone="primary">
                  كل الأقسام
                </AppText>
              </Link>
            </View>
          </View>
        }
        ListEmptyComponent={
          shops === undefined ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <AppText style={styles.emptyEmoji}>🔍</AppText>
              <AppText tone="muted">مفيش محلات مطابقة</AppText>
              <Button
                kind="secondary"
                label="امسح البحث"
                onPress={() => {
                  setSearch("");
                  setCategoryId(null);
                }}
              />
            </View>
          )
        }
      />
      <CartBar />
    </SafeAreaView>
  );
}

// Matches أحمد/احمد, مدرسة/مدرسه, على/علي and Latin case.
function normalizeSearch(text: string) {
  return text.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <AppText variant="caption" tone={selected ? "onPrimary" : "ink"}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: space.lg, paddingBottom: 96, gap: space.md },
  header: { gap: space.lg },
  search: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    outlineWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    // Native RTL already aligns inputs to the right; web inputs use dir="auto".
    textAlign: Platform.OS === "web" ? "right" : undefined,
  },
  chips: { gap: space.sm },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xl },
  emptyEmoji: { fontSize: 40, lineHeight: 56 },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
