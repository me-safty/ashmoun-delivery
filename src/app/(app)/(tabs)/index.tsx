import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { CartBar } from "@/components/cart-bar";
import { CategoryArt } from "@/components/category-art";
import { api } from "@/convex/_generated/api";
import { fonts, radius, space } from "@/theme";
import { useResponsive } from "@/lib/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const ORANGE = "#F26A1B";
const DARK = "#48240C"; // decorative silhouettes on the header
const LIME = "#E4F222";


type HeaderShape = {
  icon: ComponentProps<typeof Ionicons>["name"];
  size: number;
  top: number;
  right?: number;
  left?: number;
  rotate: number;
};

// Decorative dark shapes scattered across the orange header — one per service line:
// a sandwich with a drink, a grocery cart, and a flower.
const HEADER_SHAPES: HeaderShape[] = [
  { icon: "fast-food-outline", size: 90, top: -12, right: 132, rotate: 12 },
  { icon: "cart-outline", size: 90, top: -6, right: 24, rotate: -10 },
  { icon: "flower-outline", size: 90, top: -10, left: 44, rotate: -14 },
];

// Wave circles that bite into the bottom edge of the orange header.
// const WAVE_COUNT = 9;

const SEARCH_WORDS = ["طعام", "بقالة", "وجبات خفيفة", "المزيد"];

