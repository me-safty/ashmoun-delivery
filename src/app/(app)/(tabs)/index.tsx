import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { AppText } from "@/components/app-text";
import { CartBar } from "@/components/cart-bar";
import { fonts, radius, space } from "@/theme";

const ORANGE = "#F26A1B";
const DARK = "#48240C"; // decorative silhouettes on the header
const LIME = "#E4F222";
const TILE_BG = "#F7F2EA";


const CATEGORIES: { key: string; label: string; icon: number }[] = [
  { key: "restaurants", label: "المطاعم", icon: require("@/assets/images/icon-hamburger.png") },
  { key: "groceries", label: "البقالة", icon: require("@/assets/images/icon-shopping-cart.png") },
  { key: "pharmacy", label: "صيدليات", icon: require("@/assets/images/icon-pill.png") },
];

type HeaderShape = {
  // "ion" for Ionicons, "mdc" for MaterialCommunityIcons
  family: "ion" | "mdc";
  icon: string;
  size: number;
  top: number;
  right?: number;
  left?: number;
  rotate: number;
};

// Decorative dark shapes scattered across the orange header — one per service line:
// a sandwich with a drink, a grocery cart, and medicine.
const HEADER_SHAPES: HeaderShape[] = [
  { family: "ion", icon: "fast-food", size: 56, top: -10, right: 132, rotate: 12 },
  { family: "mdc", icon: "cart-variant", size: 54, top: -4, right: 24, rotate: -10 },
  { family: "mdc", icon: "medical-bag", size: 50, top: -8, left: 44, rotate: -16 },
];

// Wave circles that bite into the bottom edge of the orange header.
const WAVE_COUNT = 9;

