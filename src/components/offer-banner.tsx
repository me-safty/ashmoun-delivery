import { AppText } from "@/components/app-text";
import { radius, space } from "@/theme";
import { StyleSheet, View } from "react-native";

type Props = {
  width: number;
  emoji: string;
  kicker: string;
  headline: string;
  note: string;
  // Card fill and the soft tint behind the emoji, so every offer keeps the same skeleton.
  background: string;
  artBackground: string;
};

/**
 * A lightweight promo card for the home carousel: one emoji block next to a short offer.
 * The carousel peeks the previous and next card in from the edges, so the card keeps its
 * content away from the very edges and stays the same height as its neighbours.
 */
export function OfferBanner({
  width,
  emoji,
  kicker,
  headline,
  note,
  background,
  artBackground,
}: Props) {
  return (
    <View style={[styles.card, { width, backgroundColor: background }]}>
      <View style={[styles.art, { backgroundColor: artBackground }]}>
        <AppText style={styles.emoji}>{emoji}</AppText>
      </View>

      <View style={styles.body}>
        <View style={styles.kicker}>
          <AppText style={styles.kickerText}>{kicker}</AppText>
        </View>
        <AppText style={styles.headline}>{headline}</AppText>
        <AppText style={styles.note}>{note}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    minHeight: 170,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
  },
  art: {
    width: 104,
    height: 104,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 34, lineHeight: 46 },
  body: { flex: 1, gap: 2, alignItems: "flex-start" },
  kicker: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  kickerText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  headline: { color: "#fff", fontWeight: "900", fontSize: 26, lineHeight: 38 },
  note: { color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 18 },
});