export default function Home() {
  const addresses = useQuery(api.addresses.mine);
  const categories = useQuery(api.catalog.categories);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [bannerPage, setBannerPage] = useState(0);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoProgress] = useState(() => new Animated.Value(0));
  const [placeholder, setPlaceholder] = useState(`ابحث عن ${SEARCH_WORDS[0]}`);
  const { width, isWebPhone } = useResponsive();
  const bannerWidth = Math.min(width, 480) - space.lg * 2 - 24;
  const bannerStep = bannerWidth + space.sm;
  const address = addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  useEffect(() => {
    let wordIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const prefix = "ابحث عن ";
    const TYPING_MS = 55;
    const ERASING_MS = 30;
    // Hold the finished word long enough to read it.
    const READ_PAUSE_MS = 1800;

    const typeNextWord = () => {
      const nextWord = SEARCH_WORDS[wordIndex % SEARCH_WORDS.length];
      wordIndex += 1;
      let charCount = 0;
      setPlaceholder(prefix);
      intervalId = setInterval(() => {
        charCount += 1;
        if (charCount <= nextWord.length) {
          setPlaceholder(prefix + nextWord.slice(0, charCount));
        } else {
          if (intervalId) clearInterval(intervalId);
          timeoutId = setTimeout(eraseCurrentWord, READ_PAUSE_MS);
        }
      }, TYPING_MS);
    };

    const eraseCurrentWord = () => {
      const currentWord = SEARCH_WORDS[(wordIndex - 1 + SEARCH_WORDS.length) % SEARCH_WORDS.length];
      let text = currentWord;
      intervalId = setInterval(() => {
        if (text.length === 0) {
          if (intervalId) clearInterval(intervalId);
          // Back-to-back: the next word starts typing the moment the old one is gone.
          typeNextWord();
        } else {
          text = text.slice(0, -1);
          setPlaceholder(prefix + text);
        }
      }, ERASING_MS);
    };

    timeoutId = setTimeout(typeNextWord, 1200);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // The free-delivery ticker opens a sheet that grows out of it, upwards.
  const openPromo = useCallback(() => {
    setPromoOpen(true);
    Animated.timing(promoProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [promoProgress]);

  const closePromo = useCallback(() => {
    Animated.timing(promoProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setPromoOpen(false);
    });
  }, [promoProgress]);

  // Android back closes the sheet instead of leaving the screen.
  useEffect(() => {
    if (!promoOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closePromo();
      return true;
    });
    return () => sub.remove();
  }, [promoOpen, closePromo]);

  // Categories come straight from the catalog, so the row always matches the DB (and its order).
  const sections = categories ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.list, Platform.OS === "web" && styles.listWeb]} showsVerticalScrollIndicator={false}>
        {/* Full-bleed orange header with decorative shapes, search, and the wavy bottom edge */}
        <View style={styles.orangeHeader}>
          {HEADER_SHAPES.map((s) => (
            <Ionicons
              key={s.icon}
              name={s.icon}
              size={s.size}
              color={DARK}
              style={{
                position: "absolute",
                top: s.top,
                transform: [{ rotate: `${s.rotate}deg` }],
                ...(s.right != null ? { right: s.right } : { left: s.left }),
              }}
            />
          ))}
          <Pressable
            style={[styles.locationRow, isWebPhone && styles.locationRowWebPhone]}
            onPress={() => router.navigate("/profile")}>
              <AppText style={styles.locationLabel}>التوصيل إلى </AppText>
              <AppText style={styles.locationArea}>{address ? address.zoneName : "اختر المنطقة"}</AppText>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </Pressable>
          <View style={[styles.search, searchFocused && styles.searchFocused]}>
            <Ionicons name="search" size={20} color="#333" />
            <TextInput
              accessibilityLabel="ابحث عن الطعام"
              placeholder={placeholder}
              placeholderTextColor="#1a1a1a"
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
            <AppText style={styles.blackFridayText}>
              <AppText style={styles.blackFridayWhite}>كل ما تريد</AppText> على التطبيق
            </AppText>
          </View>
          {/* Wave separator: the header ends in a smooth white wave that leads into the page. */}
          <View pointerEvents="none" style={styles.svgWaveWrapper}>
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 375 40"
              preserveAspectRatio="none"
              style={styles.svgWave}
            >
              <Path
                d="M 0 18 C 20.8 6, 41.7 6, 62.5 18 C 83.3 30, 104.2 30, 125 18 C 145.8 6, 166.7 6, 187.5 18 C 208.3 30, 229.2 30, 250 18 C 270.8 6, 291.7 6, 312.5 18 C 333.3 30, 354.2 30, 375 18 L 375 40 L 0 40 Z"
                fill="#fff"
              />
            </Svg>
          </View>
        </View>

        {/* Order sections — every category in the DB, read right-to-left in its stored order. */}
        {sections.length > 0 ? (
          <View style={styles.quickLinks}>
            {sections.map((c) => (
              <Pressable
                key={c._id}
                accessibilityRole="button"
                accessibilityLabel={c.name}
                style={styles.quickLink}
                onPress={() => router.push({ pathname: "/category/[id]", params: { id: c._id } })}>
                <View style={styles.quickLinkCircle}>
                  <CategoryArt name={c.name} emoji={c.emoji} size={60} />
                </View>
                <AppText style={styles.quickLinkLabel} numberOfLines={1}>
                  {c.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

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
                  <AppText style={styles.flashText}>حتى 50%</AppText>
                  <AppText style={styles.flashNote}>* تُطبَّق الشروط والأحكام</AppText>
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
                    <AppText style={styles.welcomeTitle}>مرحبًا بك في أشمون</AppText>
                    <AppText style={styles.welcomeText}>توصيل مجاني لطلبك الأول</AppText>
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
      </ScrollView>

      {/* Pinned free-delivery ticker glued above the tab bar footer. Tapping it grows the promo sheet upwards. */}
      <Pressable
        style={styles.ticker}
        accessibilityRole="button"
        accessibilityState={{ expanded: promoOpen }}
        onPress={promoOpen ? closePromo : openPromo}>
        <View style={styles.tickerContent}>
          <View style={styles.tickerChip}>
            <AppText style={styles.tickerChipText}>توصيل مجاني</AppText>
          </View>
          <View style={styles.tickerMessage}>
            <AppText style={styles.tickerText} numberOfLines={2}>
              لأول طلب داخل مركز بركة السبع
            </AppText>
            <Ionicons
              name={promoOpen ? "chevron-down" : "chevron-up"}
              size={18}
              color="#fff"
            />
          </View>
        </View>
      </Pressable>

      {promoOpen ? (
        <View style={styles.promoLayer}>
          <Animated.View
            style={[
              styles.promoScrim,
              { opacity: promoProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }) },
            ]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              accessibilityLabel="إغلاق عرض التوصيل المجاني"
              onPress={closePromo}
            />
          </Animated.View>

          {/* Full-width sheet pinned to the bottom edge, covering the ticker underneath. */}
          <Animated.View
            style={[
              styles.promoSheet,
              {
                opacity: promoProgress,
                transform: [
                  {
                    translateY: promoProgress.interpolate({ inputRange: [0, 1], outputRange: [360, 0] }),
                  },
                ],
              },
            ]}>
            {/* Decorative only: dragging or pressing the handle must not dismiss the sheet. */}
            <View pointerEvents="none" style={styles.promoHandle} />
            <Pressable
              onPress={closePromo}
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              hitSlop={10}
              style={styles.promoClose}>
              <Ionicons name="close" size={16} color="#48240C" />
            </Pressable>
            <View style={styles.promoTitleWrap}>
              <AppText style={styles.promoTitle}>توصيل مجاني لأول طلب داخل مركز بركة السبع</AppText>
            </View>
            <Button
              label="اطلب الآن"
              onPress={() => {
                closePromo();
                router.navigate("/categories");
              }}
            />
          </Animated.View>
        </View>
      ) : null}

      <CartBar />
    </View>
  );
}

const webNoOutline: object = Platform.OS === "web" ? { outlineStyle: "none" } : {};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  list: { paddingBottom: 94 },
  listWeb: { paddingBottom: 78 },
  // Header
  orangeHeader: {
    backgroundColor: ORANGE,
    // Room for the wave band so the content never sits inside it (kept tight on purpose).
    paddingBottom: 18,
    gap: space.md,
    paddingHorizontal: space.lg,
    overflow: "visible",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: space.xs, marginTop: 50, alignSelf: "flex-start" },
  locationRowWebPhone: { marginTop: 20 },
  locationLabel: { color: "#fff", fontWeight: "400", fontSize: 22, textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  locationArea: { color: "#fff", fontWeight: "900", fontSize: 22, textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
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
  blackFridayWhite: { color: "#fff", fontWeight: "900", fontSize: 30, lineHeight: 44 },
  svgWaveWrapper: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 26,
  },
  svgWave: {
    width: "100%",
    height: "100%",
  },
  // Order sections — quick category shortcuts above the offers.
  // The app is RTL (dir="rtl" / forcesRTL), so a plain "row" already starts at the right edge.
  quickLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: space.sm,
    marginTop: space.lg,
    marginBottom: space.xs,
    paddingHorizontal: space.lg,
  },
  quickLink: { alignItems: "center", gap: 6, minWidth: 72 },
  quickLinkCircle: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#F7F2EA",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quickLinkLabel: { color: "#48240C", fontWeight: "800", fontSize: 13, textAlign: "center" },
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
    justifyContent: "center",
    backgroundColor: ORANGE,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    paddingBottom: Platform.OS === "ios" ? 16 : Platform.OS === "web" ? 8 : 12,
  },
  tickerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  tickerMessage: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  tickerChip: { backgroundColor: "#311419", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tickerChipText: { color: "#ffff00", fontWeight: "800", fontSize: 16 },
  tickerText: { color: "#fff", fontWeight: "700", fontSize: 15, lineHeight: 22, flexShrink: 1 },
  tickerSpacer: { flex: 1 },
  // Free-delivery sheet that grows out of the ticker
  promoLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  promoScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#141414" },
  promoSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: 14,
    paddingBottom: space.xl,
    gap: space.sm,
    shadowColor: "#141414",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  promoHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E3DED8", alignSelf: "center" },
  promoClose: {
    position: "absolute",
    top: 8,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D9CFC3",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  promoTitleWrap: {
    alignSelf: "flex-start",
    marginTop: space.lg,
    backgroundColor: "#311419",
    borderRadius: 12,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.xs,
  },
  promoTitle: { color: "#ffff00", fontWeight: "900", fontSize: 19, lineHeight: 28 },
  promoBody: { color: "#5F564F", fontSize: 14, lineHeight: 22, marginBottom: space.xs },
});
