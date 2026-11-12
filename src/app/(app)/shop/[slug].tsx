import { AppText } from "@/components/app-text";
import { CART_BAR_SPACE, CartBar } from "@/components/cart-bar";
import { EmojiTile } from "@/components/emoji-tile";
import { ShopReviews } from "@/components/shop-reviews";
import { shopState, ShopStatusBadge, todayHoursLabel } from "@/components/shop-status";
import { Unavailable } from "@/components/unavailable";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/lib/cart";
import { useNow } from "@/lib/use-now";
import { colors, fonts, formatPrice, radius, space } from "@/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const ORANGE = colors.orange;
const THUMB_SIZE = 56;

type TabKey = "menu" | "reviews" | "info";
type Product = {
  _id: string;
  name: string;
  description: string;
  emoji: string;
  imageUrl?: string;
  available: boolean;
  optionGroups: { min: number; max: number; key: string }[];
  price: number;
  discountPercent?: number;
};
type Section = { _id: string; name: string; products: Product[] };

const TABS: { key: TabKey; label: string }[] = [
  { key: "menu", label: "قائمة الطعام" },
  { key: "reviews", label: "تقييم المطعم" },
  { key: "info", label: "معلومات المطعم" },
];

export default function Shop() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const now = useNow();
  const cart = useCart();
  const data = useQuery(api.catalog.shopBySlug, { slug });

  const [tab, setTab] = useState<TabKey>("menu");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleCategory = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isExpanded = useCallback((id: string) => expanded.has(id), [expanded]);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const createRequest = useMutation(api.pharmacyRequests.create);
  const uploadImageAction = useAction(api.pharmacyRequests.uploadImage);

  const pickImage = useCallback(async (source: "camera" | "library" = "library") => {
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.granted !== true) {
        Alert.alert("لا يمكن الوصول للكاميرا", "الرجاء منح إذن الكاميرا من إعدادات الجهاز.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.granted !== true) {
        Alert.alert("لا يمكن الوصول للمعرض", "الرجاء منح إذن المعرض من إعدادات الجهاز.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
    }
  }, []);

  const submitRequest = useCallback(
    async (shopId: Id<"shops">) => {
      if (submitting) return;
      const hasImage = imageUri !== null;
      const text = description.trim();
      if (!hasImage && text.length === 0) {
        Alert.alert("الرجاء كتابة ما تحتاجه أو رفع صورة");
        return;
      }
      setSubmitting(true);
      try {
        let imageStorageId: Id<"_storage"> | undefined;
        if (hasImage && imageUri) {
          const response = await fetch(imageUri);
          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const imageBase64 = btoa(binary);
          const blob = await response.blob();
          imageStorageId = await uploadImageAction({
            imageBase64,
            imageMimeType: blob.type ?? "image/jpeg",
          });
        }
        await createRequest({
          shopId,
          description: text,
          imageStorageId,
        });
        setSubmitted(true);
      } catch (error) {
        Alert.alert(
          "فشل الإرسال",
          error instanceof Error ? error.message : "حاول مرة أخرى لاحقًا",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, imageUri, description, createRequest],
  );

  const q = query.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!data?.sections) return [];
    return (data.sections as Section[])
      .map((section) => {
        const products = q === ""
          ? section.products
          : section.products.filter(
              (p) =>
                p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
            );
        return { ...section, products };
      })
      .filter((section) => section.products.length > 0);
  }, [data, q]);

  const addToCart = useCallback(
    (shopId: Id<"shops">, shopName: string, item: Product) => {
      const hasRequired = item.optionGroups.some((g) => g.min > 0);
      if (hasRequired || !item.available) {
        router.push({ pathname: "/product/[id]", params: { id: item._id } });
        return;
      }
      cart.add(
        { id: shopId, name: shopName },
        {
          productId: item._id as Id<"products">,
          name: item.name,
          emoji: item.emoji,
          optionsLabel: "",
          selections: [],
          unitPrice: item.price,
          quantity: 1,
        },
      );
    },
    [cart],
  );

  if (data === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (data === null) return <Unavailable message="هذا المحل غير متاح حاليًا" />;

  const { shop } = data;
  const state = shopState(shop, now);
  const isPharmacy = data.category?.slug === "pharmacies";

  const currentPrice = (price: number, discountPercent?: number) => {
    const discount = discountPercent ?? 0;
    return discount > 0 ? price * (1 - discount / 100) : price;
  };

  const renderProductRow = (item: Product) => {
    const discount = item.discountPercent ?? 0;
    const price = currentPrice(item.price, discount);
    const hasRequired = item.optionGroups.some((g) => g.min > 0);

    return (
      <Pressable
        key={item._id}
        accessibilityRole="link"
        disabled={!item.available}
        onPress={() =>
          !item.available || hasRequired
            ? router.push({ pathname: "/product/[id]", params: { id: item._id } })
            : null
        }
        style={styles.productRow}>
        {/* Right section – product image */}
        <View style={styles.imageWrap}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="contain" />
          ) : (
            <EmojiTile emoji={item.emoji} tint={shop.tint} size={THUMB_SIZE} />
          )}
        </View>
        {/* Middle section – product information */}
        <View style={styles.info}>
          <AppText variant="subtitle" tone="ink" style={styles.name} numberOfLines={2}>
            {item.name}
          </AppText>
          {item.description ? (
            <AppText variant="caption" tone="muted" style={styles.desc} numberOfLines={2}>
              {item.description}
            </AppText>
          ) : null}
        </View>
        {/* Left section – price and add to cart */}
        <View style={styles.priceColumn}>
          <AppText variant="caption" tone="muted" style={styles.currency}>
            EGP
          </AppText>
          <AppText variant="subtitle" tone="ink" style={[styles.price, { fontFamily: fonts.bold }]}>
            {formatPrice(price)}
          </AppText>
          {discount > 0 ? (
            <AppText
              variant="caption"
              tone="muted"
              style={[styles.originalPrice, { textDecorationLine: "line-through" }]}
            >
              {formatPrice(item.price)}
            </AppText>
          ) : null}
          <Pressable
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel={`إضافة ${item.name}`}
            disabled={!item.available}
            onPress={(e) => {
              e.stopPropagation();
              addToCart(shop._id, shop.name, item);
            }}>
            <AppText variant="subtitle" tone="onPrimary" style={styles.addIcon}>
              +
            </AppText>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderCategory = (section: Section) => {
    const open = isExpanded(section._id);
    return (
      <View key={section._id} style={styles.categoryWrapper}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          style={styles.categoryHeader}
          onPress={() => toggleCategory(section._id)}>
          <AppText variant="subtitle" tone="ink" style={styles.categoryTitle} numberOfLines={1}>
            {section.name}
          </AppText>
          <View style={[styles.chevronWrap, { transform: [{ rotate: `${open ? 180 : 0}deg` }] }]}>
            <Ionicons name="chevron-down" size={20} color={colors.muted} />
          </View>
        </Pressable>
        {open && (
          <View style={styles.content}>
            {section.products.map((item) => renderProductRow(item))}
          </View>
        )}
      </View>
    );
  };

  const renderMenu = () => (
    <View style={styles.menuList}>
      {filteredSections.map((section) => (
        <View key={section._id}>{renderCategory(section)}</View>
      ))}
      {filteredSections.length === 0 && (
        <AppText variant="body" tone="muted" style={styles.empty}>
          لا توجد أصناف مطابقة للبحث
        </AppText>
      )}
    </View>
  );

  const renderPharmacyRequest = () => {
    const disabled = submitting || (imageUri === null && description.trim().length === 0);
    if (submitted) {
      return (
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} style={styles.successIcon} />
          <AppText variant="subtitle" tone="success" style={styles.successTitle}>
            تم إرسال طلبك
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.successText}>
            طلبك إلى {shop.name} قيد الانتظار، وسيتم التواصل معك لتحديد موعد التوصيل.
          </AppText>
        </View>
      );
    }
    return (
      <View style={styles.requestCard}>
        <AppText variant="subtitle" tone="ink" style={styles.requestTitle}>
          أرسل طلبك إلى {shop.name}
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.requestHint}>
          اكتب ما تحتاجه أو ارفق صورة للروشتة الطبية.
        </AppText>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.requestInput}
            placeholder="اكتب ما تحتاجه ..."
            value={description}
            onChangeText={setDescription}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <Pressable style={styles.cameraButton} accessibilityLabel="إرفاق صورة" onPress={() => pickImage()}>
            <Ionicons name="camera" size={20} color={colors.primary} />
          </Pressable>
        </View>
        {imageUri !== null && (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <Pressable style={styles.removeButton} accessibilityLabel="إزالة الصورة" onPress={() => setImageUri(null)}>
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>
        )}
        <Pressable
          style={[styles.submitButton, disabled && styles.submitButtonDisabled]}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => submitRequest(shop._id)}>
          <AppText variant="subtitle" tone="onPrimary" style={styles.submitLabel}>
            {submitting ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </AppText>
        </Pressable>
      </View>
    );
  };

  const renderInfo = () => (
    <View style={styles.infoSection}>
      <AppText variant="title" style={[styles.infoTitle, { fontFamily: fonts.bold }]}>
        معلومات المطعم
      </AppText>
      {shop.description ? (
        <AppText variant="body" tone="muted" style={styles.infoText} numberOfLines={4}>
          {shop.description}
        </AppText>
      ) : null}
      <View style={styles.infoRow}>
        <AppText variant="caption" tone="muted" style={styles.infoLabel}>
          وقت التجهيز
        </AppText>
        <AppText variant="caption" tone="ink" style={styles.infoValue}>
          {shop.prepMinutes ? `${shop.prepMinutes} دقيقة` : "غير محدد"}
        </AppText>
      </View>
      <View style={styles.infoRow}>
        <AppText variant="caption" tone="muted" style={styles.infoLabel}>
          الحالة
        </AppText>
        <AppText variant="caption" tone="ink" style={styles.infoValue}>
          {state === "open" ? "مفتوح" : state === "closed" ? "مغلق" : "متوقف مؤقتًا"}
        </AppText>
      </View>
      <View style={styles.infoRow}>
        <AppText variant="caption" tone="muted" style={styles.infoLabel}>
          مواعيد العمل اليوم
        </AppText>
        <AppText variant="caption" tone="ink" style={styles.infoValue}>
          {todayHoursLabel(shop, now)}
        </AppText>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: shop.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.bold, color: colors.ink },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.shopHeader}>
          {shop.imageUrl ? (
            <Image source={{ uri: shop.imageUrl }} style={styles.headerImage} />
          ) : (
            <EmojiTile emoji={shop.emoji} tint={colors.primarySoft} size={48} />
          )}
          <View style={styles.shopHeaderInfo}>
            <AppText variant="display" tone="ink" style={styles.shopTitle} numberOfLines={1}>
              {shop.name}
            </AppText>
            <View style={styles.shopMeta}>
              <ShopStatusBadge state={state} onTint />
              <AppText variant="caption" tone="muted" style={styles.shopHours}>
                · {todayHoursLabel(shop, now)}
              </AppText>
            </View>
            {shop.rating != null && (
              <AppText variant="caption" tone="primaryInk" style={styles.shopRating}>
                {shop.rating.toFixed(1)} ({shop.reviewsCount ?? 0} تقييم)
              </AppText>
            )}
          </View>
        </View>

        <View style={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.tab, active && styles.activeTab]}
                onPress={() => setTab(t.key)}>
                <AppText
                  variant="subtitle"
                  style={[
                    styles.tabText,
                    active && { color: colors.ink, fontFamily: fonts.bold },
                  ]}
                >
                  {isPharmacy && t.key === "menu" ? "طلب الدواء" : t.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {!isPharmacy && (
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="البحث عن أصناف"
              placeholderTextColor={colors.faint}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        )}

        {isPharmacy && tab === "menu"
          ? renderPharmacyRequest()
          : tab === "menu"
            ? renderMenu()
            : tab === "reviews"
              ? (
          <ShopReviews shopId={shop._id} rating={shop.rating} reviewsCount={shop.reviewsCount} />
      ) : (
          renderInfo()
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      <CartBar overSafeArea />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl },
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { paddingBottom: CART_BAR_SPACE + space.lg },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
    backgroundColor: colors.background,
  },
  headerImage: { width: 96, height: 96, borderRadius: radius.lg },
  shopHeaderInfo: { flex: 1 },
  shopTitle: { fontSize: 20, lineHeight: 28, fontFamily: fonts.bold },
  shopMeta: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.xs },
  shopHours: { color: colors.muted },
  shopRating: { marginTop: space.xs },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    backgroundColor: colors.background,
  },
  searchIcon: { marginLeft: space.xs },
  searchInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingRight: space.lg,
    paddingLeft: space.md,
    fontSize: 15,
    color: colors.ink,
    textAlign: "right",
  },
  categoryWrapper: {
    backgroundColor: colors.surface,
    marginHorizontal: space.lg,
    marginTop: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  categoryTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  chevronWrap: { alignItems: "center", justifyContent: "center" },
  content: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  imageWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: space.sm,
  },
  info: { flex: 1, textAlign: "right", marginHorizontal: space.sm },
  name: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  desc: { fontSize: 13, color: colors.muted, marginTop: 2 },
  priceColumn: { alignItems: "center", marginRight: space.sm },
  currency: { fontSize: 11, color: colors.muted },
  price: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  originalPrice: { fontSize: 12, color: colors.muted },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.xs,
  },
  addIcon: { fontSize: 18, lineHeight: 18 },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.sm },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginHorizontal: space.lg },
  empty: { textAlign: "center", paddingVertical: space.lg },
  menuList: { gap: 1 },
  bottomSpacer: { height: CART_BAR_SPACE + space.lg },
  infoSection: {
    padding: space.lg,
    backgroundColor: colors.background,
  },
  infoTitle: { fontSize: 18, marginBottom: space.md },
  infoText: { marginBottom: space.lg },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.muted },
  infoValue: { color: colors.ink },
  requestCard: {
    padding: space.lg,
    gap: space.md,
    backgroundColor: colors.background,
  },
  requestTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },
  requestHint: { fontSize: 14, color: colors.muted, lineHeight: 22 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  requestInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    color: colors.ink,
    textAlign: "right",
  },
  cameraButton: { padding: space.xs },
  previewWrap: {
    position: "relative",
    alignSelf: "center",
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  previewImage: { width: "100%", height: "100%" },
  removeButton: {
    position: "absolute",
    top: space.xs,
    right: space.xs,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  successCard: {
    alignItems: "center",
    paddingVertical: space.xxl,
    backgroundColor: colors.background,
  },
  successIcon: { marginBottom: space.md },
  successTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.successInk },
  successText: { fontSize: 14, color: colors.muted, textAlign: "center", marginHorizontal: space.lg },
  submitButton: {
    marginTop: space.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space.md,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitLabel: { fontSize: 16, fontFamily: fonts.bold, color: colors.onPrimary },
});
