import { router } from "expo-router";
import { Pressable, StyleSheet, View, Image } from "react-native";
import type { Doc } from "@/convex/_generated/dataModel";
import { colors, formatPrice, radius, space } from "@/theme";
import { AppText } from "./app-text";
import { EmojiTile } from "./emoji-tile";

export function ShopCard({ shop, now }: { shop: Doc<"shops"> & { kind?: string }; now: number }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: "/shop/[id]", params: { id: shop._id } })}
      style={styles.card}>
      <View style={styles.imageContainer}>
        {shop.imageUrl ? (
          <Image
            source={{ uri: shop.imageUrl }}
            style={styles.cardImage}
            resizeMode="contain"
          />
        ) : (
          <EmojiTile emoji={shop.emoji} tint={shop.tint} size={140} />
        )}
      </View>
      <View style={styles.body}>
        <AppText variant="subtitle" numberOfLines={1} style={styles.name}>
          {shop.name}
        </AppText>

        <AppText variant="caption" tone="muted">
          {shop.kind}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 0,
  },
  body: { gap: space.xs, alignItems: "center", width: "100%" },
  name: { fontWeight: "700", textAlign: "center" },
});