export default function Home() {
  const addresses = useQuery(api.addresses.mine);
  const categories = useQuery(api.catalog.categories);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [bannerPage, setBannerPage] = useState(0);
  const { width } = useWindowDimensions();
  const bannerWidth = Math.min(width, 480) - space.lg * 2 - 24;
  const bannerStep = bannerWidth + space.sm;
  const address = addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  const openCategory = (key: string) => {
    // "طلبات مارت" has no category in the DB yet; fall back to the categories screen.
    const tile = CATEGORIES.find((c) => c.key === key);
    const match = categories?.find((c) => tile && fuzzySameName(tile.label, c.name));
    if (match) {
      router.push({ pathname: "/category/[id]", params: { id: match._id } });
    } else {
      router.navigate("/categories");
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {/* Full-bleed orange header with decorative shapes, search, and the wavy bottom edge */}
        <View style={styles.orangeHeader}>
          {HEADER_SHAPES.map((s) => {
            const position = {
              position: "absolute" as const,
              top: s.top,
              transform: [{ rotate: `${s.rotate}deg` }],
              ...(s.right != null ? { right: s.right } : { left: s.left }),
            };
            const Icon = s.family === "ion" ? Ionicons : MaterialCommunityIcons;
            return <Icon key={s.icon} name={s.icon as any} size={s.size} color={DARK} style={position} />;
          })}
          <Pressable style={styles.locationRow} onPress={() => router.navigate("/profile")}>
            <Ionicons name="chevron-down" size={16} color="#fff" />
            <AppText style={styles.locationText} numberOfLines={1}>
              التوصيل إلى {address ? address.label : "جمال عبد الناصر"}
            </AppText>
          </Pressable>
          <View style={[styles.search, searchFocused && styles.searchFocused]}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              accessibilityLabel="ابحث عن الطعام"
              placeholder="ابحث عن الطعام"
              placeholderTextColor="#999"
              returnKeyType="search"
              clearButtonMode="while-editing"
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={[styles.searchInput, webNoOutline]}
            />
          </View>
          <View style={styles.blackFriday}>
            <AppText style={styles.blackFridayText}>بلاك فريداي</AppText>
          </View>
          <View pointerEvents="none" style={styles.wave}>
            {Array.from({ length: WAVE_COUNT }, (_, i) => (
              <View key={i} style={styles.waveDot} />
            ))}
          </View>
        </View>

        {/* 3D-style category tiles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              style={styles.catItem}
              accessibilityRole="button"
              onPress={() => openCategory(c.key)}>
              <View style={styles.catTile}>
                <Image source={c.icon} style={styles.catIcon} contentFit="contain" />
              </View>
              <AppText style={styles.catLabel}>{c.label}</AppText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Promo banner carousel */}
        <View style={styles.bannerWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={bannerStep}
            decelerationRate="fast"
            contentContainerStyle={styles.bannerRow}
            onScroll={(e) =>
              setBannerPage(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / bannerStep))
            }
            scrollEventThrottle={100}>
            <View style={[styles.banner, styles.bannerFlash, { width: bannerWidth }]}>
              <View style={styles.flashFood}>
                <AppText style={styles.flashEmojiTop}>🍕 🍔</AppText>
                <AppText style={styles.flashEmojiBottom}>🍟 🥤</AppText>
                <View style={styles.flashBadge}>
                  <AppText style={styles.flashBadgeText}>🕒 FLASH SALE</AppText>
                </View>
              </View>
              <View style={styles.flashTextBlock}>
                <AppText style={styles.flashText}>عروض</AppText>
                <AppText style={styles.flashText}>يوم الاثنين</AppText>
                <View style={styles.flashChip}>
                  <AppText style={styles.flashChipText}>خصم</AppText>
                </View>
                <AppText style={styles.flashText}>لحد 50%</AppText>
                <AppText style={styles.flashNote}>* تطبق الشروط والأحكام</AppText>
              </View>
            </View>
            <View style={[styles.banner, styles.bannerBlack, { width: bannerWidth }]}>
              <View style={styles.bfBody}>
                <AppText style={styles.bfGifts}>🎁 🛍️</AppText>
                <View style={styles.bfRibbon}>
                  <AppText style={styles.bfRibbonText}>BLACK FRIDAY</AppText>
                </View>
                <AppText style={styles.bfText}>خصومات تخطف العرض</AppText>
              </View>
            </View>
            <View style={[styles.banner, styles.bannerWelcome, { width: bannerWidth }]}>
              <View style={styles.welcomeBody}>
                <AppText style={styles.welcomeEmoji}>🛵</AppText>
                <View style={styles.welcomeTextBlock}>
                  <AppText style={styles.welcomeTitle}>أهلاً فيك في أشمن</AppText>
                  <AppText style={styles.welcomeText}>توصيل مجاني لأول طلب ليك</AppText>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, bannerPage % 3 === i && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="title" style={styles.useSaveTitle}>
            استخدم ووفر
          </AppText>
        </View>
      </ScrollView>

      {/* Pinned ticker glued above the tab bar footer */}
      <View style={styles.ticker}>
        <View style={styles.tickerChip}>
          <AppText style={styles.tickerChipText}>توصيل مجاني</AppText>
        </View>
        <AppText style={styles.tickerText}>توصيل مجاني لأول طلب</AppText>
        <View style={styles.tickerSpacer} />
        <Ionicons name="chevron-up" size={18} color="#fff" />
      </View>
      <CartBar />
    </SafeAreaView>
  );
}

const webNoOutline: object = Platform.OS === "web" ? { outlineStyle: "none" } : {};

// Match a home tile label to a DB category name, tolerating "ال" prefixes,
// ة/ى spelling and one inserted/removed letter ("صيدليات" vs "صيديليات").
function fuzzySameName(label: string, name: string) {
  const base = (s: string) => s.replace(/^ال/, "").replace(/ة/g, "ه").replace(/ى/g, "ي");
  const a = base(label);
  const b = base(name);
  if (a === b) return true;
  if (Math.abs(a.length - b.length) !== 1) return false;
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
  let j = 0;
  for (let i = 0; i < longer.length && j <= shorter.length; i++) {
    if (longer[i] === shorter[j]) j++;
  }
  return j === shorter.length;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  list: { paddingBottom: 64 },
  // Header
  orangeHeader: {
    backgroundColor: ORANGE,
    paddingBottom: 34,
    gap: space.md,
    paddingHorizontal: space.lg,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: space.xs, marginTop: 14, alignSelf: "center" },
  locationText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  search: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderRadius: radius.pill,
    backgroundColor: "#fff",
    paddingHorizontal: space.lg,
  },
  searchFocused: { borderWidth: 2, borderColor: "#141414" },
  searchInput: { flex: 1, minHeight: 46, fontFamily: fonts.medium, fontSize: 15, color: "#000", textAlign: "right" },
  blackFriday: { alignItems: "center", paddingVertical: space.sm },
  blackFridayText: { color: LIME, fontWeight: "900", fontSize: 30, lineHeight: 44 },
  wave: {
    position: "absolute",
    bottom: -18,
    left: -20,
    right: -20,
    height: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  waveDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff" },
  // Categories
  catRow: { gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.lg },
  catItem: { width: 92, alignItems: "center" },
  catTile: {
    width: 84,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: TILE_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  catIcon: { width: 52, height: 52 },
  catLabel: { fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 6 },
  // Banner carousel
  bannerWrap: { marginTop: space.sm },
  bannerRow: { paddingHorizontal: space.lg, gap: space.sm },
  banner: {
    borderRadius: radius.lg,
    overflow: "hidden",
    minHeight: 170,
    flexDirection: "row",
    padding: space.md,
  },
  bannerFlash: { backgroundColor: ORANGE },
  bannerBlack: { backgroundColor: "#141414" },
  bannerWelcome: { backgroundColor: "#FFF3E0" },
  // Flash banner
  flashFood: {
    flex: 1,
    backgroundColor: "#F3EDE3",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  flashEmojiTop: { fontSize: 34, lineHeight: 46, transform: [{ rotate: "-6deg" }] },
  flashEmojiBottom: { fontSize: 30, lineHeight: 42, transform: [{ rotate: "5deg" }], marginTop: -4 },
  flashBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FF7A1F",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: "-10deg" }],
    borderWidth: 2,
    borderColor: "#fff",
  },
  flashBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  flashTextBlock: { width: 132, alignItems: "center", gap: 2, justifyContent: "center" },
  flashText: { color: "#fff", fontWeight: "900", fontSize: 20, lineHeight: 30, textAlign: "center" },
  flashChip: { backgroundColor: "#141414", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  flashChipText: { color: LIME, fontWeight: "900", fontSize: 18 },
  flashNote: { color: "rgba(255,255,255,0.85)", fontSize: 9, marginTop: 4 },
  // Black Friday banner
  bfBody: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.sm },
  bfGifts: { fontSize: 30, lineHeight: 42, transform: [{ rotate: "-8deg" }] },
  bfRibbon: {
    backgroundColor: ORANGE,
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    transform: [{ rotate: "-8deg" }],
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#5A2B0D",
  },
  bfRibbonText: { color: "#fff", fontWeight: "900", fontSize: 20, letterSpacing: 2 },
  bfText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  // Welcome banner
  welcomeBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.md, justifyContent: "center" },
  welcomeEmoji: { fontSize: 40, lineHeight: 54 },
  welcomeTextBlock: { gap: 2, alignItems: "flex-start" },
  welcomeTitle: { fontWeight: "800", fontSize: 18 },
  welcomeText: { color: "#5F564F", fontSize: 13 },
  // Dots
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: space.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D9D9D9" },
  dotActive: { backgroundColor: "#141414" },
  // Sections
  sectionHeader: { paddingHorizontal: space.lg, marginTop: space.md, marginBottom: space.lg },
  useSaveTitle: { fontWeight: "900" },
  // Pinned ticker above the tab bar
  ticker: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: ORANGE,
    paddingVertical: 10,
    paddingHorizontal: space.md,
  },
  tickerChip: { backgroundColor: "#141414", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tickerChipText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  tickerText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  tickerSpacer: { flex: 1 },
});
